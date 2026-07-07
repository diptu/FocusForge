import { Module } from "@nestjs/common";
import { AnthropicPlanGeneratorService } from "./anthropic-plan-generator.service";

@Module({
  providers: [AnthropicPlanGeneratorService],
  exports: [AnthropicPlanGeneratorService],
})
export class LlmModule {}
