import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}
