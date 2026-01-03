import { GetClassesByOrganizationUseCase } from "./GetClassesByOrganization.use-case";
import {
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import { IClassRepository } from "../../domain/repositories/class.repository";
import { IClassStudentRepository } from "../../domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { GetClassesByOrganizationInput } from "../../domain/types";

describe("GetClassesByOrganizationUseCase", () => {
  let useCase: GetClassesByOrganizationUseCase;

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
      findByOrganization: jest.fn(),
      findByOrganizationAndStatus: jest.fn(),
    } as any;

    mockClassStudentRepository = {
      findByClassAndActive: jest.fn(),
    } as any;

    mockOrganizationFacade = {
      validateUserBelongsToOrganization: jest.fn(),
    } as any;

    useCase = new GetClassesByOrganizationUseCase(
      mockLogger,
      mockClassRepository,
      mockClassStudentRepository,
      mockOrganizationFacade,
    );
  });

  const validInput: GetClassesByOrganizationInput = {
    organizationId: "org-123",
    userId: "user-123",
  };

  const mockClass1 = {
    id: "class-1",
    organizationId: "org-123",
    name: "Class 1",
    status: "active",
    toPersistence: jest.fn().mockReturnValue({
        id: "class-1",
        name: "Class 1",
        status: "active",
        numberOfStudents: 1
    }),
  } as any;

  const mockClass2 = {
    id: "class-2",
    organizationId: "org-123",
    name: "Class 2",
    status: "active",
    toPersistence: jest.fn().mockReturnValue({
        id: "class-2",
        name: "Class 2",
        status: "active",
        numberOfStudents: 0
    }),
  } as any;

  it("should return all classes if no filter provided", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    mockClassRepository.findByOrganization.mockResolvedValue([mockClass1, mockClass2]);
    mockClassStudentRepository.findByClassAndActive.mockResolvedValue([]);

    const result = await useCase.execute(validInput);

    expect(result).toHaveLength(2);
    expect(mockClassRepository.findByOrganization).toHaveBeenCalledWith(validInput.organizationId);
    expect(mockClassRepository.findByOrganizationAndStatus).not.toHaveBeenCalled();
  });

  it("should filter by active status", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    mockClassRepository.findByOrganizationAndStatus.mockResolvedValue([mockClass1]);
    mockClassStudentRepository.findByClassAndActive.mockResolvedValue([]);

    const inputWithFilter = { ...validInput, archived: false };
    const result = await useCase.execute(inputWithFilter);

    expect(result).toHaveLength(1);
    expect(mockClassRepository.findByOrganizationAndStatus).toHaveBeenCalledWith(
        validInput.organizationId,
        "active"
    );
  });

  it("should filter by archived status", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    mockClassRepository.findByOrganizationAndStatus.mockResolvedValue([]);

    const inputWithFilter = { ...validInput, archived: true };
    await useCase.execute(inputWithFilter);

    expect(mockClassRepository.findByOrganizationAndStatus).toHaveBeenCalledWith(
        validInput.organizationId,
        "archived"
    );
  });

  it("should fetch students for each class", async () => {
    mockOrganizationFacade.validateUserBelongsToOrganization.mockResolvedValue(true);
    mockClassRepository.findByOrganization.mockResolvedValue([mockClass1]);
    
    const students = [{ id: "s1", email: "e1" }];
    mockClassStudentRepository.findByClassAndActive.mockResolvedValue(students as any);

    const result = await useCase.execute(validInput);

    expect(result[0].students).toHaveLength(1);
    expect(mockClassStudentRepository.findByClassAndActive).toHaveBeenCalledWith(
        mockClass1.id,
        true
    );
  });

  it("should propagate error if user not in organization", async () => {
     mockOrganizationFacade.validateUserBelongsToOrganization.mockRejectedValue(
        new DomainError(ErrorCode.NOT_ORGANIZATION_MEMBER, "User not in org")
     );

     await expect(useCase.execute(validInput)).rejects.toThrow(DomainError);
  });
});