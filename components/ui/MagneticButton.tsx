"use client";
import { useRef } from "react";
import gsap from "gsap";

interface Props {
  children: React.ReactNode;
  strength?: number; // 0–1, default 0.35
}

/**
 * Wraps any element with a magnetic cursor effect.
 * On hover the element follows the cursor slightly;
 * on leave it snaps back with an elastic spring.
 */
export default function MagneticButton({ children, strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    gsap.to(el, { x: dx, y: dy, duration: 0.28, ease: "power2.out" });
  };

  const onLeave = () => {
    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.65,
      ease: "elastic.out(1, 0.45)",
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: "inline-block" }}
    >
      {children}
    </div>
  );
}
