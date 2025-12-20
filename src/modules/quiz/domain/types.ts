export interface IQuizTemplate {
  readonly id: string;
  type: "during_course" | "after_course";
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizTemplateQuestion {
  readonly id: string;
  templateId: string;
  text: string;
  type: "stars" | "radio" | "checkbox" | "textarea";
  options: string[] | null;
  validationRules: {
    required?: boolean;
    min_length?: number;
    max_length?: number;
  } | null;
  orderIndex: number;
  category: "global" | "course" | "instructor";
  createdAt: Date;
}

export interface IQuizTemplatePair {
  readonly id: string;
  name: string;
  description: string | null;
  duringCourseTemplateId: string;
  afterCourseTemplateId: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface IQuiz {
  readonly id: string;
  subjectId: string;
  templateId: string;
  type: "during_course" | "after_course";
  status: "draft" | "active" | "closed";
  accessToken: string;
  qrCodeUrl: string | null;
  publicUrl: string | null;
  activatedAt: Date | null;
  closedAt: Date | null;
  responseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentQuizToken {
  readonly id: string;
  quizId: string;
  classStudentId: string;
  token: string;
  hasResponded: boolean;
  respondedAt: Date | null;
  emailSentAt: Date | null;
  reminderCount: number;
  lastReminderAt: Date | null;
  createdAt: Date;
}

export interface IResponse {
  readonly id: string;
  quizId: string;
  fingerprint: string | null;
  submittedAt: Date;
  completionTimeSeconds: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  isComplete: boolean;
  createdAt: Date;
}

export interface IAnswer {
  readonly id: string;
  responseId: string;
  questionId: string;
  valueStars: number | null;
  valueRadio: string | null;
  valueCheckbox: string[] | null;
  valueText: string | null;
  createdAt: Date;
}

export interface IQuizReminder {
  readonly id: string;
  quizId: string;
  scheduledAt: Date;
  sentAt: Date | null;
  status: "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdByUserId: string;
  createdAt: Date;
}

// Use Case Input/Output Types
export interface GetQuizTemplatePairsInput {
  organizationId: string;
  userId: string;
}

export interface QuizTemplatePairResponse {
  id: string;
  name: string;
  description: string | null;
  duringCourse: {
    id: string;
    name: string;
    type: "during_course";
    previewImageUrl: string | null;
    questionsCount: number;
  };
  afterCourse: {
    id: string;
    name: string;
    type: "after_course";
    previewImageUrl: string | null;
    questionsCount: number;
  };
}

export interface GetQuizTemplatePairsOutput {
  pairs: QuizTemplatePairResponse[];
}

export interface GetQuizTemplateByIdInput {
  templateId: string;
  organizationId: string;
  userId: string;
}

export interface QuizTemplateQuestionResponse {
  id: string;
  text: string;
  type: "stars" | "radio" | "checkbox" | "textarea";
  options: string[] | null;
  validationRules: {
    required?: boolean;
    min_length?: number;
    max_length?: number;
  } | null;
  orderIndex: number;
  category: "global" | "course" | "instructor";
}

export interface GetQuizTemplateByIdOutput {
  id: string;
  name: string;
  type: "during_course" | "after_course";
  description: string | null;
  previewImageUrl: string | null;
  questions: QuizTemplateQuestionResponse[];
}

export interface CreateQuizTemplateInput {
  name: string;
  type: "during_course" | "after_course";
  description?: string | null;
  previewImageUrl?: string | null;
  questions: {
    text: string;
    type: "stars" | "radio" | "checkbox" | "textarea";
    options: string[] | null;
    validationRules: {
      required?: boolean;
      min_length?: number;
      max_length?: number;
    } | null;
    orderIndex: number;
    category: "global" | "course" | "instructor";
  }[];
  organizationId: string;
  userId: string;
}

export interface CreateQuizTemplateOutput {
  id: string;
  name: string;
  type: "during_course" | "after_course";
  description: string | null;
  previewImageUrl: string | null;
  questions: QuizTemplateQuestionResponse[];
}

export interface AssignQuizPairToSubjectInput {
  subjectId: string;
  templatePairId: string;
  organizationId: string;
  userId: string;
}

export interface QuizResponse {
  id: string;
  type: "during_course" | "after_course";
  status: "draft" | "active" | "closed";
  accessToken: string;
  publicUrl: string | null;
  qrCodeUrl: string | null;
  responseCount?: number;
  hasBeenSent?: boolean; // Indique si le quiz a été envoyé aux étudiants (au moins un email envoyé)
  template: {
    id: string;
    name: string;
  };
}

export interface AssignQuizPairToSubjectOutput {
  duringCourse: QuizResponse;
  afterCourse: QuizResponse;
}

export interface ReassignQuizPairToSubjectInput {
  subjectId: string;
  templatePairId: string;
  organizationId: string;
  userId: string;
}

export interface ReassignQuizPairToSubjectOutput {
  duringCourse: QuizResponse;
  afterCourse: QuizResponse;
}

export interface GetQuizzesBySubjectInput {
  subjectId: string;
  organizationId: string;
  userId: string;
}

export interface GetQuizzesBySubjectOutput {
  quizzes: QuizResponse[];
}

export interface GetQuizByIdInput {
  quizId: string;
  organizationId: string;
  userId: string;
}

export interface GetQuizByIdOutput {
  id: string;
  type: "during_course" | "after_course";
  status: "draft" | "active" | "closed";
  accessToken: string;
  publicUrl: string | null;
  qrCodeUrl: string | null;
  responseCount: number;
  subject: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  template: {
    id: string;
    name: string;
  };
}

export interface GetQuizLinkInput {
  quizId: string;
  organizationId: string;
  userId: string;
}

export interface GetQuizLinkOutput {
  publicUrl: string;
  qrCodeUrl: string | null;
}

export interface SendQuizToStudentsInput {
  quizId: string;
  organizationId: string;
  userId: string;
}

export interface SendQuizToStudentsOutput {
  sentCount: number;
  alreadySentCount: number;
}

export interface RemindQuizToStudentsInput {
  quizId: string;
  organizationId: string;
  userId: string;
}

export interface RemindQuizToStudentsOutput {
  remindedCount: number;
  alreadyRespondedCount: number;
  message?: string;
}

export interface GetQuizByAccessTokenInput {
  accessToken: string;
}

export interface GetQuizByAccessTokenOutput {
  id: string;
  type: "during_course" | "after_course";
  status: "draft" | "active" | "closed";
  subject: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
    organization: {
      id: string;
      name: string;
    };
  };
  template: {
    id: string;
    name: string;
    questions: Array<{
      id: string;
      text: string;
      type: "stars" | "radio" | "checkbox" | "textarea";
      options: string[] | null;
      validationRules: {
        required?: boolean;
        min_length?: number;
        max_length?: number;
      } | null;
      orderIndex: number;
      category: "global" | "course" | "instructor";
    }>;
  };
}

export interface SubmitQuizResponseInput {
  quizId: string;
  responses: Array<{
    questionId: string;
    valueText?: string;
    valueNumber?: number;
    valueJson?: any;
  }>;
  ipAddress?: string | null;
  userAgent?: string | null;
  completionTimeSeconds?: number | null;
}

export interface SubmitQuizResponseOutput {
  responseId: string;
  success: boolean;
  message: string;
}

export interface CheckQuizResponseStatusInput {
  quizId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CheckQuizResponseStatusOutput {
  hasResponded: boolean;
  responseId: string | null;
}

export interface GetQuizStatisticsInput {
  quizId: string;
  organizationId: string;
  userId: string;
}

export interface QuestionStatistics {
  questionId: string;
  questionText: string;
  questionType: "stars" | "radio" | "checkbox" | "textarea";
  orderIndex: number;
  category: "global" | "course" | "instructor";
  // For stars
  starsAverage?: number;
  starsDistribution?: Record<number, number>; // { 1: 2, 2: 3, ... }
  // For radio/checkbox
  optionsDistribution?: Record<string, number>; // { "Option 1": 5, "Option 2": 3, ... }
  // For textarea
  textResponses?: string[];
  // Total responses for this question
  totalResponses: number;
}

export interface TemporalDataPoint {
  date: string; // ISO date string
  count: number;
  averageStars?: number;
}

export interface GetQuizStatisticsOutput {
  quizId: string;
  totalResponses: number;
  questions: QuestionStatistics[];
  temporalEvolution: TemporalDataPoint[];
}

