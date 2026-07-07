import { IsInt, IsISO8601, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateStudySessionDto {
  @IsInt()
  @IsPositive()
  subSkillId!: number;

  @IsInt()
  @IsPositive()
  durationMinutes!: number;

  /** ISO date (yyyy-mm-dd) or datetime — only the calendar day is kept. */
  @IsISO8601()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
