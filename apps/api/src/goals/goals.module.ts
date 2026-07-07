import { Module } from "@nestjs/common";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";
import { SkillsModule } from "../skills/skills.module";
import { PlannedTargetsModule } from "../planned-targets/planned-targets.module";
import { LlmModule } from "../llm/llm.module";

@Module({
  imports: [SkillsModule, PlannedTargetsModule, LlmModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
