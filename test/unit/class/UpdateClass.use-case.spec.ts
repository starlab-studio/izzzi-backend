import { Test, TestingModule } from "@nestjs/testing";
import { UpdateClassUseCase } from "src/modules/class/application/use-cases/UpdateClass.use-case";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { IClassStudentRepository } from "src/modules/class/domain/repositories/class-student.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ILoggerService, DomainError, ErrorCode, LoggerService } from "src/core";
import { ClassEntity } from "src/modules/class/domain/entities/class.entity";
import { ClassStudentEntity } from "src/modules/class/domain/entities/class-student.entity";

describe("UpdateClassUseCase", () => {
  let useCase: UpdateClassUseCase;
  let classRepository: jest.Mocked<IClassRepository>;
  let classStudentRepository: jest.Mocked<IClassStudentRepository>;
  let organizationFacade: jest.Mocked<OrganizationFacade>;
  let logger: jest.Mocked<ILoggerService>;

  const mockClass = ClassEntity.create(
    "Original Name",
    "Original Description",
    3,
    ["s1@test.com", "s2@test.com", "s3@test.com"],
    "org-id",
    "user-id"
  );

  beforeEach(async () => {
    const mockClassRepo = {
      findById: jest.fn(),
      findByNameAndOrganization: jest.fn(),
      save: jest.fn(),
    };

    const mockClassStudentRepo = {
      findByClass: jest.fn(),
      findByEmailAndClass: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockOrgFacade = {
      validateUserCanCreateClass: jest.fn(),
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
    logger = mockLogger as any;
    useCase = new UpdateClassUseCase(logger, classRepository, classStudentRepository, organizationFacade);
  });

  it("should update class successfully", async () => {
    const input = {
      classId: mockClass.id,
      name: "Updated Name",
      description: "Updated Description",
      organizationId: "org-id",
      userId: "user-id",
    };

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classRepository.findById.mockResolvedValue(mockClass);
    classRepository.findByNameAndOrganization.mockResolvedValue(null);
    classRepository.save.mockResolvedValue(mockClass);

    const result = await useCase.execute(input);

    expect(result.name).toBe("Updated Name");
    expect(result.description).toBe("Updated Description");
    expect(classRepository.save).toHaveBeenCalled();
  });

  it("should throw error when class not found", async () => {
    const input = {
      classId: "non-existent",
      organizationId: "org-id",
      userId: "user-id",
    };

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("not found");
  });

  it("should throw error when class is archived", async () => {
    const archivedClass = ClassEntity.reconstitute({
      ...mockClass.toPersistence(),
      status: "archived",
    });

    const input = {
      classId: archivedClass.id,
      name: "Updated Name",
      organizationId: "org-id",
      userId: "user-id",
    };

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classRepository.findById.mockResolvedValue(archivedClass);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("archived");
  });

  it("should update student emails and manage students", async () => {
    const input = {
      classId: mockClass.id,
      studentEmails: "s1@test.com;s2@test.com;s4@test.com",
      numberOfStudents: 3,
      organizationId: "org-id",
      userId: "user-id",
    };

    const existingStudents = [
      ClassStudentEntity.create({ classId: mockClass.id, email: "s1@test.com", isActive: true }),
      ClassStudentEntity.create({ classId: mockClass.id, email: "s2@test.com", isActive: true }),
      ClassStudentEntity.create({ classId: mockClass.id, email: "s3@test.com", isActive: true }),
    ];

    organizationFacade.validateUserCanCreateClass.mockResolvedValue(undefined);
    classRepository.findById.mockResolvedValue(mockClass);
    classStudentRepository.findByClass.mockResolvedValue(existingStudents);
    classStudentRepository.findByEmailAndClass.mockResolvedValue(null);
    classStudentRepository.create.mockResolvedValue({} as any);
    classStudentRepository.save.mockResolvedValue({} as any);
    classRepository.save.mockResolvedValue(mockClass);

    await useCase.execute(input);

    expect(classStudentRepository.save).toHaveBeenCalled();
    expect(classStudentRepository.create).toHaveBeenCalled();
  });
});

