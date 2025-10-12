import { Injectable, Logger } from "@nestjs/common";

import { ILoggerService } from "src/core/application/services/logger.service";

@Injectable()
export class LoggerService implements ILoggerService {
  private readonly logger = new Logger("AppLogger");

  info(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }
}
