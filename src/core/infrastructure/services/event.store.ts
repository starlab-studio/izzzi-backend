import { Injectable } from "@nestjs/common";
import { Queue, Worker } from "bullmq";

import {
  IEventStore,
  IDomainEvent,
} from "src/core/application/events/base.event";

@Injectable()
export class EventStore implements IEventStore {
  public readonly events: IDomainEvent[] = [];

  constructor(private eventQueue: Queue) {}

  async publish(event: IDomainEvent) {
    this.events.push(event);
    this.eventQueue.add(event.name, event);
  }

  async subscribe(
    eventName: string,
    handler: (event: IDomainEvent) => void
  ): Promise<void> {
    new Worker(this.eventQueue.name, async (job) => {
      if (job.name === eventName) {
        await handler(job.data as IDomainEvent);
      }
    });
  }
}
