import { Test, TestingModule } from "@nestjs/testing";
import { CreateClassUseCase } from "src/modules/class/application/use-cases/CreateClass.use-case";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { IClassStudentRepository } from "src/modules/class/domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { IEventStore, ILoggerService, DomainError, ErrorCode, ApplicationError, LoggerService } from "src/core";
import { ClassLimitService } from "src/modules/class/domain/services/class-limit.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ClassEntity } from "src/modules/class/domain/entities/class.entity";
import { ClassStudentEntity } from "src/modules/class/domain/entities/class-student.entity";

describe("CreateClassUseCase", () => {
  let useCase: CreateClassUseCase;
  let classRepository: jest.Mocked<IClassRepository>;
  let classStudentRepository: jest.Mocked<IClassStudentRepository>;
  let organizationFacade: jest.Mocked<OrganizationFacade>;
  let eventStore: jest.Mocked<IEventStore>;
  let classLimitService: jest.Mocked<ClassLimitService>;
  let subscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let subscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockClassRepo = {
      findByNameAndOrganization: jest.fn(),
      create: jest.fn(),
      countByOrganization: jest.fn(),
    };

    const mockClassStudentRepo = {
      create: jest.fn(),
    };

    const mockOrgFacade = {
      validateUserCanCreateClass: jest.fn(),
    };

    const mockEventStore = {
      publish: jest.fn(),
    };

    const mockClassLimitService = {
      canCreateClass: jest.fn(),
    };

    const mockSubscriptionRepo = {
      findActiveByOrganizationId: jest.fn(),
    };

    const mockPlanRepo = {
      findById: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    classRepository = mockClassRepo as any;
    classStudentRepository = mockClassStudentRepo as any;
    organizationFacade = mockOrgFacade as any;
    eventStore = mockEventStore as any;
    classLimitService = mockClassLimitService as any;
    subscriptionRepository = mockSubscriptionRepo as any;
    subscriptionPlanRepository = mockPlanRepo as any;
    logger = mockLogger as any;
    useCase = new CreateClassUseCase(
      logger,
      classRepository,
      classStudentRepository,
      organizationFacade,
      eventStore,
      classLimitService,
      subscriptionRepository,
      subscriptionPlanRepository
    );
  });

  it("should create class successfully", async () => {
    const input = {
      name: "Test Class",
      description: "Test Description",
      numberOfStudents: 3,
      studentEmails: "student1@test.com;student2@test.com;student3@test.com",
      organizationId: "org-id",
      userId: "user-id",
      userEmail: "user@test.com",
    };

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    classRepository.findByNameAndOrganization.mockResolvedValue(null);

    const classEntity = ClassEntity.create(
      input.name,
      input.description,
      input.numberOfStudents,
      ["student1@test.com", "student2@test.com", "student3@test.com"],
      input.organizationId,
      input.userId
    );

    classRepository.create.mockResolvedValue(classEntity);
    classStudentRepository.create.mockResolvedValue({} as any);
    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result.name).toBe(input.name);
    expect(classRepository.create).toHaveBeenCalled();
    expect(classStudentRepository.create).toHaveBeenCalledTimes(3);
    expect(eventStore.publish).toHaveBeenCalled();
  });

  it("should throw error when class limit is reached", async () => {
    const input = {
      name: "Test Class",
      numberOfStudents: 3,
      studentEmails: "s1@test.com;s2@test.com;s3@test.com",
      organizationId: "org-id",
      userId: "user-id",
      userEmail: "user@test.com",
    };

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classLimitService.canCreateClass.mockResolvedValue({
      canCreate: false,
      reason: "Limit reached",
    });

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("Limit");
  });

  it("should throw error when class name already exists", async () => {
    const input = {
      name: "Existing Class",
      numberOfStudents: 2,
      studentEmails: "s1@test.com;s2@test.com",
      organizationId: "org-id",
      userId: "user-id",
      userEmail: "user@test.com",
    };

    const existingClass = ClassEntity.create(
      "Existing Class",
      null,
      2,
      ["s1@test.com", "s2@test.com"],
      "org-id",
      "user-id"
    );

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    classRepository.findByNameAndOrganization.mockResolvedValue(existingClass);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("already exists");
  });

  it("should throw error when creation fails", async () => {
    const input = {
      name: "Test Class",
      numberOfStudents: 2,
      studentEmails: "s1@test.com;s2@test.com",
      organizationId: "org-id",
      userId: "user-id",
      userEmail: "user@test.com",
    };

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    classRepository.findByNameAndOrganization.mockResolvedValue(null);
    classRepository.create.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(ApplicationError);
  });

  it("should publish ClassLimitReachedEvent when limit is reached after creation", async () => {
    const input = {
      name: "Test Class",
      numberOfStudents: 2,
      studentEmails: "s1@test.com;s2@test.com",
      organizationId: "org-id",
      userId: "user-id",
      userEmail: "user@test.com",
    };

    const classEntity = ClassEntity.create(
      input.name,
      null,
      input.numberOfStudents,
      ["s1@test.com", "s2@test.com"],
      input.organizationId,
      input.userId
    );

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    classRepository.findByNameAndOrganization.mockResolvedValue(null);
    classRepository.create.mockResolvedValue(classEntity);
    classStudentRepository.create.mockResolvedValue({} as any);

    const mockSubscription = {
      id: "sub-id",
      planId: "plan-id",
      quantity: 5,
      status: "active",
    };

    const mockPlan = {
      id: "plan-id",
      name: "izzzi",
      isFree: false,
    };

    subscriptionRepository.findActiveByOrganizationId.mockResolvedValue(mockSubscription as any);
    subscriptionPlanRepository.findById.mockResolvedValue(mockPlan as any);
    classRepository.countByOrganization.mockResolvedValue(5);

    await useCase.execute(input);

    expect(eventStore.publish).toHaveBeenCalledTimes(2);
  });
});

