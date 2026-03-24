/**
 * Estado unificado del embudo de contacto.
 * Aplica igual para contactos invitados (con token) y orgánicos (sin token).
 */

export type ContactStatus =
  | "sin_ingresar"
  | "en_proceso"
  | "completo_sin_cita"
  | "agendado";

export type OriginChannel = "invitacion" | "organico";

export interface ContactFlowFields {
  form_started_at: Date | null;
  form_completed_at: Date | null;
  calendly_booked_at: Date | null;
  token: string | null;
  origen: string;
}

export interface ContactFlowDisplay {
  status: ContactStatus;
  statusLabel: string;
  statusBadgeClass: string;
  originChannel: OriginChannel;
  originChannelLabel: string;
  originDb: string;
}

/** Determina el estado del contacto a partir de sus timestamps. */
export function getContactStatus(fields: Pick<ContactFlowFields, "form_started_at" | "form_completed_at" | "calendly_booked_at">): ContactStatus {
  if (fields.calendly_booked_at) return "agendado";
  if (fields.form_completed_at)  return "completo_sin_cita";
  if (fields.form_started_at)    return "en_proceso";
  return "sin_ingresar";
}

/** Mapea un ContactStatus a su label y clase visual. */
export function statusToDisplay(status: ContactStatus): { statusLabel: string; statusBadgeClass: string } {
  switch (status) {
    case "sin_ingresar":
      return {
        statusLabel: "Sin ingresar",
        statusBadgeClass: "border border-slate-200 bg-slate-100 text-slate-700",
      };
    case "en_proceso":
      return {
        statusLabel: "En proceso",
        statusBadgeClass: "border border-sky-200 bg-sky-50 text-sky-900",
      };
    case "completo_sin_cita":
      return {
        statusLabel: "Completo · sin cita",
        statusBadgeClass: "border border-amber-200 bg-amber-50 text-amber-900",
      };
    case "agendado":
      return {
        statusLabel: "Agendado",
        statusBadgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-800",
      };
  }
}

/** Construye el objeto de display completo para un contacto. */
export function buildContactFlowDisplay(fields: ContactFlowFields): ContactFlowDisplay {
  const hasToken = Boolean(fields.token?.trim());
  const originChannel: OriginChannel = hasToken ? "invitacion" : "organico";
  const status = getContactStatus(fields);
  const { statusLabel, statusBadgeClass } = statusToDisplay(status);

  return {
    status,
    statusLabel,
    statusBadgeClass,
    originChannel,
    originChannelLabel: hasToken ? "Invitación" : "Orgánico",
    originDb: fields.origen || "—",
  };
}
