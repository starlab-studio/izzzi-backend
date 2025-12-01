import { ISubject, ISubjectCreate } from "../../domain/types";
import { CreateSubjectUseCase } from "../use-cases/CreateSubject.use-case";
import { IEventStore } from "src/core";
import { SubjectCreatedEvent } from "../../domain/events/subjectCreated.event";

export class SubjectFacade {
  constructor(
    private readonly createSubjectUseCase: CreateSubjectUseCase,
    private readonly eventStore: IEventStore,
  ) {}

  async createSubject(
    data: ISubjectCreate,
    userEmail: string,
  ): Promise<ISubject> {
    const createdSubject = await this.createSubjectUseCase.execute(data);

    this.eventStore.publish(
      new SubjectCreatedEvent({
        id: createdSubject.id,
        name: createdSubject.name,
        description: createdSubject.description,
        color: createdSubject.color,
        organizationId: createdSubject.organizationId,
        userId: createdSubject.userId,
        userEmail,
      }),
    );

    return createdSubject;
  }
}
