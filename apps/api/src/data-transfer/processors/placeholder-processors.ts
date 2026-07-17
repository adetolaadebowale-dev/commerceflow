import type { ExportJob, ImportJob } from "@commerceflow/types";

export interface DataTransferProcessorResult {
  readonly success: boolean;
  readonly failureReason?: string;
  readonly resultMetadata?: Record<string, unknown>;
}

export interface ImportProcessor {
  process(job: ImportJob): Promise<DataTransferProcessorResult>;
}

export interface ExportProcessor {
  process(job: ExportJob): Promise<DataTransferProcessorResult>;
}

export class PlaceholderImportProcessor implements ImportProcessor {
  async process(job: ImportJob): Promise<DataTransferProcessorResult> {
    if (job.metadata.simulateFailure === true) {
      return {
        success: false,
        failureReason: "Placeholder import processor simulated failure",
      };
    }

    return {
      success: true,
      resultMetadata: {
        processedRows: 0,
        note: "Placeholder processor — CSV parsing not implemented",
        type: job.type,
        format: job.format,
      },
    };
  }
}

export class PlaceholderExportProcessor implements ExportProcessor {
  async process(job: ExportJob): Promise<DataTransferProcessorResult> {
    if (job.metadata.simulateFailure === true) {
      return {
        success: false,
        failureReason: "Placeholder export processor simulated failure",
      };
    }

    return {
      success: true,
      resultMetadata: {
        exportedRows: 0,
        note: "Placeholder processor — CSV generation not implemented",
        type: job.type,
        format: job.format,
      },
    };
  }
}

export const placeholderImportProcessor = new PlaceholderImportProcessor();
export const placeholderExportProcessor = new PlaceholderExportProcessor();
