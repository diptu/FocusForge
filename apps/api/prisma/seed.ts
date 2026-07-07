import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Starting taxonomy — this is seed data, not a schema decision, so it's
 * meant to be edited freely to match dip's actual curriculum. Slugs must
 * stay in sync with the domain color tokens in
 * apps/web/src/styles/tokens.css (bg-domain-<slug>).
 */
const taxonomy = [
  {
    slug: "quant",
    name: "Quant",
    subSkills: [
      "Arithmetic",
      "Algebra",
      "Geometry",
      "Number Properties",
      "Word Problems",
      "Data Sufficiency",
    ],
  },
  {
    slug: "ielts",
    name: "IELTS",
    subSkills: [
      "Listening",
      "Reading",
      "Writing Task 1",
      "Writing Task 2",
      "Speaking",
      "Vocabulary",
    ],
  },
  {
    slug: "js",
    name: "JS",
    subSkills: [
      "Fundamentals",
      "Async & Promises",
      "DOM & Browser APIs",
      "TypeScript",
      "Frameworks",
      "Algorithms & Data Structures",
    ],
  },
  {
    slug: "stats",
    name: "Stats",
    subSkills: [
      "Descriptive Statistics",
      "Probability",
      "Distributions",
      "Hypothesis Testing",
      "Regression",
      "Bayesian Methods",
    ],
  },
  {
    slug: "dl",
    name: "Deep Learning",
    subSkills: [
      "Neural Net Fundamentals",
      "CNNs",
      "RNNs & Sequence Models",
      "Transformers",
      "Optimization",
      "Training & Fine-tuning Practice",
    ],
  },
] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  for (const domain of taxonomy) {
    const skill = await prisma.skill.upsert({
      where: { slug: domain.slug },
      update: { name: domain.name },
      create: { slug: domain.slug, name: domain.name },
    });

    for (const subSkillName of domain.subSkills) {
      const subSkillSlug = slugify(subSkillName);
      await prisma.subSkill.upsert({
        where: { skillId_slug: { skillId: skill.id, slug: subSkillSlug } },
        update: { name: subSkillName },
        create: { skillId: skill.id, slug: subSkillSlug, name: subSkillName },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
