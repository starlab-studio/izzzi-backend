import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateSubjectSummariesTable1736019600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "subject_summaries",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "subject_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "summary",
            type: "text",
            isNullable: false,
          },
          {
            name: "full_summary",
            type: "text",
            isNullable: true,
          },
          {
            name: "sentiment_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: "period_days",
            type: "integer",
            default: 30,
            isNullable: false,
          },
          {
            name: "feedback_count_at_generation",
            type: "integer",
            isNullable: false,
          },
          {
            name: "generated_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
            isNullable: false,
          },
        ],
        uniques: [
          {
            name: "UQ_subject_summaries_subject_period",
            columnNames: ["subject_id", "period_days"],
          },
        ],
      }),
      true
    );

    // Add foreign key to subjects table
    await queryRunner.createForeignKey(
      "subject_summaries",
      new TableForeignKey({
        columnNames: ["subject_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "subjects",
        onDelete: "CASCADE",
        name: "FK_subject_summaries_subject_id",
      })
    );

    // Add foreign key to organizations table
    await queryRunner.createForeignKey(
      "subject_summaries",
      new TableForeignKey({
        columnNames: ["organization_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "organizations",
        onDelete: "CASCADE",
        name: "FK_subject_summaries_organization_id",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      "subject_summaries",
      "FK_subject_summaries_organization_id"
    );
    await queryRunner.dropForeignKey(
      "subject_summaries",
      "FK_subject_summaries_subject_id"
    );
    await queryRunner.dropTable("subject_summaries");
  }
}
