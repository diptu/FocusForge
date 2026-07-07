-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "targetSkillIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
