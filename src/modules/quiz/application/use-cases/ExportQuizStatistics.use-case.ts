import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
  DomainError,
  ErrorCode,
} from "src/core";
import { IQuizRepository } from "../../domain/repositories/quiz.repository";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { IResponseRepository } from "../../domain/repositories/response.repository";
import { IAnswerRepository } from "../../domain/repositories/answer.repository";
import { OrganizationFacade } from "src/modules/organization/application/facades/organization.facade";
import { ISubscriptionRepository } from "src/modules/subscription/domain/repositories/subscription.repository";
import { ISubscriptionPlanRepository } from "src/modules/subscription/domain/repositories/subscription-plan.repository";
import { ResponseEntity } from "../../domain/entities/response.entity";
import { ResponseVisibilityService } from "../../domain/services/response-visibility.service";
import * as XLSX from "xlsx";

export interface ExportQuizStatisticsInput {
  quizId: string;
  organizationId: string;
  userId: string;
  format: "csv" | "xlsx";
}

export interface ExportQuizStatisticsOutput {
  data: string | Buffer;
  filename: string;
  contentType: string;
}

export class ExportQuizStatisticsUseCase
  extends BaseUseCase
  implements IUseCase
{
  constructor(
    readonly logger: ILoggerService,
    private readonly quizRepository: IQuizRepository,
    private readonly quizTemplateRepository: IQuizTemplateRepository,
    private readonly responseRepository: IResponseRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly responseVisibilityService: ResponseVisibilityService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionPlanRepository: ISubscriptionPlanRepository,
  ) {
    super(logger);
  }

  async execute(
    data: ExportQuizStatisticsInput,
  ): Promise<ExportQuizStatisticsOutput> {
    try {
      await this.organizationFacade.validateUserBelongsToOrganization(
        data.userId,
        data.organizationId,
      );

      const quiz = await this.quizRepository.findById(data.quizId);
      if (!quiz) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Quiz not found");
      }

      const subscription =
        await this.subscriptionRepository.findActiveByOrganizationId(
          data.organizationId,
        );
      const plan = subscription
        ? await this.subscriptionPlanRepository.findById(subscription.planId)
        : null;

      const allResponses = await this.responseRepository.findByQuiz(
        data.quizId,
      );

      const responseEntities = allResponses.map((r) =>
        ResponseEntity.reconstitute(r),
      );

      const visibleResponses =
        this.responseVisibilityService.getVisibleResponses(
          responseEntities,
          subscription,
          plan,
        );

      const visibleResponseIds = new Set(visibleResponses.map((r) => r.id));
      const responses = allResponses.filter((r) =>
        visibleResponseIds.has(r.id),
      );

      const allAnswers = await this.answerRepository.findByQuiz(data.quizId);

      const visibleAnswerResponseIds = new Set(responses.map((r) => r.id));
      const visibleAnswers = allAnswers.filter((a) => {
        const response = allResponses.find((r) => r.id === a.responseId);
        return response && visibleAnswerResponseIds.has(response.id);
      });

      const template = await this.quizTemplateRepository.findById(
        quiz.templateId,
      );
      if (!template) {
        throw new DomainError(ErrorCode.UNEXPECTED_ERROR, "Template not found");
      }

      const questions = template.questionsList.sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );

      const responsesData = responses.map((r) => ({
        id: r.id,
        submittedAt: r.submittedAt,
      }));

      const answersData = visibleAnswers.map((a) => ({
        id: a.id,
        responseId: a.responseId,
        questionId: a.questionId,
        valueStars: a.valueStars,
        valueRadio: a.valueRadio,
        valueCheckbox: a.valueCheckbox,
        valueText: a.valueText,
      }));

      const sanitizedQuizName = "quiz";
      const dateStr = new Date().toISOString().split("T")[0];

      if (data.format === "xlsx") {
        const buffer = this.generateExcel(
          questions,
          responsesData,
          answersData,
        );
        const filename = `retours_${sanitizedQuizName}_${dateStr}.xlsx`;
        return {
          data: buffer,
          filename,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      } else {
        const csv = this.generateCSV(questions, responsesData, answersData);
        const filename = `retours_${sanitizedQuizName}_${dateStr}.csv`;
        return {
          data: csv,
          filename,
          contentType: "text/csv; charset=utf-8",
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private generateCSV(
    questions: Array<{
      id: string;
      text: string;
      type: "stars" | "radio" | "checkbox" | "textarea";
      orderIndex: number;
    }>,
    responses: Array<{
      id: string;
      submittedAt: Date;
    }>,
    answers: Array<{
      id: string;
      responseId: string;
      questionId: string;
      valueStars: number | null;
      valueRadio: string | null;
      valueCheckbox: string[] | null;
      valueText: string | null;
    }>,
  ): string {
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ["Date de soumission", ...questions.map((q) => q.text)];

    const csvRows: string[] = [headers.map(escapeCSV).join(",")];

    const answersByResponse = new Map<
      string,
      Map<string, (typeof answers)[0]>
    >();
    answers.forEach((answer) => {
      if (!answersByResponse.has(answer.responseId)) {
        answersByResponse.set(answer.responseId, new Map());
      }
      answersByResponse.get(answer.responseId)!.set(answer.questionId, answer);
    });

    const sortedResponses = [...responses].sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );

    sortedResponses.forEach((response) => {
      const responseAnswers = answersByResponse.get(response.id) || new Map();
      const row = [
        new Date(response.submittedAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...questions.map((question) => {
          const answer = responseAnswers.get(question.id);
          if (!answer) return "";

          if (question.type === "stars" && answer.valueStars !== null) {
            return String(answer.valueStars);
          } else if (question.type === "radio" && answer.valueRadio) {
            return answer.valueRadio;
          } else if (
            question.type === "checkbox" &&
            answer.valueCheckbox &&
            answer.valueCheckbox.length > 0
          ) {
            return answer.valueCheckbox.join("; ");
          } else if (question.type === "textarea" && answer.valueText) {
            return answer.valueText;
          }
          return "";
        }),
      ];
      csvRows.push(row.map(escapeCSV).join(","));
    });

    return csvRows.join("\n");
  }

  private generateExcel(
    questions: Array<{
      id: string;
      text: string;
      type: "stars" | "radio" | "checkbox" | "textarea";
      orderIndex: number;
    }>,
    responses: Array<{
      id: string;
      submittedAt: Date;
    }>,
    answers: Array<{
      id: string;
      responseId: string;
      questionId: string;
      valueStars: number | null;
      valueRadio: string | null;
      valueCheckbox: string[] | null;
      valueText: string | null;
    }>,
  ): Buffer {
    const headers = ["Date de soumission", ...questions.map((q) => q.text)];

    const answersByResponse = new Map<
      string,
      Map<string, (typeof answers)[0]>
    >();
    answers.forEach((answer) => {
      if (!answersByResponse.has(answer.responseId)) {
        answersByResponse.set(answer.responseId, new Map());
      }
      answersByResponse.get(answer.responseId)!.set(answer.questionId, answer);
    });

    const sortedResponses = [...responses].sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );

    const rows: any[][] = [headers];

    sortedResponses.forEach((response) => {
      const responseAnswers = answersByResponse.get(response.id) || new Map();
      const row = [
        new Date(response.submittedAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...questions.map((question) => {
          const answer = responseAnswers.get(question.id);
          if (!answer) return "";

          if (question.type === "stars" && answer.valueStars !== null) {
            return answer.valueStars;
          } else if (question.type === "radio" && answer.valueRadio) {
            return answer.valueRadio;
          } else if (
            question.type === "checkbox" &&
            answer.valueCheckbox &&
            answer.valueCheckbox.length > 0
          ) {
            return answer.valueCheckbox.join("; ");
          } else if (question.type === "textarea" && answer.valueText) {
            return answer.valueText;
          }
          return "";
        }),
      ];
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Retours");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async withCompensation(): Promise<void> {}
}
