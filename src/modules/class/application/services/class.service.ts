import { IClass, IClassCreate } from "../../domain/types";
import { CreateClassUseCase } from "../use-cases/CreateClass.use-case";
import { IEventStore, ILoggerService, IUnitOfWork } from "src/core";
import { ClassCreatedEvent } from "../../domain/events/classCreated.event";

export class ClassService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly eventStore: IEventStore,
    private readonly unitOfWork: IUnitOfWork,
    private readonly createClassUseCase: CreateClassUseCase,
  ) {}

  async createClass(data: IClassCreate, userEmail: string): Promise<IClass> {
    try {
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
    } catch (error) {
      this.logger.error(`Something went wrong: ${error}`, "class/service");
      throw error;
    }
  }
}
