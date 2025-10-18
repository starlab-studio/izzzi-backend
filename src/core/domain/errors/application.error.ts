import { CustomError, CustomErrorContent } from "./custom.error";

export class ApplicationError extends CustomError {
  readonly statusCode = 500;
  readonly logging = true;
  readonly errors: CustomErrorContent[];

  constructor(code: string, message: string, context?: { [key: string]: any }) {
    super(message);
    this.errors = [{ code, message, context }];
  }
}
