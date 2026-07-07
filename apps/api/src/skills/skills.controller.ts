import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { SkillsService } from "./skills.service";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { CreateSubSkillDto } from "./dto/create-sub-skill.dto";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  findAll() {
    return this.skills.findAllWithSubSkills();
  }

  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @Post(":skillId/sub-skills")
  createSubSkill(@Param("skillId", ParseIntPipe) skillId: number, @Body() dto: CreateSubSkillDto) {
    return this.skills.createSubSkill(skillId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.skills.remove(id);
  }
}
