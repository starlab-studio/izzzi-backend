import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  ApplicationError,
  ErrorCode,
} from "src/core";

import { ISubject, ISubjectCreate } from "../../domain/types";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { SubjectDomainService } from "../../domain/services/subject.domain.service";

export class CreateSubjectUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly subjectDomainService: SubjectDomainService,
    private readonly subjectRepository: ISubjectRepository,
  ) {
    super(logger);
  }

  async execute(data: ISubjectCreate): Promise<ISubject> {
    try {
      this.subjectDomainService.validateSubjectData(data);

      const existingSubject = await this.subjectRepository.findByName(
        data.name,
        data.organizationId,
      );
      this.subjectDomainService.validateSubjectUniqueness(existingSubject);

      const ormSubject = await this.subjectRepository.create({
        name: data.name,
        description: data.description,
        color: data.color,
        organizationId: data.organizationId,
        userId: data.userId,
      });

      if (!ormSubject) {
        throw new ApplicationError(
          ErrorCode.APPLICATION_FAILED_TO_CREATE,
          "Erreur lors de la création du sujet. Veuillez réessayer plus tard.",
        );
      }

      return ormSubject;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompenstation(): Promise<void> {}
}
