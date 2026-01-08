import {
  MigrationInterface,
  QueryRunner,
  TableUnique,
  TableColumn,
} from "typeorm";

export class AddFormTypeToSubjectSummaries1766027436199
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "subject_summaries",
      new TableColumn({
        name: "form_type",
        type: "varchar",
        length: "50",
        isNullable: false,
        default: "'during_course'",
      }),
    );

    await queryRunner.dropUniqueConstraint(
      "subject_summaries",
      "UQ_subject_summaries_subject_period",
    );

    await queryRunner.createUniqueConstraint(
      "subject_summaries",
      new TableUnique({
        name: "UQ_subject_summaries_subject_period_form_type",
        columnNames: ["subject_id", "period_days", "form_type"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint(
      "subject_summaries",
      "UQ_subject_summaries_subject_period_form_type",
    );

    await queryRunner.createUniqueConstraint(
      "subject_summaries",
      new TableUnique({
        name: "UQ_subject_summaries_subject_period",
        columnNames: ["subject_id", "period_days"],
      }),
    );

    await queryRunner.dropColumn("subject_summaries", "form_type");
  }
}
