import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SkillsService } from "../skills/skills.service";
import { weekStartMonday, monthStartUTC, monthEndUTC, addDaysUTC } from "../domain/date-utils";

interface SkillTotals {
  skillId: number;
  slug: string;
  name: string;
  totalMinutes: number;
  subSkills: { subSkillId: number; slug: string; name: string; totalMinutes: number }[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  // FF-12/FF-13: time-per-skill (and per sub-skill) for a rolling week or month.
  //
  // The range is the whole current week/month (Monday..Sunday, 1st..last),
  // NOT clamped to "now": clamping to `now` created a real bug where a
  // session dated "today" from the user's perspective — allowed by
  // study-session.rules.ts's 1-day timezone tolerance — could be "tomorrow"
  // by the server's UTC clock and silently fall outside the range. Days
  // later in the week with no sessions yet just contribute 0; that's
  // correct, not a bug.
  async timePerSkill(range: "week" | "month") {
    const now = new Date();
    const from = range === "week" ? weekStartMonday(now) : monthStartUTC(now);
    const to = range === "week" ? addDaysUTC(from, 6) : monthEndUTC(now);

    const totals = await this.sumMinutesBySubSkill(from, to);
    return {
      range: { kind: range, from: isoDate(from), to: isoDate(to) },
      skills: await this.assembleSkillTotals(totals),
    };
  }

  // FF-14: this week vs last week, per skill.
  async weekOverWeek() {
    const now = new Date();
    const thisWeekStart = weekStartMonday(now);
    const thisWeekEnd = addDaysUTC(thisWeekStart, 6);
    const lastWeekStart = addDaysUTC(thisWeekStart, -7);
    const lastWeekEnd = addDaysUTC(thisWeekStart, -1);

    const [thisWeekTotals, lastWeekTotals] = await Promise.all([
      this.sumMinutesBySubSkill(thisWeekStart, thisWeekEnd),
      this.sumMinutesBySubSkill(lastWeekStart, lastWeekEnd),
    ]);

    const skills = await this.skills.findAllWithSubSkills();
    return {
      thisWeek: { from: isoDate(thisWeekStart), to: isoDate(thisWeekEnd) },
      lastWeek: { from: isoDate(lastWeekStart), to: isoDate(lastWeekEnd) },
      skills: skills.map((skill) => {
        const subSkillIds = skill.subSkills.map((s) => s.id);
        const thisWeekMinutes = sumFor(subSkillIds, thisWeekTotals);
        const lastWeekMinutes = sumFor(subSkillIds, lastWeekTotals);
        return {
          skillId: skill.id,
          slug: skill.slug,
          name: skill.name,
          thisWeekMinutes,
          lastWeekMinutes,
          deltaMinutes: thisWeekMinutes - lastWeekMinutes,
        };
      }),
    };
  }

  /** One grouped query per range — never per-row (persistence_patterns.md). */
  private async sumMinutesBySubSkill(from: Date, to: Date): Promise<Map<number, number>> {
    const grouped = await this.prisma.studySession.groupBy({
      by: ["subSkillId"],
      where: { occurredAt: { gte: from, lte: to } },
      _sum: { durationMinutes: true },
    });
    return new Map(grouped.map((g) => [g.subSkillId, g._sum.durationMinutes ?? 0]));
  }

  private async assembleSkillTotals(totals: Map<number, number>): Promise<SkillTotals[]> {
    const skills = await this.skills.findAllWithSubSkills();
    return skills.map((skill) => {
      const subSkills = skill.subSkills.map((sub) => ({
        subSkillId: sub.id,
        slug: sub.slug,
        name: sub.name,
        totalMinutes: totals.get(sub.id) ?? 0,
      }));
      return {
        skillId: skill.id,
        slug: skill.slug,
        name: skill.name,
        totalMinutes: subSkills.reduce((acc, s) => acc + s.totalMinutes, 0),
        subSkills,
      };
    });
  }
}

function sumFor(subSkillIds: number[], totals: Map<number, number>): number {
  return subSkillIds.reduce((acc, id) => acc + (totals.get(id) ?? 0), 0);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
