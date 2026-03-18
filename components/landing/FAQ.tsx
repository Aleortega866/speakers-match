"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/ui/Reveal";

gsap.registerPlugin(ScrollTrigger);

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

  // One ref per answer panel and per icon
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const toggle = (i: number) => {
    const prev = openIndex;
    const next = prev === i ? null : i;

    // Close the previously open item (if different)
    if (prev !== null && prev !== i) {
      gsap.to(answerRefs.current[prev], {
        height: 0,
        opacity: 0,
        duration: 0.32,
        ease: "power3.in",
      });
      gsap.to(iconRefs.current[prev], {
        rotation: 0,
        duration: 0.28,
        ease: "power2.out",
      });
    }

    if (next === null) {
      // Closing current
      gsap.to(answerRefs.current[i], {
        height: 0,
        opacity: 0,
        duration: 0.32,
        ease: "power3.in",
      });
      gsap.to(iconRefs.current[i], {
        rotation: 0,
        duration: 0.28,
        ease: "power2.out",
      });
    } else {
      // Opening
      gsap.fromTo(
        answerRefs.current[i],
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.42, ease: "power3.out" }
      );
      gsap.to(iconRefs.current[i], {
        rotation: 45,
        duration: 0.28,
        ease: "power2.out",
      });
    }

    setOpenIndex(next);
  };

  return (
    <section className="bg-white pt-section pb-section">
      <div className="container-page max-w-3xl mx-auto">

        <Reveal>
          <h2 className="text-display font-heading font-extrabold text-black leading-none mb-12 text-center">
            Preguntas frecuentes
          </h2>
        </Reveal>

        <div>
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="border-b border-gray-200">

                {/* Question row */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex justify-between items-center py-5 text-left gap-4 cursor-pointer"
                >
                  <span className="font-body font-semibold text-black text-base">
                    {faq.q}
                  </span>
                  {/* + stays as character, GSAP rotates it 45° → × */}
                  <span
                    ref={(el) => { iconRefs.current[i] = el; }}
                    className="font-body text-2xl font-light text-black shrink-0 select-none"
                    style={{ display: "inline-block", transformOrigin: "center" }}
                    aria-hidden
                  >
                    +
                  </span>
                </button>

                {/* Answer panel — GSAP controls height & opacity */}
                <div
                  ref={(el) => { answerRefs.current[i] = el; }}
                  style={{ height: 0, overflow: "hidden", opacity: 0 }}
                >
                  <p className="font-body font-light text-gray-600 leading-relaxed pb-5">
                    {faq.a}
                  </p>
                </div>

              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
