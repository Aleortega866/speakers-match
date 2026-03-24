import { redirect } from "next/navigation";

/** Unificado con `/admin/conferencistas` (una sola vista de catálogo). */
export default function AdminReferenciaConferencistasRedirectPage() {
  redirect("/admin/conferencistas");
}
