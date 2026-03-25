"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
  parseErrors?: string[];
}

type ToastType = "success" | "error" | "warning";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const CSV_TEMPLATE = [
  "nombre,apellido,empresa,email,fecha_evento",
  "Ana,García,TechCo S.A.,ana@techco.mx,2026-06-15",
  "Carlos,López,Innovacorp,c.lopez@innovacorp.mx,",
].join("\n");

const TOAST_COLORS: Record<ToastType, string> = {
  success: "bg-emerald-600 text-white",
  error:   "bg-rose-600 text-white",
  warning: "bg-amber-500 text-white",
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
};

let toastId = 0;

export default function ImportarClient({ initialPendingCount }: { initialPendingCount: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importLoading, setImportLoading]   = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [pendingCount, setPendingCount]     = useState(initialPendingCount);
  const [toasts, setToasts]                 = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/csv-import", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        addToast(json.message ?? "Error al importar", "error");
      } else {
        const { imported, skipped, errors, parseErrors } = json.data as ImportResult;
        const warnings = (errors?.length ?? 0) + (parseErrors?.length ?? 0);

        addToast(
          `${imported} contacto${imported !== 1 ? "s" : ""} importado${imported !== 1 ? "s" : ""}` +
          (skipped > 0 ? ` · ${skipped} omitido${skipped !== 1 ? "s" : ""}` : ""),
          "success"
        );

        if (warnings > 0) {
          addToast(`${warnings} advertencia${warnings !== 1 ? "s" : ""} en el CSV`, "warning");
        }

        setPendingCount((prev) => prev + imported);
        router.refresh();
      }
    } catch {
      addToast("Error de red al importar", "error");
    } finally {
      setImportLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleOutreach() {
    setOutreachLoading(true);
    try {
      const res  = await fetch("/api/admin/outreach", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        addToast(json.message ?? "Error al disparar la campaña", "error");
      } else {
        const { sent } = json.data as { sent: number };
        addToast(
          sent === 0
            ? "Sin contactos pendientes"
            : `Campaña enviada a ${sent} contacto${sent !== 1 ? "s" : ""}`,
          sent === 0 ? "warning" : "success"
        );
        setPendingCount(0);
        router.refresh();
      }
    } catch {
      addToast("Error de red al disparar la campaña", "error");
    } finally {
      setOutreachLoading(false);
    }
  }

  return (
    <>
      {/* ── Toasts ── */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-fade-slide-in-right ${TOAST_COLORS[toast.type]}`}
          >
            <span className="mt-0.5 shrink-0 font-bold text-base leading-none">
              {TOAST_ICONS[toast.type]}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ── Contenido ── */}
      <section className="space-y-6 font-body text-black">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-micro font-black uppercase tracking-widest text-black/50">Importar</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-black md:text-4xl">
            Campaña de outreach
          </h1>
          <p className="mt-2 text-sm text-black/65 sm:text-base">
            Sube un CSV para crear contactos con links de invitación, luego dispara la campaña de correos.
          </p>
        </div>

        {/* Sección A: Importar CSV */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-black">1. Importar contactos desde CSV</h2>
            <p className="mt-1 text-sm text-black/55">
              Columnas requeridas:{" "}
              <code className="rounded bg-black/5 px-1 py-0.5 text-xs">nombre, apellido, empresa, email</code>.
              Columna opcional:{" "}
              <code className="rounded bg-black/5 px-1 py-0.5 text-xs">fecha_evento</code>.
              Los emails duplicados se omiten automáticamente.
            </p>
          </div>

          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
            download="plantilla_speakermatch.csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-black transition hover:bg-black/5"
          >
            ↓ Descargar plantilla CSV
          </a>

          <form onSubmit={handleImport} className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              required
              className="block text-sm text-black/70 file:mr-3 file:rounded-lg file:border file:border-black/15 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black file:transition file:hover:bg-black/5"
            />
            <button
              type="submit"
              disabled={importLoading}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {importLoading ? "Importando…" : "Importar"}
            </button>
          </form>
        </div>

        {/* Sección B: Disparar campaña */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-black">2. Disparar campaña de correos</h2>
            <p className="mt-1 text-sm text-black/55">
              Envía el link de invitación personalizado a cada contacto que aún no ha recibido su correo.
              Esta acción no se puede deshacer y cada contacto solo recibe el correo una vez.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleOutreach}
              disabled={pendingCount === 0 || outreachLoading}
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {outreachLoading
                ? "Enviando…"
                : pendingCount === 0
                ? "Sin contactos pendientes"
                : `Disparar campaña · ${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
