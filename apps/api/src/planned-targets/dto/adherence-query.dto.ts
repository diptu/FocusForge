import { IsISO8601, IsInt, IsOptional, IsPositive, Max } from "class-validator";
import { Type } from "class-transformer";

export class AdherenceQueryDto {
  /** Any date within the week to compute adherence for; defaults to the current week. */
  @IsOptional()
  @IsISO8601()
  weekStartDate?: string;
}

export class AdherenceTrendQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(52)
  weeks?: number = 6;
}
