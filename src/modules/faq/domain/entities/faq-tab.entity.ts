import { IFaqTab } from "../types";

export class FaqTabEntity {
  private props: IFaqTab;

  private constructor(props: IFaqTab) {
    this.props = props;
  }

  public static create(
    data: Pick<IFaqTab, "labelTab" | "orderIndex" | "isActive">,
  ): FaqTabEntity {
    const now = new Date();
    return new FaqTabEntity({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: IFaqTab): FaqTabEntity {
    return new FaqTabEntity(data);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get labelTab(): string {
    return this.props.labelTab;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPersistence(): IFaqTab {
    return { ...this.props };
  }
}
