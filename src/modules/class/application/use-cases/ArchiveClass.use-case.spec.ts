import { ArchiveClassUseCase } from "./ArchiveClass.use-case";
import {
  ILoggerService,
  UserRole,
  DomainError,
  ErrorCode,
  IEventStore,
} from "src/core";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ArchiveClassInput } from "../../domain/types";
import { ClassArchivedEvent } from "../../domain/events/classArchived.event";

describe("ArchiveClassUseCase", () => {
  let useCase: ArchiveClassUseCase;

  let mockLogger: jest.Mocked<ILoggerService>;
  let mockClassRepository: jest.Mocked<IClassRepository>;
  let mockOrganizationFacade: jest.Mocked<OrganizationFacade>;
  let mockEventStore: jest.Mocked<IEventStore>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockClassRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockOrganizationFacade = {
      validateUserCanCreateClass: jest.fn(),
    } as any;

    mockEventStore = {
      publish: jest.fn(),
    } as any;

    useCase = new ArchiveClassUseCase(
      mockLogger,
      mockClassRepository,
      mockOrganizationFacade,
      mockEventStore,
    );
  });

  const validInput: ArchiveClassInput = {
    classId: "class-123",
    organizationId: "org-123",
    userId: "user-123",
    userEmail: "admin@test.com",
  };

  const mockClassEntity = {
    id: "class-123",
    organizationId: "org-123",
    name: "Physics 101",
    code: "PHYS-101",
    description: "Intro to Physics",
    status: "active",
    userId: "creator-123",
    archive: jest.fn(),
    toPersistence: jest.fn().mockReturnValue({ id: "class-123", status: "archived" }),
  } as any;

  it("should archive a class successfully", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(mockClassEntity);
    mockClassRepository.save.mockResolvedValue(mockClassEntity);

    const result = await useCase.execute(validInput);

    expect(result).toBeDefined();
    expect(mockOrganizationFacade.validateUserCanCreateClass).toHaveBeenCalledWith(
      validInput.userId,
      validInput.organizationId,
      [UserRole.LEARNING_MANAGER, UserRole.ADMIN],
    );
    expect(mockClassRepository.findById).toHaveBeenCalledWith(validInput.classId);
    
    expect(mockClassEntity.archive).toHaveBeenCalled();
    expect(mockClassRepository.save).toHaveBeenCalledWith(mockClassEntity);
    
    expect(mockEventStore.publish).toHaveBeenCalledWith(expect.any(ClassArchivedEvent));
    expect(mockEventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({
            payload: expect.objectContaining({
                id: mockClassEntity.id,
                userEmail: validInput.userEmail
            })
        })
    );
  });

  it("should throw error if class not found", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.CLASS_NOT_FOUND
    );
  });

  it("should throw error if class does not belong to organization", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    const otherOrgClass = { ...mockClassEntity, organizationId: "other-org" };
    mockClassRepository.findById.mockResolvedValue(otherOrgClass);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.UNAUTHORIZED_ROLE
    );
  });

  it("should throw error if class is already archived", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    const archivedClass = { ...mockClassEntity, status: "archived" };
    mockClassRepository.findById.mockResolvedValue(archivedClass);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.CLASS_ALREADY_ARCHIVED
    );
  });
});