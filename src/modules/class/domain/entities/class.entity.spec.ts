import { DomainError } from "src/core";
import { ClassEntity } from './class.entity';

describe('ClassEntity', () => {
  const validProps = {
    name: 'Math 101',
    description: 'Basic Math',
    numberOfStudents: 2,
    studentEmails: ['student1@test.com', 'student2@test.com'],
    organizationId: 'org-123',
    userId: 'user-123',
  };

  describe('create', () => {
    it('should create a class successfully', () => {
      const classEntity = ClassEntity.create(
        validProps.name,
        validProps.description,
        validProps.numberOfStudents,
        validProps.studentEmails,
        validProps.organizationId,
        validProps.userId,
      );

      expect(classEntity).toBeDefined();
      expect(classEntity.name).toBe(validProps.name);
      expect(classEntity.status).toBe('active');
      expect(classEntity.id).toBeDefined();
      expect(classEntity.studentEmails).toHaveLength(2);
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        ClassEntity.create(
          '',
          validProps.description,
          validProps.numberOfStudents,
          validProps.studentEmails,
          validProps.organizationId,
          validProps.userId,
        );
      }).toThrow(DomainError);
    });

    it('should throw error if number of students is invalid (0)', () => {
      expect(() => {
        ClassEntity.create(
          validProps.name,
          validProps.description,
          0,
          [],
          validProps.organizationId,
          validProps.userId,
        );
      }).toThrow(DomainError);
    });

    it('should throw error if email count does not match number of students', () => {
      expect(() => {
        ClassEntity.create(
          validProps.name,
          validProps.description,
          5, // Expecting 5
          ['one@test.com'], // Providing only 1
          validProps.organizationId,
          validProps.userId,
        );
      }).toThrow(DomainError);
    });

    it('should throw error if duplicate emails are provided', () => {
      expect(() => {
        ClassEntity.create(
          validProps.name,
          validProps.description,
          2,
          ['duplicate@test.com', 'duplicate@test.com'],
          validProps.organizationId,
          validProps.userId,
        );
      }).toThrow(DomainError);
    });

    it('should throw error if duplicate emails (case-insensitive) are provided', () => {
      expect(() => {
        ClassEntity.create(
          validProps.name,
          validProps.description,
          2,
          ['duplicate@test.com', 'DUPLICATE@test.com'],
          validProps.organizationId,
          validProps.userId,
        );
      }).toThrow(DomainError);
    });
  });

  describe('update', () => {
    let classEntity: ClassEntity;

    beforeEach(() => {
      classEntity = ClassEntity.create(
        validProps.name,
        validProps.description,
        validProps.numberOfStudents,
        validProps.studentEmails,
        validProps.organizationId,
        validProps.userId,
      );
    });

    it('should update class name successfully', () => {
      const newName = 'Advanced Math';
      classEntity.update({ name: newName });
      expect(classEntity.name).toBe(newName);
      expect(classEntity.updatedAt!.getTime()).toBeGreaterThanOrEqual(classEntity.createdAt!.getTime());
    });

    it('should update description successfully', () => {
      const newDescription = 'Advanced Math Course';
      classEntity.update({ description: newDescription });
      expect(classEntity.description).toBe(newDescription);
    });

    it('should update number of students successfully', () => {
      const newCount = 3;
      // When updating number of students, we might need to update emails too if validation is strict, 
      // but the entity update method checks validation independently for each field if provided.
      // However, looking at the code:
      // if (data.studentEmails !== undefined) { validateStudentEmails(..., data.numberOfStudents ?? this.props.numberOfStudents) }
      // So if we only update numberOfStudents, we need to make sure the existing emails are still valid for the new number?
      // Actually, the entity logic for update is:
      // if (data.numberOfStudents !== undefined) { validateNumberOfStudents...; this.props.numberOfStudents = ... }
      // It doesn't seem to re-validate existing emails against new number of students unless emails are also provided.
      // Wait, let's check the code again.
      
      /*
      if (data.numberOfStudents !== undefined) {
        ClassEntity.validateNumberOfStudents(data.numberOfStudents);
        this.props.numberOfStudents = data.numberOfStudents;
      }

      if (data.studentEmails !== undefined) {
        ClassEntity.validateStudentEmails(
          data.studentEmails,
          data.numberOfStudents ?? this.props.numberOfStudents,
        );
        this.props.studentEmails = data.studentEmails;
      }
      */
      
      // If I update numberOfStudents to 3, but keep existing 2 emails, it will be in an inconsistent state if I don't update emails too.
      // But the method allows partial updates. Ideally, one should update both if they change.
      // Let's test updating both.
      
      classEntity.update({ 
        numberOfStudents: 3,
        studentEmails: ['s1@test.com', 's2@test.com', 's3@test.com']
      });
      expect(classEntity.numberOfStudents).toBe(3);
      expect(classEntity.studentEmails).toHaveLength(3);
    });

    it('should throw error if new name is invalid', () => {
      expect(() => {
        classEntity.update({ name: '' });
      }).toThrow(DomainError);
    });

    it('should throw error if email count does not match new number of students', () => {
      expect(() => {
        classEntity.update({ 
          numberOfStudents: 5,
          studentEmails: ['s1@test.com'] 
        });
      }).toThrow(DomainError);
    });
  });

  describe('archive', () => {
    let classEntity: ClassEntity;

    beforeEach(() => {
      classEntity = ClassEntity.create(
        validProps.name,
        validProps.description,
        validProps.numberOfStudents,
        validProps.studentEmails,
        validProps.organizationId,
        validProps.userId,
      );
    });

    it('should archive class successfully', () => {
      classEntity.archive();
      expect(classEntity.status).toBe('archived');
      expect(classEntity.isActive).toBe(false);
      expect(classEntity.archivedAt).toBeInstanceOf(Date);
    });

    it('should throw error if class is already archived', () => {
      classEntity.archive();
      expect(() => {
        classEntity.archive();
      }).toThrow(DomainError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute class from persistence data', () => {
      const now = new Date();
      const data = {
        id: 'existing-id',
        name: 'History',
        code: 'history-123',
        description: 'History class',
        numberOfStudents: 10,
        studentEmails: [],
        accessToken: 'token-123',
        isActive: true,
        status: 'active' as const,
        organizationId: 'org-1',
        userId: 'user-1',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };

      const classEntity = ClassEntity.reconstitute(data);
      
      expect(classEntity.id).toBe(data.id);
      expect(classEntity.name).toBe(data.name);
      expect(classEntity.status).toBe(data.status);
      expect(classEntity.toPersistence()).toEqual(data);
    });
  });
});