import { buildContactFlowDisplay } from "@/lib/admin/contactFlow";
import { prisma } from "@/lib/prisma";

export interface AdminDashboardSnapshot {
  totals: {
    contacts: number;
    questionnairesCompleted: number;
    contactsWithInviteToken: number;
    speakers: number;
    speakersActive: number;
    clientMatches: number;
    activeMatchSteps: number;
  };
  statusCounts: {
    sinIngresar: number;
    enProceso: number;
    completoSinCita: number;
    agendado: number;
  };
  recentContacts: Array<{
    id: number;
    fullName: string;
    email: string;
    company: string;
    completedAt: Date | null;
    answersCount: number;
    originChannelLabel: string;
    statusLabel: string;
    statusBadgeClass: string;
  }>;
}

function parseAnswersCount(matchAnswers: unknown): number {
  if (!Array.isArray(matchAnswers)) return 0;
  return matchAnswers.filter(Boolean).length;
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const [
    contacts,
    questionnairesCompleted,
    contactsWithInviteToken,
    speakers,
    speakersActive,
    clientMatches,
    activeMatchSteps,
    sinIngresar,
    enProceso,
    completoSinCita,
    agendado,
    recentRaw,
  ] = await prisma.$transaction([
    prisma.contact.count(),
    prisma.contact.count({ where: { form_completed_at: { not: null } } }),
    prisma.contact.count({ where: { token: { not: null } } }),
    prisma.speaker.count(),
    prisma.speaker.count({ where: { active: true } }),
    prisma.clientMatch.count(),
    prisma.matchStep.count({ where: { active: true } }),
    // statusCounts
    prisma.contact.count({ where: { form_started_at: null } }),
    prisma.contact.count({ where: { form_started_at: { not: null }, form_completed_at: null } }),
    prisma.contact.count({ where: { form_completed_at: { not: null }, calendly_booked_at: null } }),
    prisma.contact.count({ where: { calendly_booked_at: { not: null } } }),
    prisma.contact.findMany({
      take: 6,
      orderBy: [{ id: "desc" }],
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
    totals: {
      contacts,
      questionnairesCompleted,
      contactsWithInviteToken,
      speakers,
      speakersActive,
      clientMatches,
      activeMatchSteps,
    },
    statusCounts: {
      sinIngresar,
      enProceso,
      completoSinCita,
      agendado,
    },
    recentContacts: recentRaw.map((c) => {
      const answersCount = parseAnswersCount(c.match_answers);
      const flow = buildContactFlowDisplay({
        token: c.token,
        origen: c.origen,
        form_started_at: c.form_started_at,
        form_completed_at: c.form_completed_at,
        calendly_booked_at: c.calendly_booked_at,
      });
      return {
        id: c.id,
        fullName: `${c.nombre} ${c.apellido}`.trim(),
        email: c.email,
        company: c.empresa,
        completedAt: c.form_completed_at,
        answersCount,
        originChannelLabel: flow.originChannelLabel,
        statusLabel: flow.statusLabel,
        statusBadgeClass: flow.statusBadgeClass,
      };
    }),
  };
}
