import {
  IUseCase,
  BaseUseCase,
  ILoggerService,
} from "src/core";

import {
  BulkCreateSubjectsInput,
  BulkCreateSubjectsOutput,
  CreateSubjectInput,
} from "../../domain/types";
import { CreateSubjectUseCase } from "./CreateSubject.use-case";

export class BulkCreateSubjectsUseCase extends BaseUseCase implements IUseCase {
  constructor(
    readonly logger: ILoggerService,
    private readonly createSubjectUseCase: CreateSubjectUseCase,
  ) {
    super(logger);
  }

  async execute(input: BulkCreateSubjectsInput): Promise<BulkCreateSubjectsOutput> {
    try {
      const results: BulkCreateSubjectsOutput = {
        success: true,
        createdCount: 0,
        errors: [],
        subjects: [],
      };

      // Process each subject
      for (let i = 0; i < input.subjects.length; i++) {
        const subjectInput = input.subjects[i];
        const rowNumber = i + 1; // 1-based row number

        try {
          const createInput: CreateSubjectInput = {
            classId: input.classId,
            organizationId: input.organizationId,
            userId: input.userId,
            userEmail: input.userEmail,
            name: subjectInput.name,
            instructorName: subjectInput.instructorName,
            instructorEmail: subjectInput.instructorEmail,
            firstCourseDate: subjectInput.firstCourseDate,
            lastCourseDate: subjectInput.lastCourseDate,
          };

          const result = await this.createSubjectUseCase.execute(createInput);
          results.subjects.push(result.subject);
          results.createdCount++;
        } catch (error: any) {
          // Collect error for this row
          const errorMessage = error?.message || error?.errors?.[0]?.message || "Unknown error";
          results.errors.push({
            row: rowNumber,
            error: errorMessage,
          });
          this.logger.warn(`Error creating subject at row ${rowNumber}: ${errorMessage}`);
        }
      }

      // If no subjects were created, mark as failed
      if (results.createdCount === 0 && results.errors.length > 0) {
        results.success = false;
      }

      return results;
    } catch (error) {
      this.handleError(error);
    }
  }

  async withCompensation(): Promise<void> {
    // No compensation needed - each subject creation is independent
  }
}
