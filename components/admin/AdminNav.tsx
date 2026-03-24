"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Rutas del backoffice (una entrada por vista). */
const NAV_ITEMS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/conferencistas", label: "Conferencistas" },
  { href: "/admin/referencia/cuestionario", label: "Cuestionario" },
  { href: "/admin/importar", label: "Importar" },
] as const;

function isActive(pathname: string, href: string): boolean {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (href === "/admin") {
    return path === "/admin";
  }
  if (path === href) return true;
  return pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del backoffice"
      className="flex w-full justify-center sm:w-auto sm:justify-start"
    >
      <div className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-max items-center gap-1 p-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative rounded-full px-3 py-2 text-center text-xs font-semibold transition sm:min-w-24 sm:px-4 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 ${
                active
                  ? "bg-black text-white shadow-sm"
                  : "text-black/65 hover:bg-white hover:text-black"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
