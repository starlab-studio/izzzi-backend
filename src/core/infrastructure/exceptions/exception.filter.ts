import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";

import { CustomError } from "src/core/domain/errors/custom.error";
import { LoggerService } from "../services/logger.service";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof CustomError) {
      const status = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.errors
          ?.map((e) =>
            typeof e.message === "string"
              ? e.message
              : JSON.stringify(e.message),
          )
          .join(", "),
        errors: exception.errors?.map((error) => ({
          message: error.message,
          code: error.code,
          context: error.context,
        })),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as
        | string
        | { message?: string | string[]; [key: string]: unknown };

      if (typeof res === "string") {
        return response.status(status).json({
          success: false,
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: res,
        });
      }

      return response.status(status).json({
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...res,
      });
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorStack =
      exception instanceof Error
        ? exception.stack
        : typeof exception === "object" &&
            exception !== null &&
            "stack" in exception
          ? String(exception.stack)
          : undefined;
    this.logger.error(`HTTP 500 ${request.method} ${request.url}`, errorStack);
    return response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: "Internal server error",
    });
  }
}
