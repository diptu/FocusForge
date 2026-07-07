import { IsIn, IsOptional } from "class-validator";

export class TimePerSkillQueryDto {
  @IsOptional()
  @IsIn(["week", "month"])
  range?: "week" | "month" = "week";
}
