import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { StudySessionsService } from "./study-sessions.service";
import { CreateStudySessionDto } from "./dto/create-study-session.dto";
import { UpdateStudySessionDto } from "./dto/update-study-session.dto";
import { FindStudySessionsQueryDto } from "./dto/find-study-sessions-query.dto";

@Controller("study-sessions")
export class StudySessionsController {
  constructor(private readonly studySessions: StudySessionsService) {}

  @Post()
  create(@Body() dto: CreateStudySessionDto) {
    return this.studySessions.create(dto);
  }

  @Get()
  findAll(@Query() query: FindStudySessionsQueryDto) {
    return this.studySessions.findAll(query);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStudySessionDto) {
    return this.studySessions.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.studySessions.remove(id);
  }
}
