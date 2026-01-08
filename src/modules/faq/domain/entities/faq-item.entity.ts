import { IFaqItem } from "../types";

export class FaqItemEntity {
  private props: IFaqItem;

  private constructor(props: IFaqItem) {
    this.props = props;
  }

  public static create(
    data: Pick<
      IFaqItem,
      | "question"
      | "answerParagraph"
      | "answerList"
      | "isFeatured"
      | "orderIndex"
      | "isActive"
      | "faqCategoryId"
    >,
  ): FaqItemEntity {
    const now = new Date();
    return new FaqItemEntity({
      ...data,
      views: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(data: IFaqItem): FaqItemEntity {
    return new FaqItemEntity(data);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get question(): string {
    return this.props.question;
  }

  get answerParagraph(): string {
    return this.props.answerParagraph;
  }

  get answerList(): string | null {
    return this.props.answerList;
  }

  get views(): number {
    return this.props.views;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
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

  get faqCategoryId(): number {
    return this.props.faqCategoryId;
  }

  toPersistence(): IFaqItem {
    return { ...this.props };
  }
}
