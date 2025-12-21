import { CustomError, CustomErrorContent } from "./custom.error";
import { HTTP_STATUS } from "../constants/http-status.constants";

export class DomainError extends CustomError {
  readonly statusCode: number;
  readonly logging = false;
  readonly errors: CustomErrorContent[];

  constructor(
    code: string,
    message: string,
    context?: { [key: string]: any },
    statusCode: number = HTTP_STATUS.BAD_REQUEST
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = [{ code, message, context }];
  }
}
