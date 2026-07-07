import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllWithSubSkills() {
    return this.prisma.skill.findMany({
      orderBy: { id: "asc" },
      include: { subSkills: { orderBy: { id: "asc" } } },
    });
  }
}
