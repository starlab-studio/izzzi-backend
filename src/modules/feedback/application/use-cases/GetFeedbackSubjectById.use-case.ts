import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetFeedbackSubjectByIdInput,
  GetFeedbackSubjectByIdOutput,
} from "../../domain/types";
import { GetFeedbackSubjectsUseCase } from "./GetFeedbackSubjects.use-case";

export class GetFeedbackSubjectByIdUseCase
  extends BaseUseCase
  implements IUseCase<GetFeedbackSubjectByIdInput, GetFeedbackSubjectByIdOutput>
{
  constructor(
    readonly logger: ILoggerService,
    private readonly getFeedbackSubjectsUseCase: GetFeedbackSubjectsUseCase
  ) {
    super(logger);
  }

  async execute(
    data: GetFeedbackSubjectByIdInput
  ): Promise<GetFeedbackSubjectByIdOutput> {
    try {
      const result = await this.getFeedbackSubjectsUseCase.execute({
        organizationId: data.organizationId,
        userId: data.userId,
      });

      const subject = result.subjects.find(
        (s) =>
          s.subjectId === data.subjectId ||
          s.id === data.subjectId ||
          s.id.includes(data.subjectId)
      );

      if (!subject) {
        throw new DomainError(ErrorCode.SUBJECT_NOT_FOUND, "Subject not found");
      }

      return { subject };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
