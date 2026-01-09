import { OrganizationEntity } from "src/modules/organization/domain/entities/organization.entity";
import { IOrganization, IOrganizationCreate } from "src/modules/organization/domain/types";

describe("OrganizationEntity", () => {
  describe("create", () => {
    it("should create organization with required fields", () => {
      const data: IOrganizationCreate = {
        name: "Test Organization",
        ownerId: "owner-123",
      };

      const entity = OrganizationEntity.create(data);

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe("Test Organization");
      expect(entity.ownerId).toBe("owner-123");
      expect(entity.slug).toBe("test-organization");
      expect(entity.siren).toBeNull();
      expect(entity.siret).toBeNull();
      expect(entity.vatNumber).toBeNull();
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    });

    it("should generate slug from name", () => {
      const data: IOrganizationCreate = {
        name: "My Company & Co.",
        ownerId: "owner-123",
      };

      const entity = OrganizationEntity.create(data);

      expect(entity.slug).toBe("my-company-co");
    });

    it("should handle special characters in name", () => {
      const data: IOrganizationCreate = {
        name: "École Française",
        ownerId: "owner-123",
      };

      const entity = OrganizationEntity.create(data);

      expect(entity.slug).toBe("ecole-francaise");
    });
  });

  describe("updateName", () => {
    it("should update name and slug", () => {
      const entity = OrganizationEntity.create({
        name: "Old Name",
        ownerId: "owner-123",
      });

      const beforeUpdate = entity.updatedAt;
      entity.updateName("New Organization Name");

      expect(entity.name).toBe("New Organization Name");
      expect(entity.slug).toBe("new-organization-name");
      expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it("should trim whitespace", () => {
      const entity = OrganizationEntity.create({
        name: "Test Org",
        ownerId: "owner-123",
      });

      entity.updateName("  Trimmed Name  ");

      expect(entity.name).toBe("Trimmed Name");
      expect(entity.slug).toBe("trimmed-name");
    });
  });

  describe("isSubscritionActive", () => {
    it("should return true", () => {
      const entity = OrganizationEntity.create({
        name: "Test Org",
        ownerId: "owner-123",
      });

      expect(entity.isSubscritionActive()).toBe(true);
    });
  });

  describe("hasReachedMemberLimit", () => {
    it("should return true", () => {
      const entity = OrganizationEntity.create({
        name: "Test Org",
        ownerId: "owner-123",
      });

      expect(entity.hasReachedMemberLimit()).toBe(true);
    });
  });

  describe("toPersistence", () => {
    it("should return persistence data", () => {
      const entity = OrganizationEntity.create({
        name: "Test Org",
        ownerId: "owner-123",
      });

      const persistence = entity.toPersistence();

      expect(persistence.id).toBe(entity.id);
      expect(persistence.name).toBe("Test Org");
      expect(persistence.slug).toBe("test-org");
      expect(persistence.ownerId).toBe("owner-123");
    });
  });

  describe("reconstitute", () => {
    it("should recreate entity from persistence data", () => {
      const data: IOrganization = {
        id: "existing-id",
        name: "Existing Org",
        slug: "existing-org",
        ownerId: "owner-123",
        siren: "123456789",
        siret: "12345678901234",
        vatNumber: "FR12345678901",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const entity = OrganizationEntity.reconstitute(data);

      expect(entity.id).toBe("existing-id");
      expect(entity.name).toBe("Existing Org");
      expect(entity.siren).toBe("123456789");
      expect(entity.siret).toBe("12345678901234");
      expect(entity.vatNumber).toBe("FR12345678901");
    });
  });
});

