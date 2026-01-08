import { IEventStore, IDomainEvent } from "../../domain/events/core.event";
import { ILoggerService } from "../services/logger.service";
import { DomainError } from "src/core/domain/errors/domain.error";
import { ErrorCode } from "src/core/domain/errors/code.error";
import { IEventHandler } from "./core.handler";

export class EventHandlerRegistry {
  private handlers: Map<string, IEventHandler[]> = new Map();

  constructor(
    private readonly eventStore: IEventStore,
    private readonly logger: ILoggerService,
  ) {}

  registerHandler(eventName: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.eventStore.subscribe(eventName, (event: IDomainEvent) => {
      void this.handleEvent(event);
    });
    this.handlers.get(eventName)!.push(handler);
    this.logger.info(`Registered handler for event: ${eventName}`);
  }

  async handleEvent(event: IDomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.name) || [];

    if (eventHandlers.length === 0) {
      this.logger.warn(`No handlers found for event: ${event.name}`);
      return;
    }

    this.logger.info(
      `Processing event: ${event.name} with ${eventHandlers.length} handler(s)`,
    );

    const handlerPromises = eventHandlers.map(async (handler) => {
      try {
        if (handler.canHandle(event.name)) {
          await handler.handle(event);
        }
      } catch (error) {
        this.logger.warn(`Handler failed for event: ${event.name} - ${error}`);
        throw new DomainError(
          ErrorCode.EVENT_HANDLER_FAILED,
          `Handler failed for event: ${event.name}`,
          {
            eventName: event.name,
          },
        );
      }
    });

    await Promise.allSettled(handlerPromises);
  }

  listen(): void {
    this.eventStore.subscribe("*", (event: IDomainEvent) => {
      void this.handleEvent(event);
    });
  }
}
