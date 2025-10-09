import { CustomError } from "src/core/domain/errors/custom.error";
import { DomainError } from "src/core/domain/errors/domain.error";
import { ApplicationError } from "src/core/domain/errors/application.error";
import { ILoggerService } from "./logger.service";

export interface Response<T> {
  success: boolean;
  data?: T;
  errors?: { message: string; context?: Record<string, any> }[];
}

export abstract class BaseService {
  public readonly logger: ILoggerService;

  constructor(logger: ILoggerService) {
    this.logger = logger;
  }

  /**
   * Assert condition for domain/business rules.
   * Throws DomainError if the condition is false.
   */
  protected assert(
    condition: boolean,
    message: string,
    context?: Record<string, any>
  ) {
    if (!condition) {
      throw new DomainError(message, context);
    }
  }

  /**
   * Wrap unknown errors into ApplicationError and log if necessary
   */
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

    const appError = new ApplicationError("Unexpected error", {
      original: error,
    });
    this.logger.error(
      appError.errors.map((e) => e.message).join(", "),
      JSON.stringify(appError.errors)
    );
    throw appError;
  }

  /**
   * Standardize successful Response
   */
  protected success<T>(data: T): Response<T> {
    return { success: true, data };
  }

  /**
   * Standardize failed Response
   */
  protected failure<T>(
    message: string,
    context?: Record<string, any>
  ): Response<T> {
    return { success: false, errors: [{ message, context }] };
  }
}
