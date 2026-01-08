import { IFaqCategory } from "../types";

export class FaqCategoryEntity {
  private props: IFaqCategory;

  private constructor(props: IFaqCategory) {
    this.props = props;
  }

  public static create(
    data: Pick<
      IFaqCategory,
      "labelCategory" | "orderIndex" | "isActive" | "faqTabId"
    >,
  ): FaqCategoryEntity {
    const now = new Date();
    return new FaqCategoryEntity({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: IFaqCategory): FaqCategoryEntity {
    return new FaqCategoryEntity(data);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get labelCategory(): string {
    return this.props.labelCategory;
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

  get faqTabId(): number {
    return this.props.faqTabId;
  }

  toPersistence(): IFaqCategory {
    return { ...this.props };
  }
}
