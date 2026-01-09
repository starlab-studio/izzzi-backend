import { ClassStudentEntity } from "./class-student.entity";
import { ErrorCode, DomainError } from "src/core";

describe("ClassStudentEntity", () => {
  const validProps = {
    classId: "class-123",
    email: "student@test.com",
  };

  describe("create", () => {
    it("should create a valid class student", () => {
      const student = ClassStudentEntity.create(validProps);

      expect(student).toBeDefined();
      expect(student.id).toBeDefined();
      expect(student.classId).toBe(validProps.classId);
      expect(student.email).toBe(validProps.email);
      expect(student.isActive).toBe(true);
      expect(student.createdAt).toBeInstanceOf(Date);
      expect(student.updatedAt).toBeInstanceOf(Date);
    });

    it("should normalize email to lowercase", () => {
      const student = ClassStudentEntity.create({
        ...validProps,
        email: "Student@Test.COM",
      });

      expect(student.email).toBe("student@test.com");
    });

    it("should throw error if email is empty", () => {
      expect(() => {
        ClassStudentEntity.create({ ...validProps, email: "" });
      }).toThrow(DomainError);
      
      try {
        ClassStudentEntity.create({ ...validProps, email: "" });
      } catch (error) {
        expect(error).toHaveProperty("errors.0.code", ErrorCode.INVALID_STUDENT_EMAILS);
      }
    });

    it("should throw error if email format is invalid", () => {
      expect(() => {
        ClassStudentEntity.create({ ...validProps, email: "invalid-email" });
      }).toThrow(DomainError);

      try {
        ClassStudentEntity.create({ ...validProps, email: "invalid-email" });
      } catch (error) {
        expect(error).toHaveProperty("errors.0.code", ErrorCode.INVALID_STUDENT_EMAILS);
      }
    });
  });

  describe("lifecycle methods", () => {
    let student: ClassStudentEntity;

    beforeEach(() => {
      student = ClassStudentEntity.create(validProps);
    });

    it("should deactivate student", () => {
      student.deactivate();
      expect(student.isActive).toBe(false);
      expect(student.updatedAt.getTime()).toBeGreaterThanOrEqual(student.createdAt.getTime());
    });

    it("should activate student", () => {
      student.deactivate();
      const deactivatedAt = student.updatedAt;
      
      // small delay to ensure timestamp difference
      jest.useFakeTimers().setSystemTime(new Date().getTime() + 100);
      
      student.activate();
      expect(student.isActive).toBe(true);
      expect(student.updatedAt.getTime()).toBeGreaterThan(deactivatedAt.getTime());
      
      jest.useRealTimers();
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute from persistence data", () => {
      const data = {
        id: "existing-id",
        classId: "class-123",
        email: "existing@test.com",
        isActive: false,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      };

      const student = ClassStudentEntity.reconstitute(data);

      expect(student.id).toBe(data.id);
      expect(student.email).toBe(data.email);
      expect(student.isActive).toBe(false);
      expect(student.createdAt).toEqual(data.createdAt);
      expect(student.updatedAt).toEqual(data.updatedAt);
      expect(student.toPersistence()).toEqual(data);
    });
  });
});