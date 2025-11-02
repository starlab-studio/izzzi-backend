import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { LoggerService } from "src/core";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    const { method, url } = req;
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.info(`${method} ${url} ${res.statusCode} - ${ms}ms`);
        },
        error: () => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} - error - ${ms}ms`);
        },
      })
    );
  }
}
