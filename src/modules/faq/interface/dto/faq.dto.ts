import { ApiProperty } from "@nestjs/swagger";

export class FaqTabResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  labelTab: string;

  @ApiProperty()
  orderIndex: number;
}

export class FaqCategoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  labelCategory: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  faqCategoryId: number;
}

export class FaqItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answerParagraph: string;

  @ApiProperty()
  answerList: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  faqCategoryId: number;
}

export class FaqCategoryWithItemsDto extends FaqCategoryResponseDto {
  @ApiProperty({ type: [FaqItemResponseDto] })
  items: FaqItemResponseDto[];
}

export class FaqFullResponseDto extends FaqTabResponseDto {
  @ApiProperty({ type: [FaqCategoryResponseDto] })
  categories: (FaqCategoryResponseDto & { items: FaqItemResponseDto[] })[];
}
