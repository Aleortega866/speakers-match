/**
 * URL pública base para enlaces compartibles (invitaciones, etc.).
 * En producción define `NEXT_PUBLIC_APP_URL` (sin barra final).
 */
export function getPublicBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function inviteStartUrl(token: string): string {
  const base = getPublicBaseUrl();
  return `${base}/start?t=${encodeURIComponent(token)}`;
}
