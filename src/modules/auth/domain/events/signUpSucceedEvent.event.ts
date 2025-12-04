import { SignUpSucceedPayload, ISignUpSucceedEvent } from "../types";

export class SignUpSucceedEvent implements ISignUpSucceedEvent {
  readonly name: string = "signup.succeed";
  readonly occurredOn: Date;
  readonly payload: SignUpSucceedPayload;

  constructor(playload: SignUpSucceedPayload) {
    this.occurredOn = new Date();
    this.payload = playload;
  }
}
