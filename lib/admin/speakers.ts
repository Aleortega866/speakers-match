import { prisma } from "@/lib/prisma";
import type { AdminSpeakerListItem, AdminSpeakerListResult } from "@/lib/admin/types";

function normalizePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function normalizePageSize(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 20;
  return Math.min(Math.floor(parsed), 100);
}

export function buildAdminSpeakerListWhere(search?: string) {
  const s = search?.trim();
  if (!s) return undefined;
  return {
    OR: [
      { nombre: { contains: s, mode: "insensitive" as const } },
      { especialidad: { contains: s, mode: "insensitive" as const } },
      { bio_short: { contains: s, mode: "insensitive" as const } },
    ],
  };
}

export async function getAdminSpeakersKpis(search?: string): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const filter = buildAdminSpeakerListWhere(search);
  const [total, active, inactive] = await prisma.$transaction([
    prisma.speaker.count({ where: filter }),
    prisma.speaker.count({
      where: filter ? { AND: [filter, { active: true }] } : { active: true },
    }),
    prisma.speaker.count({
      where: filter ? { AND: [filter, { active: false }] } : { active: false },
    }),
  ]);
  return { total, active, inactive };
}

function toListItem(row: {
  id: number;
  nombre: string;
  especialidad: string;
  bio_short: string | null;
  active: boolean;
}): AdminSpeakerListItem {
  return {
    id: row.id,
    nombre: row.nombre,
    especialidad: row.especialidad,
    bio_short: row.bio_short,
    active: row.active,
  };
}

export async function listAdminSpeakers(input: {
  search?: string;
  page?: string;
  pageSize?: string;
}): Promise<AdminSpeakerListResult> {
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const where = buildAdminSpeakerListWhere(input.search);

  const [total, rows] = await Promise.all([
    prisma.speaker.count({ where }),
    prisma.speaker.findMany({
      where,
      orderBy: [{ active: "desc" }, { nombre: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        nombre: true,
        especialidad: true,
        bio_short: true,
        active: true,
      },
    }),
  ]);

  return {
    items: rows.map(toListItem),
    total,
    page,
    pageSize,
    hasNext: page * pageSize < total,
  };
}
