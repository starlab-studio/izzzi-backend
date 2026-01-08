export interface IAiAnalysis {
  readonly id: string;
  quizId: string;
  subjectId: string;
  model: string;
  summaryText: string;
  globalScore: number | null;
  sentiment: "positive" | "negative" | "neutral" | "mixed" | null;
  alertType: "none" | "positive" | "negative";
  alertMessage: string | null;
  keyPoints: string[] | null;
  recommendations: string[] | null;
  confidence: number | null;
  tokensUsed: number | null;
  triggeredEmail: boolean;
  createdAt: Date;
}
