import { CreateClassUseCase } from "./CreateClass.use-case";
import {
  ILoggerService,
  IEventStore,
  UserRole,
  DomainError,
  ApplicationError,
  ErrorCode,
} from "src/core";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ClassLimitService } from "../../domain/services/class-limit.service";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { CreateClassInput } from "../../domain/types";
import { ClassLimitReachedEvent } from "../../domain/events/class-limit-reached.event";

describe("CreateClassUseCase", () => {
  let useCase: CreateClassUseCase;

  let mockLogger: jest.Mocked<ILoggerService>;
  let mockClassRepository: jest.Mocked<IClassRepository>;
  let mockClassStudentRepository: jest.Mocked<IClassStudentRepository>;
  let mockOrganizationFacade: jest.Mocked<OrganizationFacade>;
  let mockEventStore: jest.Mocked<IEventStore>;
  let mockClassLimitService: jest.Mocked<ClassLimitService>;
  let mockSubscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let mockSubscriptionPlanRepository: jest.Mocked<ISubscriptionPlanRepository>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockClassRepository = {
      create: jest.fn(),
      findByNameAndOrganization: jest.fn(),
      countByOrganization: jest.fn(),
    } as any;

    mockClassStudentRepository = {
      create: jest.fn(),
    } as any;

    mockOrganizationFacade = {
      validateUserCanCreateClass: jest.fn(),
    } as any;

    mockEventStore = {
      publish: jest.fn(),
    } as any;

    mockClassLimitService = {
      canCreateClass: jest.fn(),
    } as any;

    mockSubscriptionRepository = {
      findActiveByOrganizationId: jest.fn(),
    } as any;
    mockSubscriptionPlanRepository = {
      findById: jest.fn(),
    } as any;

    useCase = new CreateClassUseCase(
      mockLogger,
      mockClassRepository,
      mockClassStudentRepository,
      mockOrganizationFacade,
      mockEventStore,
      mockClassLimitService,
      mockSubscriptionRepository,
      mockSubscriptionPlanRepository,
    );
  });

  const validInput: CreateClassInput = {
    name: "Physics 101",
    description: "Intro to Physics",
    numberOfStudents: 2,
    studentEmails: "student1@test.com;student2@test.com",
    organizationId: "org-123",
    userId: "user-123",
    userEmail: "teacher@test.com",
  };

  it("should create a class successfully when limits are not reached", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);
    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
      null,
    );

    const mockCreatedClass = {
      id: "class-id-123",
      code: "PHYS-101",
      ...validInput,
      studentEmails: ["student1@test.com", "student2@test.com"],
      toPersistence: jest.fn().mockReturnValue({
        id: "class-id-123",
        code: "PHYS-101",
        ...validInput,
        studentEmails: ["student1@test.com", "student2@test.com"],
      }),
    } as any;
    mockClassRepository.create.mockResolvedValue(mockCreatedClass);

    const result = await useCase.execute(validInput);

    expect(result).toBeDefined();
    expect(
      mockOrganizationFacade.validateUserCanCreateClass,
    ).toHaveBeenCalledWith(validInput.userId, validInput.organizationId, [
      UserRole.LEARNING_MANAGER,
      UserRole.ADMIN,
    ]);
    expect(mockClassLimitService.canCreateClass).toHaveBeenCalledWith(
      validInput.organizationId,
    );
    expect(mockClassRepository.create).toHaveBeenCalled();
    expect(mockClassStudentRepository.create).toHaveBeenCalledTimes(2);
    expect(mockEventStore.publish).toHaveBeenCalled();
  });

  it("should throw error if class limit is reached", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({
      canCreate: false,
      reason: "Limit reached",
    });

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    expect(mockClassRepository.create).not.toHaveBeenCalled();
  });

  it("should throw error if class name already exists in organization", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue({} as any);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    expect(mockClassRepository.create).not.toHaveBeenCalled();
  });

  it("should throw ApplicationError if class repository fails to create class", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);
    mockClassRepository.create.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(ApplicationError);
  });

  it("should publish ClassLimitReachedEvent when class creation hits the subscription limit", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);

    const mockCreatedClass = {
      id: "class-id-123",
      code: "PHYS-101",
      ...validInput,
      studentEmails: ["student1@test.com", "student2@test.com"],
      toPersistence: jest.fn().mockReturnValue({
        id: "class-id-123",
        code: "PHYS-101",
        ...validInput,
      }),
    } as any;
    mockClassRepository.create.mockResolvedValue(mockCreatedClass);

    const mockSubscription = {
      id: "sub-1",
      planId: "plan-1",
      quantity: 5,
      status: "active",
    } as any;
    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
      mockSubscription,
    );

    const mockPlan = {
      id: "plan-1",
      name: "super-izzzi",
      isFree: false,
    } as any;
    mockSubscriptionPlanRepository.findById.mockResolvedValue(mockPlan);

    mockClassRepository.countByOrganization.mockResolvedValue(5);

    await useCase.execute(validInput);

    expect(mockEventStore.publish).toHaveBeenCalledTimes(2);
    expect(mockEventStore.publish).toHaveBeenCalledWith(
      expect.any(ClassLimitReachedEvent),
    );
  });

  it("should throw DomainError if student emails are invalid", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);

    const invalidInput = { ...validInput, studentEmails: "invalid-email" };

    await expect(useCase.execute(invalidInput)).rejects.toThrow();
  });

  it("should throw error if user is not authorized", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockRejectedValue(
      new DomainError(ErrorCode.UNAUTHORIZED, "Unauthorized"),
    );

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    expect(mockClassRepository.create).not.toHaveBeenCalled();
  });

  it("should throw DomainError if student emails are empty", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);

    const inputNoStudents = { ...validInput, studentEmails: "" };

    await expect(useCase.execute(inputNoStudents)).rejects.toThrow(DomainError);
    expect(mockClassRepository.create).not.toHaveBeenCalled();
  });

  it("should throw DomainError if number of students does not match number of provided emails", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);

    const inputMismatch = {
      ...validInput,
      numberOfStudents: 3,
      studentEmails: "student1@test.com;student2@test.com",
    };

    await expect(useCase.execute(inputMismatch)).rejects.toThrow(DomainError);
    expect(mockClassRepository.create).not.toHaveBeenCalled();
  });

  it("should NOT publish ClassLimitReachedEvent if subscription is missing", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);

    const mockCreatedClass = {
      id: "class-id-123",
      code: "PHYS-101",
      ...validInput,
      studentEmails: ["student1@test.com", "student2@test.com"],
      toPersistence: jest.fn().mockReturnValue({
        id: "class-id-123",
        code: "PHYS-101",
        ...validInput,
      }),
    } as any;
    mockClassRepository.create.mockResolvedValue(mockCreatedClass);

    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
      null,
    );

    await useCase.execute(validInput);

    expect(mockEventStore.publish).toHaveBeenCalledTimes(1);
  });

  it("should NOT publish ClassLimitReachedEvent if plan is free", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassLimitService.canCreateClass.mockResolvedValue({ canCreate: true });
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);

    const mockCreatedClass = {
      id: "class-id-123",
      code: "PHYS-101",
      ...validInput,
      studentEmails: ["student1@test.com", "student2@test.com"],
      toPersistence: jest.fn().mockReturnValue({
        id: "class-id-123",
        code: "PHYS-101",
        ...validInput,
      }),
    } as any;
    mockClassRepository.create.mockResolvedValue(mockCreatedClass);

    const mockSubscription = {
      id: "sub-1",
      planId: "free-plan",
      quantity: 5,
      status: "active",
    } as any;
    mockSubscriptionRepository.findActiveByOrganizationId.mockResolvedValue(
      mockSubscription,
    );

    const mockPlan = {
      id: "free-plan",
      name: "free",
      isFree: true,
    } as any;
    mockSubscriptionPlanRepository.findById.mockResolvedValue(mockPlan);

    mockClassRepository.countByOrganization.mockResolvedValue(5);

    await useCase.execute(validInput);

    expect(mockEventStore.publish).toHaveBeenCalledTimes(1);
  });
});
