"use client";

import { useEffect, useRef, useState } from "react";

/** Parsea "+15", "98%", "+500" → { prefix, value, suffix } */
function parseValue(str: string): { prefix: string; value: number; suffix: string } {
  const match = str.match(/^([^\d.-]*)([\d.]+)(.*)$/);
  if (!match) return { prefix: "", value: 0, suffix: str };
  return {
    prefix: match[1] ?? "",
    value: Number(match[2]) ?? 0,
    suffix: match[3] ?? "",
  };
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

interface CountUpProps {
  /** Valor a mostrar, ej: "+15", "+500", "98%" */
  value: string;
  /** Duración en ms */
  duration?: number;
  /** Retraso antes de iniciar (para stagger) */
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Animación de número que sube desde 0 al valor final al entrar en viewport.
 * Respeta prefers-reduced-motion (muestra valor final sin animar).
 */
export default function CountUp({
  value,
  duration = 1200,
  delay = 0,
  className = "",
  style,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const { prefix, value: target, suffix } = parseValue(value);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || target === 0) {
      if (visible) setDisplayValue(target);
      return;
    }

    if (reducedMotion.current) {
      setDisplayValue(target);
      return;
    }

    const startTime = performance.now() + delay;
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(t);
      const current = Math.round(target * eased);
      setDisplayValue(current);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, target, duration, delay]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
