"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import { readSpeakerMatchData, clearSpeakerMatchData } from "@/lib/speakerMatchStore";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

export default function GraciasPage() {
  const [calendlyHref, setCalendlyHref] = useState<string>("");

  useEffect(() => {
    const data = readSpeakerMatchData();

    // Registrar form_completed en la BD (fire-and-forget)
    const { nombre, apellido, email } = data.intake;
    const token = data.token;
    fetch("/api/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: window.location.origin,
      },
      body: JSON.stringify({
        type: "form_completed",
        ...(token ? { token } : { email }),
        matchAnswers: data.matchAnswers,
      }),
    }).catch(() => {
      // fire-and-forget: no bloquea la UX si falla
    });

    // Construir URL de Calendly con prefill
    if (CALENDLY_URL) {
      const params = new URLSearchParams();
      if (nombre || apellido) params.set("name", `${nombre} ${apellido}`.trim());
      if (email) params.set("email", email);
      setCalendlyHref(`${CALENDLY_URL}?${params.toString()}`);
    }

    // Limpiar store una vez registrado
    clearSpeakerMatchData();
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-[var(--space-inline)] text-center">
      {/* Logo */}
      <div className="mb-10 animate-fade-slide-in">
        <Logo size="md" />
      </div>

      {/* Title */}
      <h1
        className="text-display font-heading font-extrabold text-black leading-none mb-8 animate-fade-slide-in"
        style={{ animationDelay: "0ms" }}
      >
        SpeakerMatch<sup className="text-2xl">®</sup>
      </h1>

      {/* Message */}
      <p
        className="text-lead font-body font-light text-black max-w-xl leading-relaxed mb-10 animate-fade-slide-in"
        style={{ animationDelay: "100ms" }}
      >
        ¡Listo! En base a tus criterios de búsqueda aquí tienes nuestra
        recomendación para lograr{" "}
        <strong>el momento correcto</strong> en tu evento empresarial
      </p>

      {/* Urgency */}
      <p
        className="text-lead font-body font-light text-black max-w-lg leading-relaxed mb-10 animate-fade-slide-in"
        style={{ animationDelay: "200ms" }}
      >
        Las agendas de los top speakers en 2026 están por llenarse.{" "}
        <strong>Reserva 15 minutos</strong> con un consultor de nuestro equipo
        para platicar las recomendaciones de esta propuesta
      </p>

      {/* CTA: Calendly */}
      {calendlyHref ? (
        <a
          href={calendlyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary-typo bg-black text-white px-10 py-4 text-sm tracking-wide transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md inline-block animate-fade-slide-in cursor-pointer"
          style={{ animationDelay: "300ms" }}
        >
          Agenda una llamada
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="btn-primary-typo bg-black text-white px-10 py-4 text-sm tracking-wide opacity-40 cursor-default animate-fade-slide-in inline-block"
          style={{ animationDelay: "300ms" }}
        >
          Agenda una llamada
        </button>
      )}
    </main>
  );
}
