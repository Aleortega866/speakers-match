"use client";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";

const logos = [
  { name: "BBVA", src: "/logo-bbva.png" },
  { name: "Nissan", src: "/logo-nissan.svg" },
  { name: "Quálitas", src: "/logo-qualitas.png" },
  { name: "Ingredion", src: "/logo-ingredion.png" },
  { name: "KPMG", src: "/logo-kpmg.png" },
];

const INVERTED = new Set(["BBVA", "Quálitas", "Ingredion", "Nissan"]);

function Logo({ name, src }: { name: string; src: string }) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ height: "3rem", width: "6rem" }}
    >
      <Image
        src={src}
        alt={name}
        fill
        className={`object-contain grayscale opacity-60 transition-opacity duration-300 hover:opacity-90 ${
          INVERTED.has(name) ? "invert" : ""
        }`}
        sizes="96px"
      />
    </div>
  );
}

/**
 * Infinite horizontal logo ticker powered by GSAP.
 * Logos are duplicated once — GSAP animates x: -50% on repeat: -1
 * to create a seamless loop. Pauses on hover.
 */
export default function LogoMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [paused, setPaused] = useState(false);

  useGSAP(() => {
    tweenRef.current = gsap.to(trackRef.current, {
      x: "-50%",
      duration: 24,
      ease: "none",
      repeat: -1,
    });
  });

  const handleEnter = () => {
    tweenRef.current?.timeScale(0.25);
    setPaused(true);
  };

  const handleLeave = () => {
    gsap.to(tweenRef.current, { timeScale: 1, duration: 0.6, ease: "power2.out" });
    setPaused(false);
  };

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-hidden={paused}
    >
      <div
        ref={trackRef}
        className="flex items-center"
        style={{ gap: "clamp(2rem, 4vw, 4rem)", width: "max-content" }}
      >
        {/* Original set */}
        {logos.map((l) => (
          <Logo key={l.name} {...l} />
        ))}
        {/* Duplicate for seamless loop */}
        {logos.map((l) => (
          <Logo key={`${l.name}-2`} {...l} />
        ))}
      </div>
    </div>
  );
}
