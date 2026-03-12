"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { matchSteps } from "@/lib/formData";
import {
  readSpeakerMatchData,
  writeSpeakerMatchData,
} from "@/lib/speakerMatchStore";
import StepIndicator from "./StepIndicator";
import RadioOption from "./RadioOption";

export default function MatchForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(matchSteps.length).fill("")
  );

  // Hidratar respuestas previas desde localStorage si existen
  useEffect(() => {
    const data = readSpeakerMatchData();
    if (Array.isArray(data.matchAnswers) && data.matchAnswers.length) {
      const hydrated = Array(matchSteps.length)
        .fill("")
        .map((_, i) => data.matchAnswers[i] ?? "");
      setAnswers(hydrated);
    }
  }, []);

  const step = matchSteps[currentStep];
  const selected = answers[currentStep];

  // rerender-memo-with-default-value: useCallback + setState funcional para que RadioOption.memo funcione
  const handleSelect = useCallback((value: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentStep] = value;
      // Persistimos inmediatamente en el store compartido
      writeSpeakerMatchData({ matchAnswers: newAnswers });
      return newAnswers;
    });
  }, [currentStep]);

  const handleNext = () => {
    if (!selected) return;
    if (currentStep < matchSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Aseguramos que las respuestas actuales están persistidas
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
      <StepIndicator total={matchSteps.length} current={currentStep + 1} />

      {/* Question + options: re-animan al cambiar de paso */}
      <div key={currentStep} className="animate-fade-slide-in">
        <h2 className="text-lead font-bold text-black mb-6">{step.question}</h2>

        {/* Options: max-width en xl para que no se estiren en monitores grandes */}
        <div
          className={`gap-2 mb-10 max-w-2xl ${
            step.columns === 2
              ? "grid grid-cols-1 sm:grid-cols-2"
              : "flex flex-col"
          }`}
        >
          {step.options.map((option) => (
          <RadioOption
            key={option}
            label={option}
            value={option}
            selected={selected === option}
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
          {currentStep === matchSteps.length - 1
            ? "Ver mi match"
            : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}
