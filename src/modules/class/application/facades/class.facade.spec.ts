import { ClassFacade } from "./class.facade";
import { CreateClassUseCase } from "../use-cases/CreateClass.use-case";
import { GetClassesByOrganizationUseCase } from "../use-cases/GetClassesByOrganization.use-case";
import { GetClassByIdUseCase } from "../use-cases/GetClassById.use-case";
import { UpdateClassUseCase } from "../use-cases/UpdateClass.use-case";
import { ArchiveClassUseCase } from "../use-cases/ArchiveClass.use-case";

describe("ClassFacade", () => {
  let facade: ClassFacade;
  let mockCreateClassUseCase: jest.Mocked<CreateClassUseCase>;
  let mockGetClassesByOrganizationUseCase: jest.Mocked<GetClassesByOrganizationUseCase>;
  let mockGetClassByIdUseCase: jest.Mocked<GetClassByIdUseCase>;
  let mockUpdateClassUseCase: jest.Mocked<UpdateClassUseCase>;
  let mockArchiveClassUseCase: jest.Mocked<ArchiveClassUseCase>;

  beforeEach(() => {
    mockCreateClassUseCase = {
      execute: jest.fn(),
    } as any;
    mockGetClassesByOrganizationUseCase = {
      execute: jest.fn(),
    } as any;
    mockGetClassByIdUseCase = {
      execute: jest.fn(),
    } as any;
    mockUpdateClassUseCase = {
      execute: jest.fn(),
    } as any;
    mockArchiveClassUseCase = {
      execute: jest.fn(),
    } as any;

    facade = new ClassFacade(
      mockCreateClassUseCase,
      mockGetClassesByOrganizationUseCase,
      mockGetClassByIdUseCase,
      mockUpdateClassUseCase,
      mockArchiveClassUseCase
    );
  });

  describe("createClass", () => {
    it("should call createClassUseCase with correct input", async () => {
      const data = {
        name: "Test Class",
        description: "Test Description",
        numberOfStudents: 10,
        studentEmails: "test@test.com",
        organizationId: "org-1",
        userId: "user-1",
      };
      const userEmail = "user@test.com";

      await facade.createClass(data, userEmail);

      expect(mockCreateClassUseCase.execute).toHaveBeenCalledWith({
        ...data,
        userEmail,
      });
    });

    it("should throw error if use case fails", async () => {
      mockCreateClassUseCase.execute.mockRejectedValue(new Error("Failed"));
      await expect(
        facade.createClass({} as any, "email")
      ).rejects.toThrow("Failed");
    });
  });

  describe("getClassesByOrganization", () => {
    it("should call getClassesByOrganizationUseCase with correct input", async () => {
      const orgId = "org-1";
      const userId = "user-1";
      const archived = false;

      await facade.getClassesByOrganization(orgId, userId, archived);

      expect(mockGetClassesByOrganizationUseCase.execute).toHaveBeenCalledWith({
        organizationId: orgId,
        userId,
        archived,
      });
    });

    it("should throw error if use case fails", async () => {
      mockGetClassesByOrganizationUseCase.execute.mockRejectedValue(
        new Error("Failed")
      );
      await expect(
        facade.getClassesByOrganization("org-1", "user-1")
      ).rejects.toThrow("Failed");
    });
  });

  describe("getClassById", () => {
    it("should call getClassByIdUseCase with correct input", async () => {
      const classId = "class-1";
      const orgId = "org-1";
      const userId = "user-1";

      await facade.getClassById(classId, orgId, userId);

      expect(mockGetClassByIdUseCase.execute).toHaveBeenCalledWith({
        classId,
        organizationId: orgId,
        userId,
      });
    });

    it("should throw error if use case fails", async () => {
      mockGetClassByIdUseCase.execute.mockRejectedValue(new Error("Failed"));
      await expect(
        facade.getClassById("class-1", "org-1", "user-1")
      ).rejects.toThrow("Failed");
    });
  });

  describe("updateClass", () => {
    it("should call updateClassUseCase with correct input", async () => {
      const classId = "class-1";
      const orgId = "org-1";
      const userId = "user-1";
      const data = {
        name: "New Name",
      };

      await facade.updateClass(classId, orgId, userId, data);

      expect(mockUpdateClassUseCase.execute).toHaveBeenCalledWith({
        classId,
        organizationId: orgId,
        userId,
        ...data,
      });
    });

    it("should throw error if use case fails", async () => {
      mockUpdateClassUseCase.execute.mockRejectedValue(new Error("Failed"));
      await expect(
        facade.updateClass("class-1", "org-1", "user-1", {})
      ).rejects.toThrow("Failed");
    });
  });

  describe("archiveClass", () => {
    it("should call archiveClassUseCase with correct input", async () => {
      const classId = "class-1";
      const orgId = "org-1";
      const userId = "user-1";
      const userEmail = "user@test.com";

      await facade.archiveClass(classId, orgId, userId, userEmail);

      expect(mockArchiveClassUseCase.execute).toHaveBeenCalledWith({
        classId,
        organizationId: orgId,
        userId,
        userEmail,
      });
    });

    it("should throw error if use case fails", async () => {
      mockArchiveClassUseCase.execute.mockRejectedValue(new Error("Failed"));
      await expect(
        facade.archiveClass("class-1", "org-1", "user-1", "email")
      ).rejects.toThrow("Failed");
    });
  });
});import { ClassFacade } from "./class.facade";
import { CreateClassUseCase } from "../use-cases/CreateClass.use-case";
import { GetClassesByOrganizationUseCase } from "../use-cases/GetClassesByOrganization.use-case";
import { GetClassByIdUseCase } from "../use-cases/GetClassById.use-case";
import { UpdateClassUseCase } from "../use-cases/UpdateClass.use-case";
import { ArchiveClassUseCase } from "../use-cases/ArchiveClass.use-case";

describe("ClassFacade", () => {
  let facade: ClassFacade;
  let mockCreateClassUseCase: jest.Mocked<CreateClassUseCase>;
  let mockGetClassesByOrganizationUseCase: jest.Mocked<GetClassesByOrganizationUseCase>;
  let mockGetClassByIdUseCase: jest.Mocked<GetClassByIdUseCase>;
  let mockUpdateClassUseCase: jest.Mocked<UpdateClassUseCase>;
  let mockArchiveClassUseCase: jest.Mocked<ArchiveClassUseCase>;

  beforeEach(() => {
    mockCreateClassUseCase = {
      execute: jest.fn(),
    } as any;
    mockGetClassesByOrganizationUseCase = {
      execute: jest.fn(),
    } as any;
    mockGetClassByIdUseCase = {
      execute: jest.fn(),
    } as any;
    mockUpdateClassUseCase = {
      execute: jest.fn(),
    } as any;
    mockArchiveClassUseCase = {
      execute: jest.fn(),
    } as any;

    facade = new ClassFacade(
      mockCreateClassUseCase,
      mockGetClassesByOrganizationUseCase,
      mockGetClassByIdUseCase,
      mockUpdateClassUseCase,
      mockArchiveClassUseCase
    );
  });

  describe("createClass", () => {
    it("should call createClassUseCase with correct input", async () => {
      const data = {
        name: "Test Class",
        description: "Test Description",
        numberOfStudents: 10,
        studentEmails: "test@test.com",
        organizationId: "org-1",
        userId: "user-1",
      };
      const userEmail = "user@test.com";

      await facade.createClass(data, userEmail);

      expect(mockCreateClassUseCase.execute).toHaveBeenCalledWith({
        ...data,
        userEmail,
      });
    });

    it("should throw error if use case fails", async () => {
      mockCreateClassUseCase.execute.mockRejectedValue(new Error("Failed"));
      await expect(
        facade.createClass({} as any, "email")
      ).rejects.toThrow("Failed");
    });
  });

  describe("getClassesByOrganization", () => {
    it("should call getClassesByOrganizationUseCase with correct input", async () => {
      const orgId = "org-1";
      const userId = "user-1";
      const archived = false;

      await facade.getClassesByOrganization(orgId, userId, archived);

      expect(mockGetClassesByOrganizationUseCase.execute).toHaveBeenCalledWith({
        organizationId: orgId,
        userId,
        archived,
      });
    });
  });

  describe("getClassById", () => {
    it("should call getClassByIdUseCase with correct input", async () => {
      const classId = "class-1";
      const orgId = "org-1";
      const userId = "user-1";

      await facade.getClassById(classId, orgId, userId);

      expect(mockGetClassByIdUseCase.execute).toHaveBeenCalledWith({
        classId,
        organizationId: orgId,
        userId,
      });
    });
  });

  describe("updateClass", () => {
    it("should call updateClassUseCase with correct input", async () => {
      const classId = "class-1";
      const orgId = "org-1";
      const userId = "user-1";
      const data = {
        name: "New Name",
      };

      await facade.updateClass(classId, orgId, userId, data);

      expect(mockUpdateClassUseCase.execute).toHaveBeenCalledWith({
        classId,
        organizationId: orgId,
        userId,
        ...data,
      });
    });
  });

  describe("archiveClass", () => {
    it("should call archiveClassUseCase with correct input", async () => {
      const classId = "class-1";
      const orgId = "org-1";
      const userId = "user-1";
      const userEmail = "user@test.com";

      await facade.archiveClass(classId, orgId, userId, userEmail);

      expect(mockArchiveClassUseCase.execute).toHaveBeenCalledWith({
        classId,
        organizationId: orgId,
        userId,
        userEmail,
      });
    });
  });
});