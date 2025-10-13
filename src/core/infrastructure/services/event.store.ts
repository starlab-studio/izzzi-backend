import { Injectable } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";

import {
  IEventStore,
  IDomainEvent,
} from "src/core/application/events/core.event";

@Injectable()
export class EventStore implements IEventStore {
  public readonly events: IDomainEvent[] = [];

  constructor(@InjectQueue("event") private readonly eventQueue: Queue) {}

  async publish(event: IDomainEvent) {
    this.events.push(event);
    console.log("[EventStore.publish] enqueue:", (event as any).name, event);
    this.eventQueue.add(event.name, event, {
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
    const connection = this.eventQueue.opts.connection;
    console.log(
      "[EventStore.subscribe] start worker for:",
      eventName,
      "conn:",
      !!connection
    );
    new Worker(
      this.eventQueue.name,
      async (job) => {
        if (job.name === eventName) {
          console.log("[Worker] received job:", job.name, job.data);
          await handler(job.data as IDomainEvent);
        }
      },
      { connection }
    );
  }
}
