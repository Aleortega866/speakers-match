"use client";

import { useState } from "react";

const faqs = [
  {
    q: "¿Cuánto cuesta el servicio de matching?",
    a: "El matching es completamente sin costo. Solo pagas si decides contratar al speaker que te recomendamos.",
  },
  {
    q: "¿En cuánto tiempo recibo la propuesta?",
    a: "En menos de 24 horas hábiles. Nuestro equipo revisa tu perfil de evento y selecciona manualmente las mejores opciones.",
  },
  {
    q: "¿Pueden conseguir speakers internacionales?",
    a: "Sí. Tenemos acceso a speakers de toda LATAM, España y algunos de habla inglesa con experiencia en audiencias mexicanas.",
  },
  {
    q: "¿Qué pasa si el speaker cancela el evento?",
    a: "Gestionamos un reemplazo de igual o mayor nivel sin costo adicional. La continuidad de tu evento es nuestra responsabilidad.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="bg-white pt-section pb-section">
      <div className="container-page max-w-3xl mx-auto">

        <h2 className="text-display font-heading font-extrabold text-black leading-none mb-12 text-center">
          Preguntas frecuentes
        </h2>

        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full flex justify-between items-center py-5 text-left gap-4 cursor-pointer"
              >
                <span className="font-body font-semibold text-black text-base">
                  {faq.q}
                </span>
                <span
                  className="font-body text-2xl font-light text-black shrink-0 transition-transform duration-300 select-none"
                  aria-hidden
                >
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>

              {/* Transición CSS grid rows */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ${
                  openIndex === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="font-body font-light text-gray-600 leading-relaxed pb-5">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
