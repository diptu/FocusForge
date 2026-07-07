-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "currentScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "selectedPlanOptionId" INTEGER,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalPlanOption" (
    "id" SERIAL NOT NULL,
    "goalId" INTEGER NOT NULL,
    "weeklyHours" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "tentativeScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalPlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Goal_selectedPlanOptionId_key" ON "Goal"("selectedPlanOptionId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_selectedPlanOptionId_fkey" FOREIGN KEY ("selectedPlanOptionId") REFERENCES "GoalPlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPlanOption" ADD CONSTRAINT "GoalPlanOption_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
