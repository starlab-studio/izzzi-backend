import { IResponse } from "../types";
import { BaseEntity } from "src/core/domain/entities/base.entity";
import { randomUUID } from "crypto";

export class ResponseEntity extends BaseEntity {
  private props: IResponse;

  private constructor(props: IResponse) {
    super();
    this.props = props;
  }

  static create(data: {
    quizId: string;
    fingerprint?: string | null;
    completionTimeSeconds?: number | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): ResponseEntity {
    return new ResponseEntity({
      id: randomUUID(),
      quizId: data.quizId,
      fingerprint: data.fingerprint ?? null,
      submittedAt: new Date(),
      completionTimeSeconds: data.completionTimeSeconds ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      isComplete: true,
      createdAt: new Date(),
    });
  }

  static reconstitute(data: IResponse): ResponseEntity {
    return new ResponseEntity(data);
  }

  get id(): string {
    return this.props.id;
  }
  get quizId(): string {
    return this.props.quizId;
  }
  get fingerprint(): string | null {
    return this.props.fingerprint;
  }
  get submittedAt(): Date {
    return this.props.submittedAt;
  }
  get completionTimeSeconds(): number | null {
    return this.props.completionTimeSeconds;
  }
  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get isComplete(): boolean {
    return this.props.isComplete;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPersistence(): IResponse {
    return { ...this.props };
  }
}

