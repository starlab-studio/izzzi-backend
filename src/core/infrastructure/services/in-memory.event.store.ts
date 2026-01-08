import { Injectable } from "@nestjs/common";
import { IDomainEvent, IEventStore } from "src/core/domain/events/core.event";

@Injectable()
export class InMemoryEventStore implements IEventStore {
  public readonly events: IDomainEvent[] = [];
  private readonly subscribers: Array<{
    eventName: string;
    handler: (event: IDomainEvent) => void | Promise<void>;
  }> = [];

  publish(event: IDomainEvent): void {
    this.events.push(event);
    const handlerResults = this.subscribers
      .filter((s) => s.eventName === event.name || s.eventName === "*")
      .map((s) => s.handler(event));
    const promises = handlerResults.filter(
      (result): result is Promise<void> => result instanceof Promise,
    );
    if (promises.length > 0) {
      void Promise.allSettled(promises);
    }
  }

  subscribe(
    eventName: string,
    handler: (event: IDomainEvent) => void | Promise<void>,
  ): void {
    this.subscribers.push({ eventName, handler });
  }
}
