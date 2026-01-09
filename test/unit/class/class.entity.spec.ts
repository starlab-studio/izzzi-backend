import { ClassEntity } from "src/modules/class/domain/entities/class.entity";
import { DomainError, ErrorCode } from "src/core";

describe("ClassEntity", () => {
  describe("create", () => {
    it("should create a class with valid data", () => {
      const classEntity = ClassEntity.create(
        "Test Class",
        "Description",
        5,
        ["student1@test.com", "student2@test.com", "student3@test.com", "student4@test.com", "student5@test.com"],
        "org-id",
        "user-id"
      );

      expect(classEntity.name).toBe("Test Class");
      expect(classEntity.description).toBe("Description");
      expect(classEntity.numberOfStudents).toBe(5);
      expect(classEntity.studentEmails).toHaveLength(5);
      expect(classEntity.code).toBeDefined();
      expect(classEntity.accessToken).toBeDefined();
      expect(classEntity.status).toBe("active");
      expect(classEntity.isActive).toBe(true);
    });

    it("should throw error for empty name", () => {
      expect(() => {
        ClassEntity.create(
          "",
          null,
          3,
          ["s1@test.com", "s2@test.com", "s3@test.com"],
          "org-id",
          "user-id"
        );
      }).toThrow(DomainError);
    });

    it("should throw error for invalid number of students", () => {
      expect(() => {
        ClassEntity.create(
          "Test Class",
          null,
          0,
          [],
          "org-id",
          "user-id"
        );
      }).toThrow(DomainError);
    });

    it("should throw error when email count doesn't match number of students", () => {
      expect(() => {
        ClassEntity.create(
          "Test Class",
          null,
          5,
          ["s1@test.com", "s2@test.com"],
          "org-id",
          "user-id"
        );
      }).toThrow(DomainError);
    });

    it("should throw error for duplicate emails", () => {
      expect(() => {
        ClassEntity.create(
          "Test Class",
          null,
          3,
          ["s1@test.com", "s1@test.com", "s2@test.com"],
          "org-id",
          "user-id"
        );
      }).toThrow(DomainError);
    });

    it("should trim class name", () => {
      const classEntity = ClassEntity.create(
        "  Test Class  ",
        null,
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      expect(classEntity.name).toBe("Test Class");
    });
  });

  describe("update", () => {
    it("should update class name", () => {
      const classEntity = ClassEntity.create(
        "Original Name",
        null,
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      classEntity.update({ name: "Updated Name" });

      expect(classEntity.name).toBe("Updated Name");
    });

    it("should update description", () => {
      const classEntity = ClassEntity.create(
        "Test Class",
        "Old Description",
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      classEntity.update({ description: "New Description" });

      expect(classEntity.description).toBe("New Description");
    });

    it("should update number of students and emails", () => {
      const classEntity = ClassEntity.create(
        "Test Class",
        null,
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      classEntity.update({
        numberOfStudents: 3,
        studentEmails: ["s1@test.com", "s2@test.com", "s3@test.com"],
      });

      expect(classEntity.numberOfStudents).toBe(3);
      expect(classEntity.studentEmails).toHaveLength(3);
    });

    it("should throw error when updating with invalid number of students", () => {
      const classEntity = ClassEntity.create(
        "Test Class",
        null,
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      expect(() => {
        classEntity.update({ numberOfStudents: -1 });
      }).toThrow(DomainError);
    });
  });

  describe("archive", () => {
    it("should archive an active class", () => {
      const classEntity = ClassEntity.create(
        "Test Class",
        null,
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      classEntity.archive();

      expect(classEntity.status).toBe("archived");
      expect(classEntity.isActive).toBe(false);
      expect(classEntity.archivedAt).toBeInstanceOf(Date);
    });

    it("should throw error when archiving already archived class", () => {
      const classEntity = ClassEntity.create(
        "Test Class",
        null,
        2,
        ["s1@test.com", "s2@test.com"],
        "org-id",
        "user-id"
      );

      classEntity.archive();

      expect(() => {
        classEntity.archive();
      }).toThrow(DomainError);
    });
  });
});

