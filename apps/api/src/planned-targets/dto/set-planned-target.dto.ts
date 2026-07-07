import { IsInt, IsISO8601, IsPositive } from "class-validator";

export class SetPlannedTargetDto {
  @IsInt()
  @IsPositive()
  skillId!: number;

  /** Any date within the target week — normalized to that week's Monday. */
  @IsISO8601()
  weekStartDate!: string;

  @IsInt()
  @IsPositive()
  targetMinutes!: number;
}
