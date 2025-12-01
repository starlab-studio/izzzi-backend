import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  EventStore,
  ErrorCode,
} from "src/core";

import { Class } from "../../domain/entities/class.entity";
import { IClass, IClassCreate } from "../../domain/types";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { ClassDomainService } from "../../domain/services/class.domain.service";

export class CreateClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly eventStore: EventStore,
    private readonly classDomainService: ClassDomainService,
    private readonly classRepository: IClassRepository
  ) {
    super(logger);
  }

  async execute(data: IClassCreate): Promise<IClass> {
    try {
      this.classDomainService.validateClassData(data);

      const existingClass = await this.classRepository.findByName(
        data.name,
        data.organizationId
      );
      this.classDomainService.validateClassUniqueness(existingClass);

      // TODO: Vérifier la limite d'abonnement avant de créer la classe
      const classEntity = new Class(data);
      const ormClass = await this.classRepository.create(classEntity);

      if (!ormClass) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Erreur lors de la création de la classe. Veuillez réessayer plus tard."
        );
      }

      return ormClass;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompenstation(input: IClass): Promise<void> {}
}

