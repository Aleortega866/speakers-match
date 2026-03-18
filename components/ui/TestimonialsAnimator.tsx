"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function TestimonialsAnimator() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const setInitial = () => {
        gsap.set(".t-label",       { x: -24, opacity: 0 });
        gsap.set(".t-card-0",      { x: -48, opacity: 0 });
        gsap.set(".t-card-1",      { x: 48,  opacity: 0 });
        gsap.set(".t-quote-mark",  { scale: 0.25, opacity: 0 });
        gsap.set(".t-line",        { scaleX: 0, transformOrigin: "left center" });
        gsap.set(".t-attribution", { y: 10, opacity: 0 });
        gsap.set(".t-num",         { opacity: 0 });
      };
      setInitial();

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      tl.to(".t-label",       { x: 0, opacity: 1, duration: 0.42 })
        .to(".t-card-0",      { x: 0, opacity: 1, duration: 0.68 }, "-=0.1")
        .to(".t-card-1",      { x: 0, opacity: 1, duration: 0.68 }, "-=0.52")
        .to(".t-quote-mark",  { scale: 1, opacity: 1, duration: 0.45, stagger: 0.1, ease: "back.out(2)" }, "-=0.45")
        .to(".t-line",        { scaleX: 1, duration: 0.5, stagger: 0.12, ease: "power4.inOut" }, "-=0.25")
        .to(".t-attribution", { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 }, "-=0.3")
        .to(".t-num",         { opacity: 1, duration: 0.38, stagger: 0.1 }, "-=0.2");

      const play = () => { setInitial(); tl.invalidate().restart(); };

      ScrollTrigger.create({
        trigger: ".testimonials-section",
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
