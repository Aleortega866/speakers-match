/** Iniciales para avatar (misma lógica que conferencistas: dos palabras → dos letras; si no, hasta 2 caracteres). */
export function personInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[1]?.[0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return displayName.trim().slice(0, 2).toUpperCase() || "—";
}
