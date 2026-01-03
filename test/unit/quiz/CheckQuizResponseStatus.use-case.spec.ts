import { Test, TestingModule } from "@nestjs/testing";
import { CheckQuizResponseStatusUseCase } from "src/modules/quiz/application/use-cases/CheckQuizResponseStatus.use-case";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";
import { ILoggerService, DomainError, ErrorCode, LoggerService } from "src/core";
import { QuizEntity } from "src/modules/quiz/domain/entities/quiz.entity";

describe("CheckQuizResponseStatusUseCase", () => {
  let useCase: CheckQuizResponseStatusUseCase;
  let quizRepository: jest.Mocked<IQuizRepository>;
  let responseRepository: jest.Mocked<IResponseRepository>;
  let logger: jest.Mocked<ILoggerService>;

  const mockQuiz = QuizEntity.create({
    subjectId: "subject-id",
    templateId: "template-id",
    type: "during_course",
    accessToken: "token-123",
  });

  beforeEach(async () => {
    const mockQuizRepo = {
      findById: jest.fn(),
    };

    const mockResponseRepo = {
      findByQuizAndFingerprint: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    quizRepository = mockQuizRepo as any;
    responseRepository = mockResponseRepo as any;
    logger = mockLogger as any;
    useCase = new CheckQuizResponseStatusUseCase(logger, quizRepository, responseRepository);
  });

  it("should return hasResponded true when response exists", async () => {
    const input = {
      quizId: mockQuiz.id,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    quizRepository.findById.mockResolvedValue(mockQuiz);
    responseRepository.findByQuizAndFingerprint.mockResolvedValue({
      id: "response-id",
    } as any);

    const result = await useCase.execute(input);

    expect(result.hasResponded).toBe(true);
    expect(result.responseId).toBe("response-id");
  });

  it("should return hasResponded false when no response exists", async () => {
    const input = {
      quizId: mockQuiz.id,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    quizRepository.findById.mockResolvedValue(mockQuiz);
    responseRepository.findByQuizAndFingerprint.mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result.hasResponded).toBe(false);
    expect(result.responseId).toBeNull();
  });

  it("should throw error when quiz not found", async () => {
    const input = {
      quizId: "non-existent",
      ipAddress: "127.0.0.1",
    };

    quizRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should generate consistent fingerprint for same input", async () => {
    const input = {
      quizId: mockQuiz.id,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    quizRepository.findById.mockResolvedValue(mockQuiz);
    responseRepository.findByQuizAndFingerprint.mockResolvedValue(null);

    await useCase.execute(input);

    expect(responseRepository.findByQuizAndFingerprint).toHaveBeenCalledWith(
      mockQuiz.id,
      expect.any(String)
    );
  });
});

