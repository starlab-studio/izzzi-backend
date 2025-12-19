import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetQuizLinkInput,
  GetQuizLinkOutput,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { QRCodeService } from "../../infrastructure/services/qr-code.service";

export class GetQuizLinkUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetQuizLinkInput): Promise<GetQuizLinkOutput> {
    try {
      // Validate user belongs to organization
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      const subject = await this.subjectRepository.findById(quiz.subjectId);
      if (!subject) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Subject not found");
      }

      if (subject.organizationId !== data.organizationId) {
        throw new DomainError(ErrorCode.UNAUTHORIZED_ACCESS, "Unauthorized access to quiz");
      }

      if (!quiz.publicUrl) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz public URL not available");
      }

      let qrCodeUrl = quiz.qrCodeUrl;
      if (!qrCodeUrl) {
        qrCodeUrl = await QRCodeService.generateQRCodeDataURL(quiz.publicUrl);
        
        quiz.updateUrls(quiz.publicUrl, qrCodeUrl);
        await this.quizRepository.save(quiz);
      }

      return {
        publicUrl: quiz.publicUrl,
        qrCodeUrl: qrCodeUrl,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

