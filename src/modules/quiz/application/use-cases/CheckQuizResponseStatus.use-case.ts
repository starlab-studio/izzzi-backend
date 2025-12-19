import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  CheckQuizResponseStatusInput,
  CheckQuizResponseStatusOutput,
} from "../../domain/types";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IResponseRepository } from "../../domain/repositories/response.repository";
import { createHash } from "crypto";

export class CheckQuizResponseStatusUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository,
  ) {
    super(logger);
  }

  async execute(data: CheckQuizResponseStatusInput): Promise<CheckQuizResponseStatusOutput> {
    try {
      // Get quiz
      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      // Generate fingerprint to check if already responded
      const fingerprintData = `${data.quizId}-${data.ipAddress || ""}-${data.userAgent || ""}`;
      const fingerprint = createHash("sha256").update(fingerprintData).digest("hex");

      // Check if response exists with this fingerprint for this specific quiz
      const existingResponse = await this.responseRepository.findByQuizAndFingerprint(quiz.id, fingerprint);
      
      return {
        hasResponded: !!existingResponse,
        responseId: existingResponse?.id || null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

