import { PrismaClient, Difficulty } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: 'pro' },
    update: {},
    create: { code: 'pro', name: 'Pro', priceCents: 1999, currency: 'USD', limits: { interviewsPerMonth: 30, codingRuns: 500 }, features: ['AI interviews', 'coding engine', 'avatar sessions', 'advanced reports'] },
  });

  for (const name of ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Adobe', 'Uber']) {
    await prisma.companyDataset.upsert({
      where: { name },
      update: {},
      create: {
        name,
        patterns: { rounds: ['recruiter', 'technical', 'behavioral'], signals: ['problem solving', 'communication', 'role fit'] },
        roles: { softwareEngineer: ['DSA', 'system design', 'projects'], productManager: ['strategy', 'execution', 'analytics'] },
        faqs: [{ question: `Tell me about a project relevant to ${name}.`, difficulty: Difficulty.MEDIUM }],
      },
    });
  }

  await prisma.codingQuestion.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: Difficulty.EASY,
      tags: ['array', 'hash-map'],
      description: 'Return indices of two numbers such that they add up to target.',
      examples: [{ input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] }],
      testCases: { create: [{ input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], hidden: false }] },
    },
  });
  console.log({ seeded: true, plan: plan.code });
}
main().finally(() => prisma.$disconnect());
