import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  GetQuizzesBySubjectInput,
  GetQuizzesBySubjectOutput,
  QuizResponse,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { QRCodeService } from "../../infrastructure/services/qr-code.service";

export class GetQuizzesBySubjectUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetQuizzesBySubjectInput): Promise<GetQuizzesBySubjectOutput> {
    try {
      // Validate user belongs to organization
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const subjectEntity = await this.subjectRepository.findById(data.subjectId);
      if (!subjectEntity) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Subject not found");
      }

      if (subjectEntity.organizationId !== data.organizationId) {
        throw new DomainError(ErrorCode.UNAUTHORIZED_ACCESS, "Unauthorized access to subject");
      }

      const quizzes = await this.quizRepository.findBySubject(data.subjectId);

      const templateIds = quizzes.map((q) => q.templateId);
      const templates = await this.quizTemplateRepository.findByIds(templateIds);
      const templateMap = new Map(templates.map((t) => [t.id, t]));

      const quizzesResponse: QuizResponse[] = await Promise.all(
        quizzes.map(async (quiz) => {
          const template = templateMap.get(quiz.templateId);
          
          let qrCodeUrl = quiz.qrCodeUrl;
          if (!qrCodeUrl && quiz.publicUrl) {
            qrCodeUrl = await QRCodeService.generateQRCodeDataURL(quiz.publicUrl);
            
            quiz.updateUrls(quiz.publicUrl, qrCodeUrl);
            await this.quizRepository.save(quiz);
          }
          
          return {
            id: quiz.id,
            type: quiz.type,
            status: quiz.status,
            accessToken: quiz.accessToken,
            publicUrl: quiz.publicUrl,
            qrCodeUrl: qrCodeUrl,
            responseCount: quiz.responseCount,
            template: {
              id: template?.id || quiz.templateId,
              name: template?.name || "Unknown Template",
            },
          };
        })
      );

      return { quizzes: quizzesResponse };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

