import { UpdateClassUseCase } from "./UpdateClass.use-case";
import {
  ILoggerService,
  UserRole,
  DomainError,
  ErrorCode,
  Email,
} from "src/core";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { UpdateClassInput } from "../../domain/types";

describe("UpdateClassUseCase", () => {
  let useCase: UpdateClassUseCase;

  let mockLogger: jest.Mocked<ILoggerService>;
  let mockClassRepository: jest.Mocked<IClassRepository>;
  let mockClassStudentRepository: jest.Mocked<IClassStudentRepository>;
  let mockOrganizationFacade: jest.Mocked<OrganizationFacade>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockClassRepository = {
      findById: jest.fn(),
      findByNameAndOrganization: jest.fn(),
      save: jest.fn(),
    } as any;

    mockClassStudentRepository = {
      findByClass: jest.fn(),
      findByEmailAndClass: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    mockOrganizationFacade = {
      validateUserCanCreateClass: jest.fn(),
    } as any;

    useCase = new UpdateClassUseCase(
      mockLogger,
      mockClassRepository,
      mockClassStudentRepository,
      mockOrganizationFacade,
    );
  });

  const validInput: UpdateClassInput = {
    classId: "class-123",
    organizationId: "org-123",
    userId: "user-123",
    name: "Physics 102",
    description: "Advanced Physics",
    numberOfStudents: 3,
    studentEmails: "student1@test.com;student3@test.com", // student2 removed, student3 added
  };

  const mockClassEntity = {
    id: "class-123",
    organizationId: "org-123",
    name: "Physics 101",
    description: "Intro to Physics",
    status: "active",
    update: jest.fn(),
    toPersistence: jest.fn().mockReturnValue({ id: "class-123" }),
  } as any;

  it("should update a class successfully", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(mockClassEntity);
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null); // No name conflict
    mockClassRepository.save.mockResolvedValue(mockClassEntity);

    // Mock existing students
    const student1 = {
      email: "student1@test.com",
      isActive: true,
      deactivate: jest.fn(),
      activate: jest.fn(),
    } as any;
    const student2 = {
      email: "student2@test.com",
      isActive: true,
      deactivate: jest.fn(),
      activate: jest.fn(),
    } as any;

    mockClassStudentRepository.findByClass.mockResolvedValue([student1, student2]);
    
    // Mock finding individual students for update logic
    mockClassStudentRepository.findByEmailAndClass.mockImplementation(async (email) => {
      if (email === "student1@test.com") return student1;
      if (email === "student2@test.com") return student2;
      return null;
    });

    const result = await useCase.execute(validInput);

    expect(result).toBeDefined();
    expect(mockOrganizationFacade.validateUserCanCreateClass).toHaveBeenCalledWith(
      validInput.userId,
      validInput.organizationId,
      [UserRole.LEARNING_MANAGER, UserRole.ADMIN],
    );
    expect(mockClassRepository.findById).toHaveBeenCalledWith(validInput.classId);
    
    // Check name conflict check
    expect(mockClassRepository.findByNameAndOrganization).toHaveBeenCalledWith(
      validInput.name,
      validInput.organizationId
    );

    // Check entity update
    expect(mockClassEntity.update).toHaveBeenCalledWith(expect.objectContaining({
      name: validInput.name,
      description: validInput.description,
      numberOfStudents: validInput.numberOfStudents,
    }));

    // Check student updates
    // Student 2 should be deactivated (not in new list)
    expect(student2.deactivate).toHaveBeenCalled();
    expect(mockClassStudentRepository.save).toHaveBeenCalledWith(student2);

    // Student 1 should be checked (is in new list)
    // Student 3 should be created
    expect(mockClassStudentRepository.create).toHaveBeenCalled(); // For student3
    expect(mockClassRepository.save).toHaveBeenCalledWith(mockClassEntity);
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

  it("should throw error if class is archived", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    const archivedClass = { ...mockClassEntity, status: "archived" };
    mockClassRepository.findById.mockResolvedValue(archivedClass);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.CLASS_ALREADY_ARCHIVED
    );
  });

  it("should throw error if new name already exists", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(mockClassEntity);
    
    const existingClass = { id: "other-class-id" } as any;
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(existingClass);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.CLASS_ALREADY_EXISTS
    );
  });

  it("should reactivate inactive student if re-added", async () => {
    mockOrganizationFacade.validateUserCanCreateClass.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(mockClassEntity);
    mockClassRepository.findByNameAndOrganization.mockResolvedValue(null);
    mockClassRepository.save.mockResolvedValue(mockClassEntity);

    const inactiveStudent = {
      email: "student1@test.com",
      isActive: false,
      deactivate: jest.fn(),
      activate: jest.fn(),
    } as any;

    mockClassStudentRepository.findByClass.mockResolvedValue([inactiveStudent]);
    mockClassStudentRepository.findByEmailAndClass.mockResolvedValue(inactiveStudent);

    const inputWithReactivation = {
        ...validInput,
        studentEmails: "student1@test.com"
    };

    await useCase.execute(inputWithReactivation);

    expect(inactiveStudent.activate).toHaveBeenCalled();
    expect(mockClassStudentRepository.save).toHaveBeenCalledWith(inactiveStudent);
  });
});