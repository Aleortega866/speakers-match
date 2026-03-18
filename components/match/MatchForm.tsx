"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  readSpeakerMatchData,
  writeSpeakerMatchData,
} from "@/lib/speakerMatchStore";
import type { MatchStepWithOptions } from "@/lib/matchSteps";
import StepIndicator from "./StepIndicator";
import RadioOption from "./RadioOption";

interface Props {
  steps: MatchStepWithOptions[];
}

export default function MatchForm({ steps }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  // rerender-lazy-state-init: Array allocation solo al montar, no en cada render
  const [answers, setAnswers] = useState<string[]>(
    () => Array(steps.length).fill("")
  );

  // Hidratar respuestas previas desde localStorage si existen
  useEffect(() => {
    const data = readSpeakerMatchData();
    if (Array.isArray(data.matchAnswers) && data.matchAnswers.length) {
      const hydrated = Array(steps.length)
        .fill("")
        .map((_, i) => data.matchAnswers[i] ?? "");
      setAnswers(hydrated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps[currentStep];
  const selected = answers[currentStep];

  // rerender-memo-with-default-value: useCallback + setState funcional para que RadioOption.memo funcione
  const handleSelect = useCallback((value: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentStep] = value;
      writeSpeakerMatchData({ matchAnswers: newAnswers });
      return newAnswers;
    });
  }, [currentStep]);

  const handleNext = () => {
    if (!selected) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      writeSpeakerMatchData({ matchAnswers: answers });
      router.push("/gracias");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="w-full">
      {/* Step indicator */}
      <StepIndicator total={steps.length} current={currentStep + 1} />

      {/* Question + options: re-animan al cambiar de paso */}
      <div key={currentStep} className="animate-fade-slide-in">
        <h2 className="text-lead font-bold text-black mb-6">{step.question}</h2>

        <div
          className={`gap-2 mb-10 max-w-2xl ${
            step.columns === 2
              ? "grid grid-cols-1 sm:grid-cols-2"
              : "flex flex-col"
          }`}
        >
          {step.options.map((option) => (
            <RadioOption
              key={option.id}
              label={option.label}
              value={option.label}
              selected={selected === option.label}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          className={`px-6 py-3 text-sm font-semibold border border-black bg-white text-black transition-all duration-200 hover:bg-black hover:text-white hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
            currentStep === 0 ? "invisible" : ""
          }`}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected}
          className="px-8 py-3 text-sm font-semibold bg-black text-white transition-all duration-200 disabled:opacity-30 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md cursor-pointer disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {currentStep === steps.length - 1 ? "Ver mi match" : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}
