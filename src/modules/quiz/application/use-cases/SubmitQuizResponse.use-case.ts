import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  SubmitQuizResponseInput,
  SubmitQuizResponseOutput,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { IResponseRepository } from "../../domain/repositories/response.repository";
import { IAnswerRepository } from "../../domain/repositories/answer.repository";
import { IStudentQuizTokenRepository } from "../../domain/repositories/student-quiz-token.repository";
import { ResponseEntity } from "../../domain/entities/response.entity";
import { AnswerEntity } from "../../domain/entities/answer.entity";
import { createHash } from "crypto";

export class SubmitQuizResponseUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly studentQuizTokenRepository: IStudentQuizTokenRepository,
  ) {
    super(logger);
  }

  async execute(data: SubmitQuizResponseInput): Promise<SubmitQuizResponseOutput> {
    try {
      // Get quiz
      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      // Check if quiz is active or draft (closed quizzes cannot receive responses)
      if (quiz.status === "closed") {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz is closed");
      }

      // Get template to validate questions
      const template = await this.quizTemplateRepository.findById(quiz.templateId);
      if (!template) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Template not found");
      }

      // Validate that all required questions are answered
      const requiredQuestions = template.questionsList.filter(
        (q) => q.validationRules?.required
      );
      const answeredQuestionIds = new Set(data.responses.map((r) => r.questionId));
      
      for (const question of requiredQuestions) {
        if (!answeredQuestionIds.has(question.id)) {
          throw new DomainError(
            ErrorCode.UNEXPECTED_ERROR,
            `Required question ${question.id} is not answered`
          );
        }
      }

      // Generate fingerprint to prevent duplicate submissions
      const fingerprintData = `${data.quizId}-${data.ipAddress || ""}-${data.userAgent || ""}`;
      const fingerprint = createHash("sha256").update(fingerprintData).digest("hex");

      // Check for duplicate submission using fingerprint for this specific quiz
      const duplicate = await this.responseRepository.findByQuizAndFingerprint(quiz.id, fingerprint);
      if (duplicate) {
        throw new DomainError(
          ErrorCode.UNEXPECTED_ERROR,
          "Vous avez déjà répondu à ce formulaire. Merci pour votre participation !"
        );
      }

      // Create response entity
      const response = ResponseEntity.create({
        quizId: data.quizId,
        fingerprint,
        completionTimeSeconds: data.completionTimeSeconds,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      // Save response
      const savedResponse = await this.responseRepository.create(response);

      // Create answers
      const answers = data.responses.map((r) => {
        const question = template.questionsList.find((q) => q.id === r.questionId);
        if (!question) {
          throw new DomainError(ErrorCode.UNEXPECTED_ERROR, `Question ${r.questionId} not found`);
        }

        return AnswerEntity.create({
          responseId: savedResponse.id,
          questionId: r.questionId,
          valueStars: r.valueNumber ?? null,
          valueRadio: r.valueText && question.type === "radio" ? r.valueText : null,
          valueCheckbox: Array.isArray(r.valueJson) ? r.valueJson : null,
          valueText: r.valueText && question.type === "textarea" ? r.valueText : null,
        });
      });

      // Save all answers
      for (const answer of answers) {
        await this.answerRepository.create(answer);
      }

      // Increment response count on quiz
      quiz.incrementResponseCount();
      await this.quizRepository.save(quiz);

      // Mark student token as responded if token is provided
      if (data.studentToken) {
        const studentToken = await this.studentQuizTokenRepository.findByToken(data.studentToken);
        if (studentToken && studentToken.quizId === data.quizId && !studentToken.hasResponded) {
          studentToken.markAsResponded();
          await this.studentQuizTokenRepository.save(studentToken);
        }
      }

      return {
        responseId: savedResponse.id,
        success: true,
        message: "Merci pour votre retour !",
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

