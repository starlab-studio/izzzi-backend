import { Injectable } from "@nestjs/common";
import { GetFeedbackSubjectsUseCase } from "../use-cases/GetFeedbackSubjects.use-case";
import { GetFeedbackBySubjectUseCase } from "../use-cases/GetFeedbackBySubject.use-case";
import {
  GetFeedbackSubjectsInput,
  GetFeedbackSubjectsOutput,
  GetFeedbackBySubjectInput,
  GetFeedbackBySubjectOutput,
} from "../../domain/types";

@Injectable()
export class FeedbackFacade {
  constructor(
    private readonly getFeedbackSubjectsUseCase: GetFeedbackSubjectsUseCase,
    private readonly getFeedbackBySubjectUseCase: GetFeedbackBySubjectUseCase
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
}
