"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
  parseErrors?: string[];
}

const CSV_TEMPLATE = [
  "nombre,apellido,empresa,email,fecha_evento",
  "Ana,García,TechCo S.A.,ana@techco.mx,2026-06-15",
  "Carlos,López,Innovacorp,c.lopez@innovacorp.mx,",
].join("\n");

export default function ImportarClient({ initialPendingCount }: { initialPendingCount: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachResult, setOutreachResult] = useState<{ sent: number } | null>(null);
  const [outreachError, setOutreachError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportResult(null);
    setImportError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/csv-import", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setImportError(json.message ?? "Error al importar");
      } else {
        setImportResult(json.data);
        setPendingCount((prev) => prev + (json.data.imported as number));
        router.refresh();
      }
    } catch {
      setImportError("Error de red al importar");
    } finally {
      setImportLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleOutreach() {
    setOutreachLoading(true);
    setOutreachResult(null);
    setOutreachError(null);

    try {
      const res = await fetch("/api/admin/outreach", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setOutreachError(json.message ?? "Error al disparar la campaña");
      } else {
        setOutreachResult(json.data);
        setPendingCount(0);
        router.refresh();
      }
    } catch {
      setOutreachError("Error de red al disparar la campaña");
    } finally {
      setOutreachLoading(false);
    }
  }

  return (
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
            Columnas requeridas: <code className="rounded bg-black/5 px-1 py-0.5 text-xs">nombre, apellido, empresa, email</code>.
            Columna opcional: <code className="rounded bg-black/5 px-1 py-0.5 text-xs">fecha_evento</code>.
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

        {importError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {importError}
          </div>
        )}

        {importResult && (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              ✅ <strong>{importResult.imported}</strong> contactos importados
              {importResult.skipped > 0 && (
                <span className="text-emerald-700"> · {importResult.skipped} omitidos (ya existían)</span>
              )}
            </div>
            {(importResult.errors.length > 0 || (importResult.parseErrors?.length ?? 0) > 0) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold">Advertencias:</p>
                {importResult.parseErrors?.map((e, i) => <p key={i}>⚠ {e}</p>)}
                {importResult.errors.map((e) => <p key={e.row}>⚠ Fila {e.row}: {e.reason}</p>)}
              </div>
            )}
          </div>
        )}
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

        {outreachError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {outreachError}
          </div>
        )}

        {outreachResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✅ Campaña enviada a <strong>{outreachResult.sent}</strong> contacto{outreachResult.sent !== 1 ? "s" : ""}
            {outreachResult.sent === 0 && " — No había pendientes"}
          </div>
        )}
      </div>
    </section>
  );
}
