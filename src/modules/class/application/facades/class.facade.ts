import { IClass, IClassCreate } from "../../domain/types";
import { CreateClassUseCase } from "../use-cases/CreateClass.use-case";
import { IEventStore, IUnitOfWork } from "src/core";
import { ClassCreatedEvent } from "../../domain/events/classCreated.event";

export class ClassFacade {
  constructor(
    private readonly createClassUseCase: CreateClassUseCase,
    private readonly eventStore: IEventStore,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async createClass(data: IClassCreate, userEmail: string): Promise<IClass> {
    return await this.unitOfWork.withTransaction(async (uow) => {
      const createdClass = await this.createClassUseCase.execute(data);
  
      this.eventStore.publish(
        new ClassCreatedEvent({
          id: createdClass.id,
          name: createdClass.name,
          code: createdClass.code,
          description: createdClass.description,
          organizationId: createdClass.organizationId,
          userId: createdClass.userId,
          userEmail,
        }),
      );

      return createdClass;
    });
  }
}
