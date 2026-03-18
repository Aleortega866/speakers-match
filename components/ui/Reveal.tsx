"use client";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal powered by GSAP ScrollTrigger.
 * - Scroll DOWN  → elemento aparece (y:34→0, opacity:0→1)
 * - Scroll UP    → elemento desaparece (reverse)
 * - Scroll DOWN again → vuelve a aparecer
 *
 * toggleActions: "play none play reverse"
 *   onEnter      → play   (bajando, entra al viewport)
 *   onLeave      → none   (sube por encima del viewport)
 *   onEnterBack  → play   (vuelve a entrar desde arriba)
 *   onLeaveBack  → reverse (sube y sale por abajo del viewport)
 */
export default function Reveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.78,
          delay: delay / 1000,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none restart reset",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
