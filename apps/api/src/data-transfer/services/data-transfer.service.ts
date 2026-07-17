import type { ExportJob, ImportJob } from "@commerceflow/types";
import type {
  CreateExportJobInput,
  CreateImportJobInput,
  ListExportJobsQuery,
  ListImportJobsQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { DATA_TRANSFER_ERROR_CODES, DataTransferError } from "../errors";
import {
  placeholderExportProcessor,
  placeholderImportProcessor,
  type ExportProcessor,
  type ImportProcessor,
} from "../processors";
import {
  getExportRepository,
  getImportRepository,
  type ExportRepository,
  type ImportRepository,
} from "../repositories";

export interface DataTransferServiceDependencies {
  readonly importRepository?: ImportRepository;
  readonly exportRepository?: ExportRepository;
  readonly importProcessor?: ImportProcessor;
  readonly exportProcessor?: ExportProcessor;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class DataTransferService {
  private readonly importRepository: ImportRepository;
  private readonly exportRepository: ExportRepository;
  private readonly importProcessor: ImportProcessor;
  private readonly exportProcessor: ExportProcessor;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: DataTransferServiceDependencies = {}) {
    this.importRepository =
      dependencies.importRepository ?? getImportRepository();
    this.exportRepository =
      dependencies.exportRepository ?? getExportRepository();
    this.importProcessor =
      dependencies.importProcessor ?? placeholderImportProcessor;
    this.exportProcessor =
      dependencies.exportProcessor ?? placeholderExportProcessor;
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createImportJob(input: CreateImportJobInput): Promise<ImportJob> {
    let job: ImportJob;

    try {
      job = await this.importRepository.create(input);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishImportCreated(job);
    return this.processImportJob(job);
  }

  async getImportJob(storeId: string, id: string): Promise<ImportJob> {
    const job = await this.importRepository.findById(storeId, id);

    if (!job) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.NOT_FOUND,
        "Import job not found",
        404,
      );
    }

    return job;
  }

  async listImportJobs(query: ListImportJobsQuery) {
    return this.importRepository.list(query);
  }

  async createExportJob(input: CreateExportJobInput): Promise<ExportJob> {
    let job: ExportJob;

    try {
      job = await this.exportRepository.create(input);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishExportCreated(job);
    return this.processExportJob(job);
  }

  async getExportJob(storeId: string, id: string): Promise<ExportJob> {
    const job = await this.exportRepository.findById(storeId, id);

    if (!job) {
      throw new DataTransferError(
        DATA_TRANSFER_ERROR_CODES.NOT_FOUND,
        "Export job not found",
        404,
      );
    }

    return job;
  }

  async listExportJobs(query: ListExportJobsQuery) {
    return this.exportRepository.list(query);
  }

  private async processImportJob(job: ImportJob): Promise<ImportJob> {
    let processingJob: ImportJob;

    try {
      processingJob = await this.importRepository.markProcessing(
        job.storeId,
        job.id,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    const result = await this.importProcessor.process(processingJob);
    const completedAt = new Date().toISOString();

    if (result.success) {
      let completedJob: ImportJob;

      try {
        completedJob = await this.importRepository.markCompleted(
          job.storeId,
          job.id,
          completedAt,
          result.resultMetadata ?? {},
        );
      } catch (error) {
        throw this.mapRepositoryError(error);
      }

      this.domainEventPublisher.publishImportCompleted(completedJob);
      return completedJob;
    }

    let failedJob: ImportJob;

    try {
      failedJob = await this.importRepository.markFailed(
        job.storeId,
        job.id,
        completedAt,
        result.failureReason ?? "Import processing failed",
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishImportFailed(failedJob);
    return failedJob;
  }

  private async processExportJob(job: ExportJob): Promise<ExportJob> {
    let processingJob: ExportJob;

    try {
      processingJob = await this.exportRepository.markProcessing(
        job.storeId,
        job.id,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    const result = await this.exportProcessor.process(processingJob);
    const completedAt = new Date().toISOString();

    if (result.success) {
      let completedJob: ExportJob;

      try {
        completedJob = await this.exportRepository.markCompleted(
          job.storeId,
          job.id,
          completedAt,
          result.resultMetadata ?? {},
        );
      } catch (error) {
        throw this.mapRepositoryError(error);
      }

      this.domainEventPublisher.publishExportCompleted(completedJob);
      return completedJob;
    }

    let failedJob: ExportJob;

    try {
      failedJob = await this.exportRepository.markFailed(
        job.storeId,
        job.id,
        completedAt,
        result.failureReason ?? "Export processing failed",
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }

    this.domainEventPublisher.publishExportFailed(failedJob);
    return failedJob;
  }

  private mapRepositoryError(error: unknown): DataTransferError {
    if (error instanceof DataTransferError) {
      return error;
    }

    return new DataTransferError(
      DATA_TRANSFER_ERROR_CODES.REPOSITORY_ERROR,
      error instanceof Error ? error.message : "Data transfer repository error",
      500,
    );
  }
}

export const dataTransferService = new DataTransferService();
