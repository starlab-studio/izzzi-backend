import { CustomError } from "src/core/domain/errors/custom.error";
import { ApplicationError } from "src/core/domain/errors/application.error";
import { ILoggerService } from "../services/logger.service";

interface Response<T> {
  success: boolean;
  data?: T;
  errors?: { message: string; context?: Record<string, any> }[];
}

export class BaseUseCase {
  public readonly logger: ILoggerService;

  constructor(logger: ILoggerService) {
    this.logger = logger;
  }

  protected handleError(error: unknown): never {
    if (error instanceof CustomError) {
      if (error.logging) {
        this.logger.error(
          error.errors.map((e) => e.message).join(", "),
          JSON.stringify(error.errors)
        );
      }
      throw error;
    }

    const errorInfo = {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    const appError = new ApplicationError("Unexpected error", {
      error: errorInfo,
    });
    this.logger.error(
      appError.errors.map((e) => e.message).join(", "),
      JSON.stringify(appError.errors)
    );
    throw appError;
  }

  protected success<T>(data: T): Response<T> {
    return { success: true, data };
  }

  protected failure<T>(
    message: string,
    context?: Record<string, any>
  ): Response<T> {
    return { success: false, errors: [{ message, context }] };
  }
}
