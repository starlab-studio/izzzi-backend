import { DomainError, ErrorCode, ILoggerService, UserRole } from "src/core";
import { IMembershipRepository } from "../../domain/repositories/membership.repository";
import { IClassRepository } from "src/modules/class/domain/repositories/class.repository";
import { ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { IQuizRepository } from "src/modules/quiz/domain/repositories/quiz.repository";
import { IResponseRepository } from "src/modules/quiz/domain/repositories/response.repository";

export interface GetOrganizationStatsData {
  organizationId: string;
  requesterId: string;
}

export interface OrganizationStats {
  totalUsers: number;
  totalClasses: number;
  totalQuizzes: number;
  avgQuizzesPerClass: number;
  totalFeedbacks: number;
  avgFeedbacksPerClass: number;
}

export class GetOrganizationStatsUseCase {
  constructor(
    private readonly logger: ILoggerService,
    private readonly membershipRepository: IMembershipRepository,
    private readonly classRepository: IClassRepository,
    private readonly subjectRepository: ISubjectRepository,
    private readonly quizRepository: IQuizRepository,
    private readonly responseRepository: IResponseRepository
  ) {}

  async execute(data: GetOrganizationStatsData): Promise<OrganizationStats> {
    this.logger.info(`Getting organization stats: organizationId=${data.organizationId}`);

    // Verify requester has admin role in the organization
    const requesterMembership = await this.membershipRepository.findByUserAndOrganization(
      data.requesterId,
      data.organizationId
    );

    if (!requesterMembership || requesterMembership.role !== UserRole.ADMIN) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED_ROLE,
        "Only admin can view organization stats"
      );
    }

    const memberships = await this.membershipRepository.findActiveByOrganization(
      data.organizationId
    );
    const totalUsers = memberships.length;

    const classes = await this.classRepository.findByOrganization(data.organizationId);
    const totalClasses = classes.length;

    const subjects = await this.subjectRepository.findByOrganization(data.organizationId);
    
    let totalQuizzes = 0;
    let totalFeedbacks = 0;

    for (const subject of subjects) {
      const quizzes = await this.quizRepository.findBySubject(subject.id);
      totalQuizzes += quizzes.length;

      for (const quiz of quizzes) {
        const responseCount = await this.responseRepository.countByQuiz(quiz.id);
        totalFeedbacks += responseCount;
      }
    }

    const avgQuizzesPerClass = totalClasses > 0 ? totalQuizzes / totalClasses : 0;
    const avgFeedbacksPerClass = totalClasses > 0 ? totalFeedbacks / totalClasses : 0;

    return {
      totalUsers,
      totalClasses,
      totalQuizzes,
      avgQuizzesPerClass: Math.round(avgQuizzesPerClass * 10) / 10,
      totalFeedbacks,
      avgFeedbacksPerClass: Math.round(avgFeedbacksPerClass * 10) / 10,
    };
  }
}
