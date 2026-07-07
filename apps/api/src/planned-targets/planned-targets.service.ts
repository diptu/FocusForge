import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SkillsService } from "../skills/skills.service";
import { validatePlannedTargetInput, computeAdherencePercent } from "../domain/planned-target.rules";
import { weekStartMonday, addDaysUTC } from "../domain/date-utils";
import { SetPlannedTargetDto } from "./dto/set-planned-target.dto";

@Injectable()
export class PlannedTargetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  // FF-16: set (upsert) a weekly target per skill.
  async setTarget(dto: SetPlannedTargetDto) {
    const validated = validatePlannedTargetInput({
      targetMinutes: dto.targetMinutes,
      weekStartDate: new Date(dto.weekStartDate),
    });
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }

    return this.prisma.plannedTarget.upsert({
      where: {
        skillId_weekStartDate: {
          skillId: dto.skillId,
          weekStartDate: validated.value.weekStartDate,
        },
      },
      update: { targetMinutes: validated.value.targetMinutes },
      create: {
        skillId: dto.skillId,
        weekStartDate: validated.value.weekStartDate,
        targetMinutes: validated.value.targetMinutes,
      },
    });
  }

  // FF-17: adherence % per skill for one week (defaults to current week).
  async adherenceForWeek(weekStartDateInput?: string) {
    const weekStart = weekStartMonday(weekStartDateInput ? new Date(weekStartDateInput) : new Date());
    const weekEnd = addDaysUTC(weekStart, 6);

    const [targets, actualBySkill, skills] = await Promise.all([
      this.prisma.plannedTarget.findMany({ where: { weekStartDate: weekStart } }),
      this.actualMinutesBySkill(weekStart, weekEnd),
      this.skills.findAllWithSubSkills(),
    ]);

    const targetBySkillId = new Map(targets.map((t) => [t.skillId, t.targetMinutes]));

    return {
      weekStartDate: isoDate(weekStart),
      skills: skills.map((skill) => {
        const targetMinutes = targetBySkillId.get(skill.id) ?? null;
        const actualMinutes = actualBySkill.get(skill.id) ?? 0;
        return {
          skillId: skill.id,
          slug: skill.slug,
          name: skill.name,
          targetMinutes,
          actualMinutes,
          adherencePercent: targetMinutes != null ? computeAdherencePercent(actualMinutes, targetMinutes) : null,
        };
      }),
    };
  }

  // FF-18: adherence trend across the last N completed weeks (North Star metric input).
  async adherenceTrend(weeksCount: number) {
    const currentWeekStart = weekStartMonday(new Date());
    const weekStarts = Array.from({ length: weeksCount }, (_, i) =>
      addDaysUTC(currentWeekStart, -7 * (weeksCount - 1 - i)),
    );

    const perWeek = await Promise.all(weekStarts.map((ws) => this.adherenceForWeek(isoDate(ws))));

    const skills = await this.skills.findAllWithSubSkills();
    return {
      skills: skills.map((skill) => ({
        skillId: skill.id,
        slug: skill.slug,
        name: skill.name,
        points: perWeek.map((week) => {
          const entry = week.skills.find((s) => s.skillId === skill.id)!;
          return {
            weekStartDate: week.weekStartDate,
            targetMinutes: entry.targetMinutes,
            actualMinutes: entry.actualMinutes,
            adherencePercent: entry.adherencePercent,
          };
        }),
      })),
    };
  }

  /** One join+aggregate query per skill via relation filter — not a per-row loop. */
  private async actualMinutesBySkill(from: Date, to: Date): Promise<Map<number, number>> {
    const skills = await this.skills.findAllWithSubSkills();
    const sums = await Promise.all(
      skills.map((skill) =>
        this.prisma.studySession.aggregate({
          where: { occurredAt: { gte: from, lte: to }, subSkill: { skillId: skill.id } },
          _sum: { durationMinutes: true },
        }),
      ),
    );
    return new Map(skills.map((skill, i) => [skill.id, sums[i]._sum.durationMinutes ?? 0]));
  }
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
