import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { GoalsService } from "./goals.service";
import { CreateGoalDto } from "./dto/create-goal.dto";

@Controller("goals")
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Post()
  create(@Body() dto: CreateGoalDto) {
    return this.goals.create(dto);
  }

  @Get()
  findAll() {
    return this.goals.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.goals.findOne(id);
  }

  @Post(":id/generate-plans")
  generatePlans(@Param("id", ParseIntPipe) id: number) {
    return this.goals.generatePlans(id);
  }

  @Post(":id/plan-options/:optionId/select")
  selectPlanOption(
    @Param("id", ParseIntPipe) id: number,
    @Param("optionId", ParseIntPipe) optionId: number,
  ) {
    return this.goals.selectPlanOption(id, optionId);
  }
}
