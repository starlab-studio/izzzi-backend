import { GetClassByIdUseCase } from "./GetClassById.use-case";
import {
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { GetClassByIdInput } from "../../domain/types";

describe("GetClassByIdUseCase", () => {
  let useCase: GetClassByIdUseCase;

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
    } as any;

    mockClassStudentRepository = {
      findByClassAndActive: jest.fn(),
    } as any;

    mockOrganizationFacade = {
      validateUserBelongsToOrganization: jest.fn(),
    } as any;

    useCase = new GetClassByIdUseCase(
      mockLogger,
      mockClassRepository,
      mockClassStudentRepository,
      mockOrganizationFacade,
    );
  });

  const validInput: GetClassByIdInput = {
    classId: "class-123",
    organizationId: "org-123",
    userId: "user-123",
  };

  const mockClassEntity = {
    id: "class-123",
    organizationId: "org-123",
    name: "Physics 101",
    code: "PHYS-101",
    description: "Intro to Physics",
    numberOfStudents: 2,
    status: "active",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-02"),
    archivedAt: null,
    toPersistence: jest.fn().mockReturnValue({
      id: "class-123",
      organizationId: "org-123",
      name: "Physics 101",
      code: "PHYS-101",
      description: "Intro to Physics",
      numberOfStudents: 2,
      status: "active",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-02"),
      archivedAt: null,
    }),
  } as any;

  const mockStudents = [
    { id: "student-1", email: "s1@test.com" },
    { id: "student-2", email: "s2@test.com" },
  ];

  it("should return class details successfully", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(mockClassEntity);
    mockClassStudentRepository.findByClassAndActive.mockResolvedValue(mockStudents as any);

    const result = await useCase.execute(validInput);

    expect(result).toBeDefined();
    expect(result.id).toBe(mockClassEntity.id);
    expect(result.students).toHaveLength(2);
    expect(result.students[0].email).toBe("s1@test.com");
    
    expect(mockOrganizationFacade.validateUserBelongsToOrganization).toHaveBeenCalledWith(
      validInput.userId,
      validInput.organizationId
    );
    expect(mockClassRepository.findById).toHaveBeenCalledWith(validInput.classId);
    expect(mockClassStudentRepository.findByClassAndActive).toHaveBeenCalledWith(
      validInput.classId,
      true
    );
  });

  it("should throw error if class not found", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    mockClassRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.CLASS_NOT_FOUND
    );
  });

  it("should throw error if class does not belong to organization", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    const otherOrgClass = { ...mockClassEntity, organizationId: "other-org" };
    mockClassRepository.findById.mockResolvedValue(otherOrgClass);

    await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
    await expect(useCase.execute(validInput)).rejects.toHaveProperty(
      "errors.0.code",
      ErrorCode.UNAUTHORIZED_ROLE
    );
  });

  it("should propagate error if user not in organization", async () => {
     mockOrganizationFacade.validateUserBelongsToOrganization.mockRejectedValue(
        new DomainError(ErrorCode.NOT_ORGANIZATION_MEMBER, "User not in org")
     );

     await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
     expect(mockClassRepository.findById).not.toHaveBeenCalled();
  });
});