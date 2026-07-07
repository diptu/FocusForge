import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { PlannedTargetsService } from "./planned-targets.service";
import { SetPlannedTargetDto } from "./dto/set-planned-target.dto";
import { AdherenceQueryDto, AdherenceTrendQueryDto } from "./dto/adherence-query.dto";

@Controller("planned-targets")
export class PlannedTargetsController {
  constructor(private readonly plannedTargets: PlannedTargetsService) {}

  @Post()
  setTarget(@Body() dto: SetPlannedTargetDto) {
    return this.plannedTargets.setTarget(dto);
  }

  @Get("adherence")
  adherence(@Query() query: AdherenceQueryDto) {
    return this.plannedTargets.adherenceForWeek(query.weekStartDate);
  }

  @Get("adherence-trend")
  adherenceTrend(@Query() query: AdherenceTrendQueryDto) {
    return this.plannedTargets.adherenceTrend(query.weeks ?? 6);
  }
}
