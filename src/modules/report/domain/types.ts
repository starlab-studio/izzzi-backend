export interface CreateReportInput {
  organizationId: string;
  organizationName: string;
  reportContent: string;
  subjectIds: string[];
}

export interface CreateReportOutput {
  success: boolean;
  message: string;
}
