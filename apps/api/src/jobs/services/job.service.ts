import type { Job } from "@commerceflow/types";
import type { CreateJobInput, ListJobsQuery } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  DefaultJobExecutorFactory,
  getJobExecutorFactory,
  type JobExecutor,
} from "../executors";
import { JOB_ERROR_CODES, JobError } from "../errors";
import { getJobRepository, type JobRepository } from "../repositories";
import { JobScheduler, jobScheduler } from "./job-scheduler";

export interface JobServiceDependencies {
  readonly jobRepository?: JobRepository;
  readonly jobExecutorFactory?: DefaultJobExecutorFactory;
  readonly jobScheduler?: JobScheduler;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class JobService {
  private readonly jobRepository: JobRepository;
  private readonly jobExecutorFactory: DefaultJobExecutorFactory;
  private readonly jobScheduler: JobScheduler;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: JobServiceDependencies = {}) {
    this.jobRepository = dependencies.jobRepository ?? getJobRepository();
    this.jobExecutorFactory =
      dependencies.jobExecutorFactory ?? getJobExecutorFactory();
    this.jobScheduler = dependencies.jobScheduler ?? jobScheduler;
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createJob(input: CreateJobInput): Promise<Job> {
    const scheduledFor = this.jobScheduler.resolveScheduledFor(
      input.scheduledFor,
    );

    let job: Job;

    try {
      job = await this.jobRepository.create(input, scheduledFor);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishJobCreated(job);
    return job;
  }

  async getJob(storeId: string, id: string): Promise<Job> {
    const job = await this.jobRepository.findById(storeId, id);

    if (!job) {
      throw new JobError(
        JOB_ERROR_CODES.NOT_FOUND,
        "Job not found",
        404,
      );
    }

    return job;
  }

  async listJobs(query: ListJobsQuery) {
    return this.jobRepository.list(query);
  }

  async runJob(storeId: string, id: string): Promise<Job> {
    const existing = await this.getJob(storeId, id);

    if (existing.status === "completed") {
      throw new JobError(
        JOB_ERROR_CODES.ALREADY_COMPLETED,
        "Completed jobs cannot run again",
        409,
      );
    }

    if (existing.status !== "pending") {
      throw new JobError(
        JOB_ERROR_CODES.INVALID_STATE,
        "Only pending jobs can be executed",
        409,
      );
    }

    const startedAt = new Date().toISOString();
    let runningJob: Job;

    try {
      runningJob = await this.jobRepository.markRunning(
        storeId,
        id,
        startedAt,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishJobStarted(runningJob);

    const executor = this.resolveExecutor(runningJob.type);
    const result = await executor.execute(runningJob);
    const completedAt = new Date().toISOString();

    if (result.success) {
      let completedJob: Job;

      try {
        completedJob = await this.jobRepository.markCompleted(
          storeId,
          id,
          completedAt,
        );
      } catch (error) {
        throw this.mapRepositoryError(error);
      }

      this.domainEventPublisher.publishJobCompleted(completedJob);
      return completedJob;
    }

    let failedJob: Job;

    try {
      failedJob = await this.jobRepository.markFailed(
        storeId,
        id,
        completedAt,
        result.message ?? "Job execution failed",
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishJobFailed(failedJob);
    return failedJob;
  }

  private resolveExecutor(type: string): JobExecutor {
    return this.jobExecutorFactory.resolve(type);
  }

  private mapRepositoryError(error: unknown): JobError {
    if (error instanceof JobError) {
      return error;
    }

    return new JobError(
      JOB_ERROR_CODES.REPOSITORY_ERROR,
      error instanceof Error ? error.message : "Job repository error",
      500,
    );
  }
}

export const jobService = new JobService();
