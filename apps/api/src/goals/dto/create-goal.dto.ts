import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

class GoalScoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  score!: string;
}

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsInt()
  @Min(1)
  @Max(52)
  durationWeeks!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalScoreDto)
  currentScores?: GoalScoreDto[];
}
