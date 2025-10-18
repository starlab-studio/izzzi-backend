import { CustomError, CustomErrorContent } from "./custom.error";

export class DomainError extends CustomError {
  readonly statusCode = 400;
  readonly logging = false;
  readonly errors: CustomErrorContent[];

  constructor(code: string, message: string, context?: { [key: string]: any }) {
    super(message);
    this.errors = [{ code, message, context }];
  }
}
