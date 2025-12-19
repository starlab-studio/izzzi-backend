import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import {
  ISubject,
  GetSubjectsByClassInput,
  GetSubjectsByClassOutput,
  ClassSubjectDetailsResponse,
} from "../../domain/types";
import { ISubjectRepository } from "../../domain/repositories/subject.repository";
import { ISubjectAssignmentRepository } from "../../domain/repositories/subject-assignment.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";

export class GetSubjectsByClassUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly classRepository: IClassRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly subjectAssignmentRepository: ISubjectAssignmentRepository,
    private readonly organizationFacade: OrganizationFacade,
  ) {
    super(logger);
  }

  async execute(data: GetSubjectsByClassInput): Promise<GetSubjectsByClassOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const classEntity = await this.classRepository.findById(data.classId);
      if (!classEntity) {
        throw new DomainError(ErrorCode.CLASS_NOT_FOUND, "Class not found");
      }

      if (classEntity.organizationId !== data.organizationId) {
        throw new DomainError(ErrorCode.UNAUTHORIZED_ACCESS, "Unauthorized access to class");
      }

      const isClassArchived = classEntity.status === "archived";

      const subjectAssignments = await this.subjectAssignmentRepository.findByClass(data.classId);

      const assignmentsToProcess = isClassArchived
        ? subjectAssignments
        : subjectAssignments.filter((assignment) => assignment.isActive);
      
      const assignmentOrderMap = new Map<string, number>();
      assignmentsToProcess.forEach((assignment) => {
        assignmentOrderMap.set(assignment.subjectId, assignment.orderIndex);
      });

      const classSubjects: ClassSubjectDetailsResponse[] = [];
      
      const formatDateToString = (date: Date | string | null | undefined): string | null => {
        if (!date) return null;
        if (date instanceof Date) {
          return date.toISOString().split("T")[0];
        }
        if (typeof date === "string") {
          // Si la date est déjà au format YYYY-MM-DD, on la retourne telle quelle
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
          }
          // Sinon, on essaie de la parser
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0];
          }
        }
        return null;
      };
      
      for (const assignment of assignmentsToProcess) {
        const subjectEntity = await this.subjectRepository.findById(assignment.subjectId);
        
        if (subjectEntity && (isClassArchived || subjectEntity.isActive)) {
          const subjectData = subjectEntity.toPersistence();
          
          classSubjects.push({
            id: subjectData.id,
            name: subjectData.name,
            instructorName: subjectData.instructorName || null,
            instructorEmail: subjectData.instructorEmail || null,
            firstCourseDate: formatDateToString(subjectData.firstCourseDate),
            lastCourseDate: formatDateToString(subjectData.lastCourseDate),
            formType: null,
            feedbackMoments: [],
          });
        }
      }

      classSubjects.sort((a, b) => {
        const orderA = assignmentOrderMap.get(a.id) ?? 0;
        const orderB = assignmentOrderMap.get(b.id) ?? 0;
        return orderA - orderB;
      });

      return { subjects: classSubjects };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {}
}

