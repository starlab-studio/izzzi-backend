import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QuizModule } from "src/modules/quiz/quiz.module";
import { CoreModule } from "src/core/core.module";
import { SubmitQuizResponseUseCase } from "src/modules/quiz/application/use-cases/SubmitQuizResponse.use-case";
import { CheckQuizResponseStatusUseCase } from "src/modules/quiz/application/use-cases/CheckQuizResponseStatus.use-case";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";
import { IQuizTemplateRepository } from "src/modules/quiz/domain/repositories/quiz-template.repository";
import { QuizEntity } from "src/modules/quiz/domain/entities/quiz.entity";
import { QuizTemplateEntity } from "src/modules/quiz/domain/entities/quiz-template.entity";
import { EmailProvider } from "src/modules/notification/infrastructure/providers/email.provider";
import { StripeSyncService } from "src/modules/payment/infrastructure/services/stripe-sync.service";
import { STRIPE_SYNC_SERVICE } from "src/modules/payment/domain/services/stripe-sync.service";
import { CognitoAdapter } from "src/modules/auth/infrastructure/factories/cognito.adapter";
import { randomUUID } from "crypto";
import { DomainError, ErrorCode } from "src/core";
import { DataSource } from "typeorm";
import { createMockEmailProvider, createMockStripeSyncService, createMockCognitoAdapter } from "../test-helpers";
import { waitForDatabase } from "../db-helper";

describe("Quiz Integration", () => {
  let app: INestApplication;
  let submitResponseUseCase: SubmitQuizResponseUseCase;
  let checkStatusUseCase: CheckQuizResponseStatusUseCase;
  let quizRepository: IQuizRepository;
  let responseRepository: IResponseRepository;
  let quizTemplateRepository: IQuizTemplateRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: "postgres",
            host: process.env.DATABASE_HOST || "localhost",
            port: parseInt(process.env.DATABASE_PORT || "5432"),
            database: process.env.DATABASE_NAME || "test_db",
            username: process.env.DATABASE_USERNAME || "postgres",
            password: process.env.DATABASE_PASSWORD || "postgres",
            synchronize: true,
            autoLoadEntities: true,
            dropSchema: true,
            extra: {
              max: 10,
              connectionTimeoutMillis: 10000,
              idleTimeoutMillis: 30000,
            },
            retryAttempts: 5,
            retryDelay: 3000,
          }),
        }),
        CoreModule,
        QuizModule,
      ],
    })
      .overrideProvider(EmailProvider)
      .useValue(createMockEmailProvider())
      .overrideProvider(StripeSyncService)
      .useValue(createMockStripeSyncService())
      .overrideProvider(STRIPE_SYNC_SERVICE)
      .useValue(createMockStripeSyncService())
      .overrideProvider(CognitoAdapter)
      .useValue(createMockCognitoAdapter())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    await waitForDatabase(dataSource);

    submitResponseUseCase = moduleFixture.get<SubmitQuizResponseUseCase>(SubmitQuizResponseUseCase);
    checkStatusUseCase = moduleFixture.get<CheckQuizResponseStatusUseCase>(CheckQuizResponseStatusUseCase);
    quizRepository = moduleFixture.get<IQuizRepository>("QUIZ_REPOSITORY");
    responseRepository = moduleFixture.get<IResponseRepository>("RESPONSE_REPOSITORY");
    quizTemplateRepository = moduleFixture.get<IQuizTemplateRepository>("QUIZ_TEMPLATE_REPOSITORY");
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it("should submit quiz response and create answer entities", async () => {
    const template = QuizTemplateEntity.create({
      type: "during_course",
      name: "Test Template",
    });
    const questionId = randomUUID();
    template.setQuestions([
      {
        id: questionId,
        templateId: template.id,
        text: "Rate the course",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 0,
        category: "global",
        createdAt: new Date(),
      },
    ]);
    // Use create instead of save to persist questions
    const savedTemplate = await quizTemplateRepository.create(template);

    const quiz = QuizEntity.create({
      subjectId: randomUUID(),
      templateId: savedTemplate.id,
      type: "during_course",
      accessToken: "token-123",
    });
    quiz.activate();
    const savedQuiz = await quizRepository.save(quiz);

    const result = await submitResponseUseCase.execute({
      quizId: savedQuiz.id,
      responses: [{ questionId: questionId, valueNumber: 5 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completionTimeSeconds: 120,
    });

    expect(result.success).toBe(true);
    expect(result.responseId).toBeDefined();

    const response = await responseRepository.findById(result.responseId!);
    expect(response).toBeDefined();
    if (response) {
      expect(response.quizId).toBe(savedQuiz.id);
    }

    const status = await checkStatusUseCase.execute({
      quizId: savedQuiz.id,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });

    expect(status.hasResponded).toBe(true);
  });

  it("should verify fingerprint prevents duplicate submissions", async () => {
    const template2 = QuizTemplateEntity.create({
      type: "during_course",
      name: "Test Template 2",
    });
    const questionId2 = randomUUID();
    template2.setQuestions([
      {
        id: questionId2,
        templateId: template2.id,
        text: "Rate the course",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 0,
        category: "global",
        createdAt: new Date(),
      },
    ]);
    // Use create instead of save to persist questions
    const savedTemplate2 = await quizTemplateRepository.create(template2);
    const quiz = QuizEntity.create({
      subjectId: randomUUID(),
      templateId: savedTemplate2.id,
      type: "during_course",
      accessToken: "token-456",
    });
    quiz.activate();
    const savedQuiz = await quizRepository.save(quiz);

    const input = {
      quizId: savedQuiz.id,
      responses: [{ questionId: questionId2, valueNumber: 4 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    };

    const firstResult = await submitResponseUseCase.execute(input);
    expect(firstResult.success).toBe(true);

    await expect(submitResponseUseCase.execute(input)).rejects.toThrow(DomainError);
  });

  it("should reject submission for non-existent quiz", async () => {
    await expect(submitResponseUseCase.execute({
      quizId: randomUUID(),
      responses: [{ questionId: randomUUID(), valueNumber: 5 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completionTimeSeconds: 120,
    })).rejects.toThrow(DomainError);
  });

  it("should reject submission for closed quiz", async () => {
    const template = QuizTemplateEntity.create({
      type: "during_course",
      name: "Closed Quiz Template",
    });
    const questionId = randomUUID();
    template.setQuestions([
      {
        id: questionId,
        templateId: template.id,
        text: "Rate the course",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 0,
        category: "global",
        createdAt: new Date(),
      },
    ]);
    const savedTemplate = await quizTemplateRepository.create(template);

    const quiz = QuizEntity.create({
      subjectId: randomUUID(),
      templateId: savedTemplate.id,
      type: "during_course",
      accessToken: "token-closed",
    });
    quiz.activate();
    const savedQuiz = await quizRepository.save(quiz);
    const closedQuiz = QuizEntity.reconstitute({
      ...savedQuiz.toPersistence(),
      status: "closed",
      closedAt: new Date(),
    });
    await quizRepository.save(closedQuiz);

    await expect(submitResponseUseCase.execute({
      quizId: savedQuiz.id,
      responses: [{ questionId: questionId, valueNumber: 5 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completionTimeSeconds: 120,
    })).rejects.toThrow(DomainError);
  });

  it("should reject submission with missing required questions", async () => {
    const template = QuizTemplateEntity.create({
      type: "during_course",
      name: "Required Questions Template",
    });
    const questionId1 = randomUUID();
    const questionId2 = randomUUID();
    template.setQuestions([
      {
        id: questionId1,
        templateId: template.id,
        text: "Required question 1",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 0,
        category: "global",
        createdAt: new Date(),
      },
      {
        id: questionId2,
        templateId: template.id,
        text: "Required question 2",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 1,
        category: "global",
        createdAt: new Date(),
      },
    ]);
    const savedTemplate = await quizTemplateRepository.create(template);

    const quiz = QuizEntity.create({
      subjectId: randomUUID(),
      templateId: savedTemplate.id,
      type: "during_course",
      accessToken: "token-required",
    });
    quiz.activate();
    const savedQuiz = await quizRepository.save(quiz);

    await expect(submitResponseUseCase.execute({
      quizId: savedQuiz.id,
      responses: [{ questionId: questionId1, valueNumber: 5 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completionTimeSeconds: 120,
    })).rejects.toThrow(DomainError);
  });

  it("should reject submission with invalid question ID", async () => {
    const template = QuizTemplateEntity.create({
      type: "during_course",
      name: "Invalid Question Template",
    });
    const questionId = randomUUID();
    template.setQuestions([
      {
        id: questionId,
        templateId: template.id,
        text: "Rate the course",
        type: "stars",
        options: null,
        validationRules: { required: true },
        orderIndex: 0,
        category: "global",
        createdAt: new Date(),
      },
    ]);
    const savedTemplate = await quizTemplateRepository.create(template);

    const quiz = QuizEntity.create({
      subjectId: randomUUID(),
      templateId: savedTemplate.id,
      type: "during_course",
      accessToken: "token-invalid",
    });
    quiz.activate();
    const savedQuiz = await quizRepository.save(quiz);

    await expect(submitResponseUseCase.execute({
      quizId: savedQuiz.id,
      responses: [{ questionId: randomUUID(), valueNumber: 5 }],
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completionTimeSeconds: 120,
    })).rejects.toThrow();
  });
});

