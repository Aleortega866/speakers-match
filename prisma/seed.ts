import { PrismaClient } from "@prisma/client";
import { matchSteps } from "../lib/formData";

const prisma = new PrismaClient();

async function main() {
  // Idempotente: borra y recrea para poder correr seed múltiples veces
  await prisma.matchStepOption.deleteMany({});
  await prisma.matchStep.deleteMany({});

  for (const [i, step] of matchSteps.entries()) {
    const created = await prisma.matchStep.create({
      data: {
        orden: i + 1,
        question: step.question,
        columns: step.columns ?? 1,
        active: true,
      },
    });
    for (const [j, label] of step.options.entries()) {
      await prisma.matchStepOption.create({
        data: { stepId: created.id, label, orden: j + 1, active: true },
      });
    }
  }

  console.log(`Seed completado: ${matchSteps.length} pasos cargados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
