import { ISubject, ISubjectCreate } from "../types";
import { ErrorCode } from "src/core";
import { randomUUID } from "crypto";
import { Color } from "../value-objects/color.vo";
import { BaseEntity } from "src/core/domain/entities/base.entity";

export class SubjectEntity extends BaseEntity {
  private props: ISubject;

  private constructor(props: ISubject) {
    super();
    this.props = props;
  }

  static create(data: ISubjectCreate): SubjectEntity {
    const name = (data.name ?? "").trim();
    this.validateRequiredString(
      name,
      "Subject name",
      ErrorCode.INVALID_SUBJECT_NAME,
    );

    const colorVO = Color.create(data.color ?? "");
    const color = colorVO.value;

    const organizationId = (data.organizationId ?? "").trim();

    const createdBy = (data.createdBy ?? "").trim();

    return new SubjectEntity({
      id: randomUUID(),
      name,
      description: data.description,
      color,
      isActive: true,
      organizationId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get color(): string {
    return this.props.color;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date | null {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }
  toPersistence(): ISubject {
    return { ...this.props };
  }

  static reconstitute(data: ISubject): SubjectEntity {
    return new SubjectEntity(data);
  }
}
