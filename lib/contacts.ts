import { prisma } from "./prisma";

export interface ContactData {
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
}

export async function findContactByToken(token: string): Promise<ContactData | null> {
  const contact = await prisma.contact.findUnique({
    where: { token },
    select: { nombre: true, apellido: true, empresa: true, email: true },
  });
  return contact ?? null;
}

export type EventType = "form_started" | "form_completed";

export interface UpsertContactEventPayload {
  type: EventType;
  token?: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  empresa?: string;
  fecha_evento?: string;
  match_answers?: string[];
}

export async function upsertContactEvent(payload: UpsertContactEventPayload): Promise<void> {
  const { type, token, email, nombre, apellido, empresa, fecha_evento, match_answers } = payload;

  const now = new Date();

  if (type === "form_started") {
    if (token) {
      // Contacto por invitación — actualizar por token
      await prisma.contact.updateMany({
        where: { token },
        data: {
          form_started_at: now,
          ...(nombre ? { nombre } : {}),
          ...(apellido ? { apellido } : {}),
          ...(empresa ? { empresa } : {}),
          ...(fecha_evento ? { fecha_evento } : {}),
        },
      });
    } else if (email) {
      // Contacto orgánico — buscar por email o crear
      const existing = await prisma.contact.findFirst({ where: { email } });
      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            form_started_at: now,
            ...(nombre ? { nombre } : {}),
            ...(apellido ? { apellido } : {}),
            ...(empresa ? { empresa } : {}),
            ...(fecha_evento ? { fecha_evento } : {}),
          },
        });
      } else {
        await prisma.contact.create({
          data: {
            nombre: nombre ?? "",
            apellido: apellido ?? "",
            empresa: empresa ?? "",
            email,
            origen: "organico",
            form_started_at: now,
            ...(fecha_evento ? { fecha_evento } : {}),
          },
        });
      }
    }
    return;
  }

  if (type === "form_completed") {
    const data = {
      form_completed_at: now,
      ...(match_answers ? { match_answers } : {}),
    };

    if (token) {
      await prisma.contact.updateMany({
        where: { token },
        data,
      });
    } else if (email) {
      await prisma.contact.updateMany({
        where: { email },
        data,
      });
    }
  }
}
