"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function GuaranteeAnimator() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const setInitial = () => {
        gsap.set(".guarantee-line",    { scaleX: 0, transformOrigin: "left center" });
        gsap.set(".guarantee-label",   { y: -10, opacity: 0 });
        gsap.set(".guarantee-word",    { yPercent: 115 });
        gsap.set(".guarantee-closing", { opacity: 0, y: 14 });
      };
      setInitial();

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      tl.to(".guarantee-line",    { scaleX: 1, duration: 0.7, ease: "power4.inOut" })
        .to(".guarantee-label",   { y: 0, opacity: 1, duration: 0.4 }, "-=0.15")
        .to(".guarantee-word",    { yPercent: 0, duration: 0.58, stagger: 0.042 }, "-=0.1")
        .to(".guarantee-closing", { opacity: 1, y: 0, duration: 0.45 }, "-=0.18");

      const play = () => { setInitial(); tl.invalidate().restart(); };

      ScrollTrigger.create({
        trigger: ".guarantee-section",
        start: "top 78%",
        onEnter:     play,
        onEnterBack: play,
        onLeaveBack: setInitial,
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
