import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { validateStudySessionInput } from "../domain/study-session.rules";
import { CreateStudySessionDto } from "./dto/create-study-session.dto";
import { UpdateStudySessionDto } from "./dto/update-study-session.dto";
import { FindStudySessionsQueryDto } from "./dto/find-study-sessions-query.dto";

@Injectable()
export class StudySessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudySessionDto) {
    const validated = validateStudySessionInput({
      durationMinutes: dto.durationMinutes,
      occurredAt: new Date(dto.occurredAt),
    });
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }

    try {
      return await this.prisma.studySession.create({
        data: {
          subSkillId: dto.subSkillId,
          durationMinutes: validated.value.durationMinutes,
          occurredAt: validated.value.occurredAt,
          notes: dto.notes,
        },
        include: { subSkill: { include: { skill: true } } },
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  // FF-8: history view, newest-first. Also the general-purpose range query
  // Epic 3/4 read from directly for aggregation (persistence_patterns.md).
  findAll(query: FindStudySessionsQueryDto) {
    const where: Prisma.StudySessionWhereInput = {};
    if (query.from || query.to) {
      where.occurredAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    return this.prisma.studySession.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      include: { subSkill: { include: { skill: true } } },
    });
  }

  async update(id: number, dto: UpdateStudySessionDto) {
    const existing = await this.prisma.studySession.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`StudySession ${id} not found`);
    }

    const validated = validateStudySessionInput({
      durationMinutes: dto.durationMinutes ?? existing.durationMinutes,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : existing.occurredAt,
    });
    if (!validated.ok) {
      throw new BadRequestException(validated.error);
    }

    try {
      return await this.prisma.studySession.update({
        where: { id },
        data: {
          subSkillId: dto.subSkillId ?? existing.subSkillId,
          durationMinutes: validated.value.durationMinutes,
          occurredAt: validated.value.occurredAt,
          notes: dto.notes ?? existing.notes,
        },
        include: { subSkill: { include: { skill: true } } },
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.studySession.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`StudySession ${id} not found`);
      }
      throw error;
    }
  }

  private mapWriteError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return new BadRequestException({ code: "SUBSKILL_NOT_FOUND", message: "subSkillId does not reference an existing sub-skill" });
    }
    return error as Error;
  }
}
