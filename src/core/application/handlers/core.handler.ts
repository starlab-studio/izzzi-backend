import { IDomainEvent } from "../events/core.event";
import { ILoggerService } from "../services/logger.service";

export interface IEventHandler<T = any> {
  handle(event: IDomainEvent<T>): Promise<void>;
  canHandle(eventName: string): boolean;
}

export abstract class BaseEventHandler<T = any> implements IEventHandler<T> {
  constructor(protected readonly logger: ILoggerService) {}

  abstract handle(event: IDomainEvent<T>): Promise<void>;
  abstract canHandle(eventName: string): boolean;

  protected logEventHandling(event: IDomainEvent<T>): void {
    this.logger.info(
      `Handling event: ${event.name}. Occured on ${event.occurredOn}`
    );
  }

  protected logEventHandlingError(event: IDomainEvent<T>, error: Error): void {
    this.logger.warn(
      `Error handling event: ${event.name}. Error : ${error.message}`
    );
  }
}
