import { Module } from "@nestjs/common";
import { PlannedTargetsController } from "./planned-targets.controller";
import { PlannedTargetsService } from "./planned-targets.service";
import { SkillsModule } from "../skills/skills.module";

@Module({
  imports: [SkillsModule],
  controllers: [PlannedTargetsController],
  providers: [PlannedTargetsService],
  exports: [PlannedTargetsService],
})
export class PlannedTargetsModule {}
