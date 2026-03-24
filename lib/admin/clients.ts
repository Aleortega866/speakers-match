import { prisma } from "@/lib/prisma";
import { buildContactFlowDisplay, getContactStatus, statusToDisplay } from "@/lib/admin/contactFlow";
import type { ContactStatus } from "@/lib/admin/contactFlow";
import type {
  AdminClientDetail,
  AdminClientMatch,
  AdminClientListItem,
  AdminClientListResult,
} from "@/lib/admin/types";

const VALID_STATUSES = new Set<ContactStatus>([
  "sin_ingresar",
  "en_proceso",
  "completo_sin_cita",
  "agendado",
]);

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

function normalizeStatus(value: string | undefined): ContactStatus | undefined {
  if (!value) return undefined;
  return VALID_STATUSES.has(value as ContactStatus) ? (value as ContactStatus) : undefined;
}

/** Filtro de búsqueda por texto (nombre, apellido, email, empresa). */
export function buildAdminClientListWhere(search?: string) {
  const s = search?.trim();
  if (!s) return undefined;
  return {
    OR: [
      { nombre: { contains: s, mode: "insensitive" as const } },
      { apellido: { contains: s, mode: "insensitive" as const } },
      { email: { contains: s, mode: "insensitive" as const } },
      { empresa: { contains: s, mode: "insensitive" as const } },
    ],
  };
}

/** Filtro Prisma para un ContactStatus concreto. */
function buildStatusWhere(status: ContactStatus) {
  switch (status) {
    case "sin_ingresar":
      return { form_started_at: null };
    case "en_proceso":
      return { form_started_at: { not: null }, form_completed_at: null } as const;
    case "completo_sin_cita":
      return { form_completed_at: { not: null }, calendly_booked_at: null } as const;
    case "agendado":
      return { calendly_booked_at: { not: null } } as const;
  }
}

/** Combina filtros de búsqueda y estado. */
function buildCombinedWhere(search?: string, status?: ContactStatus) {
  const searchWhere = buildAdminClientListWhere(search);
  const statusWhere = status ? buildStatusWhere(status) : undefined;

  if (searchWhere && statusWhere) return { AND: [searchWhere, statusWhere] };
  return searchWhere ?? statusWhere;
}

/** Conteos por estado (siempre sin filtro de status, respeta búsqueda). */
export async function getAdminClientsKpis(search?: string): Promise<{
  sinIngresar: number;
  enProceso: number;
  completoSinCita: number;
  agendado: number;
}> {
  const base = buildAdminClientListWhere(search);

  function withBase(statusWhere: object) {
    if (base) return { AND: [base, statusWhere] };
    return statusWhere;
  }

  const [sinIngresar, enProceso, completoSinCita, agendado] = await prisma.$transaction([
    prisma.contact.count({ where: withBase(buildStatusWhere("sin_ingresar")) }),
    prisma.contact.count({ where: withBase(buildStatusWhere("en_proceso")) }),
    prisma.contact.count({ where: withBase(buildStatusWhere("completo_sin_cita")) }),
    prisma.contact.count({ where: withBase(buildStatusWhere("agendado")) }),
  ]);

  return { sinIngresar, enProceso, completoSinCita, agendado };
}

function parseAnswers(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => String(item)).filter(Boolean);
}

function parseSkillsBreakdown(input: unknown): AdminClientMatch["skills"] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];

  return Object.entries(input as Record<string, unknown>)
    .map(([label, value]) => ({ label, value: Number(value) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value >= 0)
    .sort((a, b) => b.value - a.value);
}

function toListItem(contact: {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  empresa: string;
  origen: string;
  token: string | null;
  form_started_at: Date | null;
  form_completed_at: Date | null;
  calendly_booked_at: Date | null;
  match_answers: unknown;
}): AdminClientListItem {
  const answersCount = parseAnswers(contact.match_answers).length;
  const flow = buildContactFlowDisplay({
    token: contact.token,
    origen: contact.origen,
    form_started_at: contact.form_started_at,
    form_completed_at: contact.form_completed_at,
    calendly_booked_at: contact.calendly_booked_at,
  });

  return {
    id: contact.id,
    fullName: `${contact.nombre} ${contact.apellido}`.trim(),
    email: contact.email,
    company: contact.empresa,
    completedAt: contact.form_completed_at,
    answersCount,
    originChannelLabel: flow.originChannelLabel,
    status: flow.status,
    statusLabel: flow.statusLabel,
    statusBadgeClass: flow.statusBadgeClass,
  };
}

export async function listAdminClients(input: {
  search?: string;
  page?: string;
  pageSize?: string;
  status?: string;
}): Promise<AdminClientListResult> {
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const status = normalizeStatus(input.status);
  const where = buildCombinedWhere(input.search, status);

  const [total, contacts] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: [{ form_completed_at: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        empresa: true,
        origen: true,
        token: true,
        form_started_at: true,
        form_completed_at: true,
        calendly_booked_at: true,
        match_answers: true,
      },
    }),
  ]);

  return {
    items: contacts.map(toListItem),
    total,
    page,
    pageSize,
    hasNext: page * pageSize < total,
  };
}

export async function getAdminClientDetail(id: number): Promise<AdminClientDetail | null> {
  const contact = await prisma.contact.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      empresa: true,
      form_completed_at: true,
      fecha_evento: true,
      origen: true,
      token: true,
      form_started_at: true,
      calendly_booked_at: true,
      match_answers: true,
      client_matches: {
        orderBy: [{ match_score: "desc" }, { id: "asc" }],
        take: 3,
        select: {
          id: true,
          match_score: true,
          top_skill: true,
          skills_breakdown: true,
          speaker: {
            select: {
              id: true,
              nombre: true,
              especialidad: true,
              bio_short: true,
            },
          },
        },
      },
    },
  });

  if (!contact) return null;

  return {
    id: contact.id,
    fullName: `${contact.nombre} ${contact.apellido}`.trim(),
    email: contact.email,
    company: contact.empresa,
    completedAt: contact.form_completed_at,
    eventDate: contact.fecha_evento,
    origin: contact.origen,
    token: contact.token,
    form_started_at: contact.form_started_at,
    calendly_booked_at: contact.calendly_booked_at,
    answers: parseAnswers(contact.match_answers),
    matches: contact.client_matches.map((match) => ({
      id: match.id,
      score: match.match_score,
      topSkill: match.top_skill,
      speaker: {
        id: match.speaker.id,
        name: match.speaker.nombre,
        specialty: match.speaker.especialidad,
        bio: match.speaker.bio_short,
      },
      skills: parseSkillsBreakdown(match.skills_breakdown),
    })),
  };
}
