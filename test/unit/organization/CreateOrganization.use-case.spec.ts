import { Test, TestingModule } from "@nestjs/testing";
import { CreateOrganizationUseCase } from "src/modules/organization/application/use-cases/CreateOrganization.use-case";
import { IOrganizationRepository } from "src/modules/organization/domain/repositories/organization.repository";
import { IEventStore, ILoggerService, DomainError, ErrorCode, ApplicationError, LoggerService } from "src/core";
import { OrganizationEntity } from "src/modules/organization/domain/entities/organization.entity";

describe("CreateOrganizationUseCase", () => {
  let useCase: CreateOrganizationUseCase;
  let organizationRepository: jest.Mocked<IOrganizationRepository>;
  let eventStore: jest.Mocked<IEventStore>;
  let logger: jest.Mocked<ILoggerService>;

  beforeEach(async () => {
    const mockOrgRepo = {
      findByName: jest.fn(),
      create: jest.fn(),
    };

    const mockEventStore = {
      publish: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    organizationRepository = mockOrgRepo as any;
    eventStore = mockEventStore as any;
    logger = mockLogger as any;
    useCase = new CreateOrganizationUseCase(logger, eventStore, organizationRepository);
  });

  it("should create organization successfully", async () => {
    const input = {
      name: "Test Organization",
      ownerId: "owner-id",
    };

    organizationRepository.findByName.mockResolvedValue(null);
    const createdOrg = OrganizationEntity.create(input);
    organizationRepository.create.mockResolvedValue(createdOrg);

    const result = await useCase.execute(input);

    expect(result.name).toBe("Test Organization");
    expect(result.ownerId).toBe("owner-id");
    expect(organizationRepository.create).toHaveBeenCalled();
    expect(eventStore.publish).toHaveBeenCalled();
  });

  it("should throw error when organization name already exists", async () => {
    const input = {
      name: "Existing Org",
      ownerId: "owner-id",
    };

    const existingOrg = OrganizationEntity.create(input);
    organizationRepository.findByName.mockResolvedValue(existingOrg);

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow("not available");
  });

  it("should throw error when creation fails", async () => {
    const input = {
      name: "Test Organization",
      ownerId: "owner-id",
    };

    organizationRepository.findByName.mockResolvedValue(null);
    organizationRepository.create.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(ApplicationError);
  });
});

