import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { ApiTokenGuard } from "./auth/api-token.guard";
import { SkillsModule } from "./skills/skills.module";
import { StudySessionsModule } from "./study-sessions/study-sessions.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { PlannedTargetsModule } from "./planned-targets/planned-targets.module";
import { GoalsModule } from "./goals/goals.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SkillsModule,
    StudySessionsModule,
    AnalyticsModule,
    PlannedTargetsModule,
    GoalsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ApiTokenGuard }],
})
export class AppModule {}
