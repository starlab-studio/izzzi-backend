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

