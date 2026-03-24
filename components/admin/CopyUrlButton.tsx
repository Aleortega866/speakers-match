"use client";

import { useState } from "react";

export default function CopyUrlButton({ url, label = "Copiar" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-primary-typo shrink-0 rounded-full border border-black/15 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-black transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      {done ? "Listo" : label}
    </button>
  );
}
