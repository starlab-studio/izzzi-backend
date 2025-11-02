export interface IDomainEvent<TPayload = any> {
  readonly name: string;
  readonly occurredOn: Date;
  readonly payload: TPayload;
}

export interface IEventStore {
  events: IDomainEvent[];
  publish(event: IDomainEvent): void;
  subscribe(eventName: string, handler: (event: IDomainEvent) => void): void;
}

export interface IEventListener {
  listen(): void;
}
