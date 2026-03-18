"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HeroAnimator() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const setInitial = () => {
        gsap.set(".hero-line-speaker .hero-char", { yPercent: 115 });
        gsap.set(".hero-line-match .hero-char",   { yPercent: 115 });
        gsap.set(".hero-payload",                 { y: 18, opacity: 0 });
        gsap.set(".hero-footer",                  { opacity: 0 });
      };
      setInitial();

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
      tl.to(".hero-line-speaker .hero-char", { yPercent: 0, duration: 0.78, stagger: 0.038 })
        .to(".hero-line-match .hero-char",   { yPercent: 0, duration: 0.78, stagger: 0.038 }, "-=0.52")
        .to(".hero-payload",                 { y: 0, opacity: 1, duration: 0.55, stagger: 0.1 }, "-=0.38")
        .to(".hero-footer",                  { opacity: 1, duration: 0.4 }, "-=0.15");

      const play = () => { setInitial(); tl.invalidate().restart(); };

      ScrollTrigger.create({
        trigger: ".hero-section",
        start: "top 98%",
        onEnter:     play,
        onEnterBack: play,
        onLeaveBack: setInitial,
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
