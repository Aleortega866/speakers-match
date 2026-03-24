import { personInitials } from "@/lib/admin/personInitials";

/**
 * Cuadro de iniciales (mismo estilo que el listado de conferencistas).
 * `muted`: inactivo / bajo énfasis (gris); por defecto negro sobre blanco.
 */
export default function AvatarInitials({
  name,
  muted = false,
}: {
  name: string;
  muted?: boolean;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black tracking-tight ${
        muted ? "bg-black/10 text-black/45" : "bg-black text-white"
      }`}
      aria-hidden
    >
      {personInitials(name)}
    </span>
  );
}
