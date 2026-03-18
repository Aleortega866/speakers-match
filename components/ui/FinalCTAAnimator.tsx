"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTAAnimator() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Estado inicial oculto — aplicado inmediatamente en todos los elementos
      const setInitial = () => {
        gsap.set(".cta-word",  { yPercent: 115 });
        gsap.set(".cta-sub",   { y: 16, opacity: 0 });
        gsap.set(".cta-btn",   { scale: 0.88, opacity: 0 });
        gsap.set(".cta-micro", { opacity: 0, y: 8 });
      };
      setInitial();

      // Timeline con to() — anima desde el estado ya seteado
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      tl.to(".cta-word",  { yPercent: 0, duration: 0.62, stagger: 0.048 })
        .to(".cta-sub",   { y: 0, opacity: 1, duration: 0.48 }, "-=0.22")
        .to(".cta-btn",   { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.2)" }, "-=0.18")
        .to(".cta-micro", { opacity: 1, y: 0, duration: 0.38 }, "-=0.12");

      const play = () => { setInitial(); tl.invalidate().restart(); };

      ScrollTrigger.create({
        trigger: ".cta-section",
        start: "top 78%",
        onEnter:     play,
        onEnterBack: play,
        onLeaveBack: setInitial,
      });

      // Glow pulsante en el botón
      gsap.to(".cta-btn-link", {
        boxShadow: "0 0 28px rgba(255,255,255,0.22), 0 0 56px rgba(255,255,255,0.08)",
        duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.8,
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
