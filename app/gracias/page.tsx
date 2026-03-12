"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { readSpeakerMatchData, clearSpeakerMatchData } from "@/lib/speakerMatchStore";

export default function GraciasPage() {
  const router = useRouter();

  useEffect(() => {
    const data = readSpeakerMatchData();
    // Punto único donde consolidamos todo el JSON del flujo
    // Listo para, en el futuro, enviarse a una API.
    // eslint-disable-next-line no-console
    console.log("SpeakerMatch data", data);
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

      {/* CTA: por ahora vuelve al inicio y borra el flujo guardado; luego se cambiará */}
      <button
        type="button"
        onClick={() => {
          clearSpeakerMatchData();
          router.push("/");
        }}
        className="btn-primary-typo bg-black text-white px-10 py-4 text-sm tracking-wide transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md inline-block animate-fade-slide-in cursor-pointer"
        style={{ animationDelay: "300ms" }}
      >
        Agenda una llamada
      </button>
    </main>
  );
}
