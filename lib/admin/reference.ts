import { prisma } from "@/lib/prisma";

export interface AdminMatchStepRow {
  id: number;
  orden: number;
  question: string;
  columns: number;
  options: { id: number; label: string; orden: number }[];
}

export interface AdminSpeakerRow {
  id: number;
  nombre: string;
  especialidad: string;
  bio_short: string | null;
  active: boolean;
}

export async function getAdminMatchStepsForReference(): Promise<AdminMatchStepRow[]> {
  const steps = await prisma.matchStep.findMany({
    where: { active: true },
    orderBy: { orden: "asc" },
    include: {
      options: {
        where: { active: true },
        orderBy: { orden: "asc" },
        select: { id: true, label: true, orden: true },
      },
    },
  });

  return steps.map((s) => ({
    id: s.id,
    orden: s.orden,
    question: s.question,
    columns: s.columns,
    options: s.options,
  }));
}
export async function getAdminSpeakersForReference(): Promise<AdminSpeakerRow[]> {
  return prisma.speaker.findMany({
    orderBy: [{ active: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      especialidad: true,
      bio_short: true,
      active: true,
    },
  });
}

