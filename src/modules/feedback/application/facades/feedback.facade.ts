import { Injectable } from "@nestjs/common";
import { GetFeedbackSubjectsUseCase } from "../use-cases/GetFeedbackSubjects.use-case";
import { GetFeedbackBySubjectUseCase } from "../use-cases/GetFeedbackBySubject.use-case";
import { GetFeedbackSummaryUseCase } from "../use-cases/GetFeedbackSummary.use-case";
import { GetSubjectAlertsUseCase } from "../use-cases/GetSubjectAlerts.use-case";
import { CommentOnAlertUseCase } from "../use-cases/CommentOnAlert.use-case";
import { SendMessageForAlertUseCase } from "../use-cases/SendMessageForAlert.use-case";
import { MarkAlertAsProcessedUseCase } from "../use-cases/MarkAlertAsProcessed.use-case";
import { GetFeedbackSubjectByIdUseCase } from "../use-cases/GetFeedbackSubjectById.use-case";
import { SendReminderBySubjectUseCase } from "../use-cases/SendReminderBySubject.use-case";
import {
  GetFeedbackSubjectsInput,
  GetFeedbackSubjectsOutput,
  GetFeedbackBySubjectInput,
  GetFeedbackBySubjectOutput,
  GetFeedbackSummaryInput,
  GetFeedbackSummaryOutput,
  GetFeedbackAlertsInput,
  GetFeedbackAlertsOutput,
  GetFeedbackSubjectByIdInput,
  GetFeedbackSubjectByIdOutput,
  SendReminderBySubjectInput,
  SendReminderBySubjectOutput,
} from "../../domain/types";
import {
  CommentOnAlertInput,
  CommentOnAlertOutput,
} from "../use-cases/CommentOnAlert.use-case";
import {
  SendMessageForAlertInput,
  SendMessageForAlertOutput,
} from "../use-cases/SendMessageForAlert.use-case";
import {
  MarkAlertAsProcessedInput,
  MarkAlertAsProcessedOutput,
} from "../use-cases/MarkAlertAsProcessed.use-case";

@Injectable()
export class FeedbackFacade {
  constructor(
    private readonly getFeedbackSubjectsUseCase: GetFeedbackSubjectsUseCase,
    private readonly getFeedbackBySubjectUseCase: GetFeedbackBySubjectUseCase,
    private readonly getFeedbackSummaryUseCase: GetFeedbackSummaryUseCase,
    private readonly getSubjectAlertsUseCase: GetSubjectAlertsUseCase,
    private readonly commentOnAlertUseCase: CommentOnAlertUseCase,
    private readonly sendMessageForAlertUseCase: SendMessageForAlertUseCase,
    private readonly markAlertAsProcessedUseCase: MarkAlertAsProcessedUseCase,
    private readonly getFeedbackSubjectByIdUseCase: GetFeedbackSubjectByIdUseCase,
    private readonly sendReminderBySubjectUseCase: SendReminderBySubjectUseCase
  ) {}

  async getFeedbackSubjects(
    data: GetFeedbackSubjectsInput
  ): Promise<GetFeedbackSubjectsOutput> {
    return this.getFeedbackSubjectsUseCase.execute(data);
  }

  async getFeedbackBySubject(
    data: GetFeedbackBySubjectInput
  ): Promise<GetFeedbackBySubjectOutput> {
    return this.getFeedbackBySubjectUseCase.execute(data);
  }

  async getFeedbackSummary(
    data: GetFeedbackSummaryInput
  ): Promise<GetFeedbackSummaryOutput> {
    return this.getFeedbackSummaryUseCase.execute(data);
  }

  async getSubjectAlerts(
    data: GetFeedbackAlertsInput
  ): Promise<GetFeedbackAlertsOutput> {
    return this.getSubjectAlertsUseCase.execute(data);
  }

  async commentOnAlert(
    data: CommentOnAlertInput
  ): Promise<CommentOnAlertOutput> {
    return this.commentOnAlertUseCase.execute(data);
  }

  async sendMessageForAlert(
    data: SendMessageForAlertInput
  ): Promise<SendMessageForAlertOutput> {
    return this.sendMessageForAlertUseCase.execute(data);
  }

  async markAlertAsProcessed(
    data: MarkAlertAsProcessedInput
  ): Promise<MarkAlertAsProcessedOutput> {
    return this.markAlertAsProcessedUseCase.execute(data);
  }

  async getFeedbackSubjectById(
    data: GetFeedbackSubjectByIdInput
  ): Promise<GetFeedbackSubjectByIdOutput> {
    return this.getFeedbackSubjectByIdUseCase.execute(data);
  }

  async sendReminderBySubject(
    data: SendReminderBySubjectInput
  ): Promise<SendReminderBySubjectOutput> {
    return this.sendReminderBySubjectUseCase.execute(data);
  }
}
