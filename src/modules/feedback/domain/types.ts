export interface GetFeedbackSubjectsInput {
  organizationId: string;
  userId: string;
  tab?: "ongoing" | "finished";
  search?: string;
  sort?: "plus_recent" | "plus_anciens";
  filter?: "tous" | "pendant_cours" | "fin_cours";
}

export interface FeedbackSubjectResponse {
  id: string;
  subjectId: string;
  name: string;
  code: string;
  teacher: string;
  formType?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  feedbackCount: number;
  score: number;
  alerts: Array<{
    id: string;
    type: "negative" | "positive";
    number: string;
    content: string;
    timestamp: string;
  }>;
  alertsCount: number;
  summary: string;
  hasVisibleRetours: boolean;
}

export interface GetFeedbackSubjectsOutput {
  subjects: FeedbackSubjectResponse[];
}

export interface GetFeedbackBySubjectInput {
  organizationId: string;
  userId: string;
  subjectId: string;
  momentId: string;
}

export interface FeedbackResponse {
  id: string;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: "stars" | "radio" | "checkbox" | "textarea";
    valueStars?: number | null;
    valueRadio?: string | null;
    valueCheckbox?: string[] | null;
    valueText?: string | null;
  }>;
}

export interface GetFeedbackBySubjectOutput {
  momentId: string;
  subjectId: string;
  responses: FeedbackResponse[];
  totalResponses: number;
  visibleResponses: number;
  hiddenResponses: number;
}

export interface GetFeedbackSummaryInput {
  organizationId: string;
  userId: string;
  subjectId: string;
}

export interface GetFeedbackSummaryOutput {
  summary: string;
  fullSummary?: string;
}

export interface GetFeedbackAlertsInput {
  organizationId: string;
  userId: string;
  subjectId: string;
}

export interface FeedbackAlert {
  id: string;
  type: "negative" | "positive";
  number: string;
  content: string;
  timestamp: string;
  isProcessed: boolean;
}

export interface GetFeedbackAlertsOutput {
  alerts: FeedbackAlert[];
}
