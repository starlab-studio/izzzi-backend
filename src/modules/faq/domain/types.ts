export interface IFaqTab {
  readonly id?: number;
  labelTab: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFaqCategory {
  readonly id?: number;
  labelCategory: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  faqTabId: number;
}

export interface IFaqItem {
  readonly id?: number;
  question: string;
  answerParagraph: string;
  answerList: string | null;
  views: number;
  isFeatured: boolean;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  faqCategoryId: number;
}

export interface IFaqCategoryWithItems extends IFaqCategory {
  items: IFaqItem[];
}
