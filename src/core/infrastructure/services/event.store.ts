import { Injectable } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";

import { IEventStore, IDomainEvent } from "src/core/domain/events/core.event";

@Injectable()
export class EventStore implements IEventStore {
  public readonly events: IDomainEvent[] = [];
  private worker: Worker | null = null;

  constructor(@InjectQueue("event") private readonly eventQueue: Queue) {}

  async publish(event: IDomainEvent) {
    this.events.push(event);
    void this.eventQueue.add(event.name, event, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }

  async subscribe(
    eventName: string,
    handler: (event: IDomainEvent) => void
  ): Promise<void> {
    if (!this.worker) {
      const connection = this.eventQueue.opts.connection;
      this.worker = new Worker(
        this.eventQueue.name,
        async (job) => {
          await handler(job.data as IDomainEvent);
        },
        { connection }
      );
    }
  }
}
