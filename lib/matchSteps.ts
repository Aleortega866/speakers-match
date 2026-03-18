import { prisma } from "./prisma";
import { matchSteps as fallbackSteps } from "./formData";

export interface MatchStepWithOptions {
  id: number;
  question: string;
  columns: number;
  options: { id: number; label: string }[];
}

export async function getMatchSteps(): Promise<MatchStepWithOptions[]> {
  try {
    const steps = await prisma.matchStep.findMany({
      where: { active: true },
      orderBy: { orden: "asc" },
      include: {
        options: {
          where: { active: true },
          orderBy: { orden: "asc" },
          select: { id: true, label: true },
        },
      },
    });

    if (steps.length === 0) return getFallbackSteps();

    return steps.map((s) => ({
      id: s.id,
      question: s.question,
      columns: s.columns,
      options: s.options,
    }));
  } catch {
    return getFallbackSteps();
  }
}

function getFallbackSteps(): MatchStepWithOptions[] {
  return fallbackSteps.map((s) => ({
    id: s.id,
    question: s.question,
    columns: s.columns ?? 1,
    options: s.options.map((label, i) => ({ id: i + 1, label })),
  }));
}
