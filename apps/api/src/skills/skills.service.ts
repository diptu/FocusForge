import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { validateNewSkillName, validateNewSubSkillName } from "../domain/skill.rules";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { CreateSubSkillDto } from "./dto/create-sub-skill.dto";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllWithSubSkills() {
    return this.prisma.skill.findMany({
      orderBy: { id: "asc" },
      include: { subSkills: { orderBy: { id: "asc" } } },
    });
  }

  // User-created custom category — relaxes the "seeded only" note in
  // aggregates.md on purpose. No bespoke domain color; see skill.rules.ts.
  async create(dto: CreateSkillDto) {
    const validated = validateNewSkillName(dto.name);
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }

    try {
      return await this.prisma.skill.create({
        data: { name: validated.value.name, slug: validated.value.slug },
        include: { subSkills: true },
      });
    } catch (error) {
      throw this.mapWriteError(error, "SKILL_NAME_TAKEN", "A category with a similar name already exists");
    }
  }

  async createSubSkill(skillId: number, dto: CreateSubSkillDto) {
    const validated = validateNewSubSkillName(dto.name);
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }

    try {
      return await this.prisma.subSkill.create({
        data: { skillId, name: validated.value.name, slug: validated.value.slug },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new NotFoundException({
          code: "SKILL_NOT_FOUND",
          message: "skillId does not reference an existing category",
        });
      }
      throw this.mapWriteError(
        error,
        "SUBSKILL_NAME_TAKEN",
        "A sub-skill with a similar name already exists for this category",
      );
    }
  }

  // Deletion isn't part of the seeded-reference-data design (aggregates.md),
  // but custom categories (this session's own feature) need an undo path.
  // Never destroys logged history: blocked if any StudySession exists under
  // this skill's sub-skills, regardless of whether the skill is seeded or
  // custom. Otherwise cascades PlannedTargets + SubSkills + the Skill row —
  // none of that is real logged work, just plans and taxonomy.
  async remove(id: number) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new NotFoundException(`Skill ${id} not found`);
    }

    const sessionCount = await this.prisma.studySession.count({
      where: { subSkill: { skillId: id } },
    });
    if (sessionCount > 0) {
      throw new ConflictException({
        code: "SKILL_HAS_SESSIONS",
        message: `Cannot delete "${skill.name}" — ${sessionCount} session${sessionCount === 1 ? "" : "s"} logged under it.`,
      });
    }

    await this.prisma.$transaction([
      this.prisma.plannedTarget.deleteMany({ where: { skillId: id } }),
      this.prisma.subSkill.deleteMany({ where: { skillId: id } }),
      this.prisma.skill.delete({ where: { id } }),
    ]);
  }

  private mapWriteError(error: unknown, conflictCode: string, conflictMessage: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new ConflictException({ code: conflictCode, message: conflictMessage });
    }
    return error as Error;
  }
}
