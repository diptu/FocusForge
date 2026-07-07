import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
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

  /** Existing Skill ids the learner explicitly wants this plan to target. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  targetSkillIds?: number[];
}
