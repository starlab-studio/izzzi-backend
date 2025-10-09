import { CustomError, CustomErrorContent } from "./custom.error";

export class ApplicationError extends CustomError {
  readonly statusCode = 500;
  readonly logging = true;
  readonly errors: CustomErrorContent[];

  constructor(message: string, context?: { [key: string]: any }) {
    super(message);
    this.errors = [{ message, context }];
  }
}
