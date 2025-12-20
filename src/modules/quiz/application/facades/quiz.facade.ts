import {
  GetQuizTemplatePairsInput,
  GetQuizTemplatePairsOutput,
  GetQuizTemplateByIdInput,
  GetQuizTemplateByIdOutput,
  CreateQuizTemplateInput,
  CreateQuizTemplateOutput,
  AssignQuizPairToSubjectInput,
  AssignQuizPairToSubjectOutput,
  ReassignQuizPairToSubjectInput,
  ReassignQuizPairToSubjectOutput,
  GetQuizzesBySubjectInput,
  GetQuizzesBySubjectOutput,
  GetQuizByIdInput,
  GetQuizByIdOutput,
  GetQuizLinkInput,
  GetQuizLinkOutput,
  SendQuizToStudentsInput,
  SendQuizToStudentsOutput,
  RemindQuizToStudentsInput,
  RemindQuizToStudentsOutput,
  GetQuizByAccessTokenInput,
  GetQuizByAccessTokenOutput,
  SubmitQuizResponseInput,
  SubmitQuizResponseOutput,
  CheckQuizResponseStatusInput,
  CheckQuizResponseStatusOutput,
  GetQuizStatisticsInput,
  GetQuizStatisticsOutput,
} from "../../domain/types";
import { GetQuizTemplatePairsUseCase } from "../use-cases/GetQuizTemplatePairs.use-case";
import { GetQuizTemplateByIdUseCase } from "../use-cases/GetQuizTemplateById.use-case";
import { CreateQuizTemplateUseCase } from "../use-cases/CreateQuizTemplate.use-case";
import { AssignQuizPairToSubjectUseCase } from "../use-cases/AssignQuizPairToSubject.use-case";
import { ReassignQuizPairToSubjectUseCase } from "../use-cases/ReassignQuizPairToSubject.use-case";
import { GetQuizzesBySubjectUseCase } from "../use-cases/GetQuizzesBySubject.use-case";
import { GetQuizByIdUseCase } from "../use-cases/GetQuizById.use-case";
import { GetQuizLinkUseCase } from "../use-cases/GetQuizLink.use-case";
import { SendQuizToStudentsUseCase } from "../use-cases/SendQuizToStudents.use-case";
import { RemindQuizToStudentsUseCase } from "../use-cases/RemindQuizToStudents.use-case";
import { GetQuizByAccessTokenUseCase } from "../use-cases/GetQuizByAccessToken.use-case";
import { SubmitQuizResponseUseCase } from "../use-cases/SubmitQuizResponse.use-case";
import { CheckQuizResponseStatusUseCase } from "../use-cases/CheckQuizResponseStatus.use-case";
import { GetQuizStatisticsUseCase } from "../use-cases/GetQuizStatistics.use-case";

export class QuizFacade {
  constructor(
    private readonly getQuizTemplatePairsUseCase: GetQuizTemplatePairsUseCase,
    private readonly getQuizTemplateByIdUseCase: GetQuizTemplateByIdUseCase,
    private readonly createQuizTemplateUseCase: CreateQuizTemplateUseCase,
    private readonly assignQuizPairToSubjectUseCase: AssignQuizPairToSubjectUseCase,
    private readonly reassignQuizPairToSubjectUseCase: ReassignQuizPairToSubjectUseCase,
    private readonly getQuizzesBySubjectUseCase: GetQuizzesBySubjectUseCase,
    private readonly getQuizByIdUseCase: GetQuizByIdUseCase,
    private readonly getQuizLinkUseCase: GetQuizLinkUseCase,
    private readonly sendQuizToStudentsUseCase: SendQuizToStudentsUseCase,
    private readonly remindQuizToStudentsUseCase: RemindQuizToStudentsUseCase,
    private readonly getQuizByAccessTokenUseCase: GetQuizByAccessTokenUseCase,
    private readonly submitQuizResponseUseCase: SubmitQuizResponseUseCase,
    private readonly checkQuizResponseStatusUseCase: CheckQuizResponseStatusUseCase,
    private readonly getQuizStatisticsUseCase: GetQuizStatisticsUseCase,
  ) {}

  async getQuizTemplatePairs(
    data: GetQuizTemplatePairsInput,
  ): Promise<GetQuizTemplatePairsOutput> {
    return await this.getQuizTemplatePairsUseCase.execute(data);
  }

  async getQuizTemplateById(
    data: GetQuizTemplateByIdInput,
  ): Promise<GetQuizTemplateByIdOutput> {
    return await this.getQuizTemplateByIdUseCase.execute(data);
  }

  async createQuizTemplate(
    data: CreateQuizTemplateInput,
  ): Promise<CreateQuizTemplateOutput> {
    return await this.createQuizTemplateUseCase.execute(data);
  }

  async assignQuizPairToSubject(
    data: AssignQuizPairToSubjectInput,
  ): Promise<AssignQuizPairToSubjectOutput> {
    return await this.assignQuizPairToSubjectUseCase.execute(data);
  }

  async reassignQuizPairToSubject(
    data: ReassignQuizPairToSubjectInput,
  ): Promise<ReassignQuizPairToSubjectOutput> {
    return await this.reassignQuizPairToSubjectUseCase.execute(data);
  }

  async getQuizzesBySubject(
    data: GetQuizzesBySubjectInput,
  ): Promise<GetQuizzesBySubjectOutput> {
    return await this.getQuizzesBySubjectUseCase.execute(data);
  }

  async getQuizById(
    data: GetQuizByIdInput,
  ): Promise<GetQuizByIdOutput> {
    return await this.getQuizByIdUseCase.execute(data);
  }

  async getQuizLink(
    data: GetQuizLinkInput,
  ): Promise<GetQuizLinkOutput> {
    return await this.getQuizLinkUseCase.execute(data);
  }

  async sendQuizToStudents(
    data: SendQuizToStudentsInput,
  ): Promise<SendQuizToStudentsOutput> {
    return await this.sendQuizToStudentsUseCase.execute(data);
  }

  async remindQuizToStudents(
    data: RemindQuizToStudentsInput,
  ): Promise<RemindQuizToStudentsOutput> {
    return await this.remindQuizToStudentsUseCase.execute(data);
  }

  async getQuizByAccessToken(
    data: GetQuizByAccessTokenInput,
  ): Promise<GetQuizByAccessTokenOutput> {
    return await this.getQuizByAccessTokenUseCase.execute(data);
  }

  async submitQuizResponse(
    data: SubmitQuizResponseInput,
  ): Promise<SubmitQuizResponseOutput> {
    return await this.submitQuizResponseUseCase.execute(data);
  }

  async checkQuizResponseStatus(
    data: CheckQuizResponseStatusInput,
  ): Promise<CheckQuizResponseStatusOutput> {
    return await this.checkQuizResponseStatusUseCase.execute(data);
  }

  async getQuizStatistics(
    data: GetQuizStatisticsInput,
  ): Promise<GetQuizStatisticsOutput> {
    return await this.getQuizStatisticsUseCase.execute(data);
  }
}

