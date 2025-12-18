import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
  IEventStore,
} from "src/core";

import {
  ISubject,
  CreateSubjectInput,
  CreateSubjectOutput,
} from "../../domain/types";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "../../domain/repositories/subject-assignment.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { SubjectEntity } from "../../domain/entities/subject.entity";
import { SubjectAssignmentEntity } from "../../domain/entities/subject-assignment.entity";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { SubjectCreatedEvent } from "../../domain/events/subjectCreated.event";

export class CreateSubjectUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly eventStore: IEventStore,
  ) {
    super(logger);
  }

  async execute(data: CreateSubjectInput): Promise<CreateSubjectOutput> {
    try {
      // Validate user belongs to organization
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      // Verify class exists and belongs to organization
      const classEntity = await this.classRepository.findById(data.classId);
      if (!classEntity) {
        throw new DomainError(ErrorCode.CLASS_NOT_FOUND, "Class not found");
      }

      if (classEntity.organizationId !== data.organizationId) {
        throw new DomainError(ErrorCode.UNAUTHORIZED_ACCESS, "Unauthorized access to class");
      }

      // Check if subject already exists in organization (by name)
      let subjectEntity = await this.subjectRepository.findByName(
        data.name.trim(),
        data.organizationId,
      );

      let isNewSubject = false;

      // If subject doesn't exist, create it
      if (!subjectEntity) {
        isNewSubject = true;
        subjectEntity = SubjectEntity.create({
          name: data.name.trim(),
          organizationId: data.organizationId,
          createdBy: data.userId,
          instructorName: data.instructorName ?? null,
          instructorEmail: data.instructorEmail ?? null,
          firstCourseDate: data.firstCourseDate ? new Date(data.firstCourseDate) : null,
          lastCourseDate: data.lastCourseDate ? new Date(data.lastCourseDate) : null,
        });
        subjectEntity = await this.subjectRepository.create(subjectEntity);
      } else {
        // Update existing subject with new instructor data if provided
        if (data.instructorName !== undefined || data.instructorEmail !== undefined || 
            data.firstCourseDate !== undefined || data.lastCourseDate !== undefined) {
          subjectEntity.update({
            instructorName: data.instructorName ?? null,
            instructorEmail: data.instructorEmail ?? null,
            firstCourseDate: data.firstCourseDate ? new Date(data.firstCourseDate) : null,
            lastCourseDate: data.lastCourseDate ? new Date(data.lastCourseDate) : null,
          });
          subjectEntity = await this.subjectRepository.save(subjectEntity);
        }
      }

      // Check if assignment already exists
      const existingAssignment = await this.subjectAssignmentRepository.findBySubjectAndClass(
        subjectEntity.id,
        data.classId,
      );

      if (existingAssignment) {
        if (!existingAssignment.isActive) {
          // Reactivate the assignment
          await this.subjectAssignmentRepository.toggleActive(
            subjectEntity.id,
            data.classId,
            true,
          );
        }
        return {
          subjectId: subjectEntity.id,
          assignmentId: `${subjectEntity.id}:${data.classId}`,
          subject: subjectEntity.toPersistence(),
        };
      }

      // Create new assignment
      const assignmentEntity = SubjectAssignmentEntity.create({
        subjectId: subjectEntity.id,
        classId: data.classId,
      });

      const createdAssignment = await this.subjectAssignmentRepository.assign(assignmentEntity);

      // Publish event only when a new subject is created (not when reusing existing)
      if (isNewSubject) {
        this.eventStore.publish(
          new SubjectCreatedEvent({
            id: subjectEntity.id,
            name: subjectEntity.name,
            organizationId: subjectEntity.organizationId,
            createdBy: subjectEntity.createdBy,
            userEmail: data.userEmail,
          }),
        );
      }

      return {
        subjectId: subjectEntity.id,
        assignmentId: `${createdAssignment.subjectId}:${createdAssignment.classId}`,
        subject: subjectEntity.toPersistence(),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}
