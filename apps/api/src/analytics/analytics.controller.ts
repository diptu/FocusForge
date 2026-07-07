import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { TimePerSkillQueryDto } from "./dto/time-per-skill-query.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("time-per-skill")
  timePerSkill(@Query() query: TimePerSkillQueryDto) {
    return this.analytics.timePerSkill(query.range ?? "week");
  }

  @Get("week-over-week")
  weekOverWeek() {
    return this.analytics.weekOverWeek();
  }
}
