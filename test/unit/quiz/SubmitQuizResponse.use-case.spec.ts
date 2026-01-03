import { Test, TestingModule } from "@nestjs/testing";
import { SubmitQuizResponseUseCase } from "src/modules/quiz/application/use-cases/SubmitQuizResponse.use-case";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IQuizTemplateRepository } from "src/modules/quiz/domain/repositories/quiz-template.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";
import { IAnswerRepository } from "src/modules/quiz/domain/repositories/answer.repository";
import { IStudentQuizTokenRepository } from "src/modules/quiz/domain/repositories/student-quiz-token.repository";
import { ILoggerService, DomainError, ErrorCode, LoggerService } from "src/core";
import { QuizEntity } from "src/modules/quiz/domain/entities/quiz.entity";
import { QuizTemplateEntity } from "src/modules/quiz/domain/entities/quiz-template.entity";

describe("SubmitQuizResponseUseCase", () => {
  let useCase: SubmitQuizResponseUseCase;
  let quizRepository: jest.Mocked<IQuizRepository>;
  let quizTemplateRepository: jest.Mocked<IQuizTemplateRepository>;
  let responseRepository: jest.Mocked<IResponseRepository>;
  let answerRepository: jest.Mocked<IAnswerRepository>;
  let studentQuizTokenRepository: jest.Mocked<IStudentQuizTokenRepository>;
  let logger: jest.Mocked<ILoggerService>;

  const mockQuiz = QuizEntity.create({
    subjectId: "subject-id",
    templateId: "template-id",
    type: "during_course",
    accessToken: "token-123",
  });

  const mockTemplate = QuizTemplateEntity.create({
    type: "during_course",
    name: "Test Template",
  });

  beforeEach(() => {
    mockTemplate.setQuestions([
      {
        id: "q1",
        templateId: "template-id",
        text: "Question 1",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 0,
        category: "global",
        createdAt: new Date(),
      },
      {
        id: "q2",
        templateId: "template-id",
        text: "Question 2",
        type: "radio",
        options: ["Option A", "Option B"],
        validationRules: { required: false },
        orderIndex: 1,
        category: "global",
        createdAt: new Date(),
      },
    ]);
  });

  beforeEach(async () => {
    const mockQuizRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockTemplateRepo = {
      findById: jest.fn(),
    };

    const mockResponseRepo = {
      findByQuizAndFingerprint: jest.fn(),
      create: jest.fn(),
    };

    const mockAnswerRepo = {
      create: jest.fn(),
    };

    const mockTokenRepo = {
      findByToken: jest.fn(),
      save: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    quizRepository = mockQuizRepo as any;
    quizTemplateRepository = mockTemplateRepo as any;
    responseRepository = mockResponseRepo as any;
    answerRepository = mockAnswerRepo as any;
    studentQuizTokenRepository = mockTokenRepo as any;
    logger = mockLogger as any;
    useCase = new SubmitQuizResponseUseCase(
      logger,
      quizRepository,
      quizTemplateRepository,
      responseRepository,
      answerRepository,
      studentQuizTokenRepository
    );
  });

  it("should submit quiz response successfully", async () => {
    const input = {
      quizId: mockQuiz.id,
      responses: [
        { questionId: "q1", valueNumber: 5 },
        { questionId: "q2", valueText: "Option A" },
      ],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completionTimeSeconds: 120,
    };

    quizRepository.findById.mockResolvedValue(mockQuiz);
    quizTemplateRepository.findById.mockResolvedValue(mockTemplate);
    responseRepository.findByQuizAndFingerprint.mockResolvedValue(null);
    responseRepository.create.mockResolvedValue({
      id: "response-id",
      quizId: mockQuiz.id,
    } as any);
    answerRepository.create.mockResolvedValue({} as any);
    quizRepository.save.mockResolvedValue(mockQuiz);

    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(responseRepository.create).toHaveBeenCalled();
    expect(answerRepository.create).toHaveBeenCalledTimes(2);
  });

  it("should throw error when quiz not found", async () => {
    const input = {
      quizId: "non-existent",
      responses: [],
    };

    quizRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when quiz is closed", async () => {
    const closedQuiz = QuizEntity.reconstitute({
      ...mockQuiz.toPersistence(),
      status: "closed",
    });

    const input = {
      quizId: closedQuiz.id,
      responses: [],
    };

    quizRepository.findById.mockResolvedValue(closedQuiz);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error when required question not answered", async () => {
    const input = {
      quizId: mockQuiz.id,
      responses: [{ questionId: "q2", valueText: "Option A" }],
    };

    quizRepository.findById.mockResolvedValue(mockQuiz);
    quizTemplateRepository.findById.mockResolvedValue(mockTemplate);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should throw error for duplicate submission", async () => {
    const input = {
      quizId: mockQuiz.id,
      responses: [{ questionId: "q1", valueNumber: 5 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    quizRepository.findById.mockResolvedValue(mockQuiz);
    quizTemplateRepository.findById.mockResolvedValue(mockTemplate);
    responseRepository.findByQuizAndFingerprint.mockResolvedValue({
      id: "existing-response",
    } as any);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });
});

