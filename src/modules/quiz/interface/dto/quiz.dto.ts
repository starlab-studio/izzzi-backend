import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsNotEmpty } from "class-validator";

export class AssignQuizPairDto {
  @ApiProperty({
    description: "ID de la paire de templates de questionnaires",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  templatePairId: string;
}

