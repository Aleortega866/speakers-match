"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  readSpeakerMatchData,
  writeSpeakerMatchData,
} from "@/lib/speakerMatchStore";

// bundle-dynamic-imports: react-day-picker (~15-20 KB) solo se carga cuando el usuario llega al paso 3
const DatePicker = dynamic(() => import("./DatePicker"), { ssr: false });

interface FormData {
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  fecha: string;
}

const steps = [
  { id: 1, question: "¿Cuál es tu nombre?" },
  { id: 2, question: "¿En cuál empresa trabajas?" },
  { id: 3, question: "¿Cuál es tu correo electrónico de empresa?" },
  { id: 4, question: "¿En qué fecha quieres contratar al speaker?" },
];

export default function IntakeForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellido: "",
    empresa: "",
    email: "",
    fecha: "",
  });
  const [started, setStarted] = useState(false);

  // Hidratar desde localStorage al montar (solo cliente)
  useEffect(() => {
    const data = readSpeakerMatchData();
    if (data?.intake) {
      setFormData({
        nombre: data.intake.nombre ?? "",
        apellido: data.intake.apellido ?? "",
        empresa: data.intake.empresa ?? "",
        email: data.intake.email ?? "",
        fecha: data.intake.fecha ?? "",
      });
    }
  }, []);

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  const canAdvance = () => {
    if (currentStep === 0) return formData.nombre.trim() && formData.apellido.trim();
    if (currentStep === 1) return formData.empresa.trim();
    if (currentStep === 2) return formData.email.trim() && formData.email.includes("@");
    if (currentStep === 3) return formData.fecha.trim();
    return false;
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Persistimos los datos de intake en el store compartido
      writeSpeakerMatchData({
        intake: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          empresa: formData.empresa,
          email: formData.email,
          fecha: formData.fecha,
        },
      });
      router.push("/match");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNext();
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center w-full max-w-4xl">
        <button
          onClick={() => setStarted(true)}
          className="btn-primary-typo bg-black text-white px-12 py-6 rounded-md text-xl tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 cursor-pointer"
        >
          Encuentra un speaker
        </button>
        <p className="font-body mt-12 text-sm text-gray-600 text-center max-w-4xl leading-relaxed px-4">
          Aquí va el texto que hace referencia a los legales. Generalmente, se
          tiene al menos un link a{" "}
          <a
            href="/terminos"
            className="underline hover:text-black transition-colors"
          >
            Términos y Condiciones
          </a>{" "}
          y{" "}
          <a
            href="/privacidad"
            className="underline hover:text-black transition-colors"
          >
            Política de Privacidad
          </a>
          . Por ahora, es cualquier texto de posicionamiento que ayude a
          transmitir la idea de legales y avisos que se quieren compartir con el
          usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      {/* Pregunta + campos: una sola transición al cambiar de paso */}
      <div key={currentStep} className="animate-fade-slide-in">
        <p className="font-body text-lg font-semibold text-black mb-6 text-center">
          {steps[currentStep].question}
        </p>

        {/* Fields + botón en la misma fila en sm+ */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch" onKeyDown={handleKeyDown}>
          <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
          {currentStep === 0 && (
            <>
              <input
                autoFocus
                type="text"
                placeholder="Primer nombre"
                value={formData.nombre}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((d) => ({ ...d, nombre: value }));
                  writeSpeakerMatchData({
                    intake: { ...formData, nombre: value },
                  });
                }}
                className="w-full sm:flex-1 border border-gray-300 px-4 py-3 text-sm text-black placeholder-gray-400 focus:border-black transition-all duration-200"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={formData.apellido}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((d) => ({ ...d, apellido: value }));
                  writeSpeakerMatchData({
                    intake: { ...formData, apellido: value },
                  });
                }}
                className="w-full sm:flex-1 border border-gray-300 px-4 py-3 text-sm text-black placeholder-gray-400 focus:border-black transition-all duration-200"
              />
            </>
          )}
          {currentStep === 1 && (
            <input
              autoFocus
              type="text"
              placeholder="Nombre de tu empresa"
              value={formData.empresa}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((d) => ({ ...d, empresa: value }));
                writeSpeakerMatchData({
                  intake: { ...formData, empresa: value },
                });
              }}
              className="w-full sm:flex-1 border border-gray-300 px-4 py-3 text-sm text-black placeholder-gray-400 focus:border-black transition-all duration-200"
            />
          )}
          {currentStep === 2 && (
            <input
              autoFocus
              type="email"
              placeholder="correo@empresa.com"
              value={formData.email}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((d) => ({ ...d, email: value }));
                writeSpeakerMatchData({
                  intake: { ...formData, email: value },
                });
              }}
              className="w-full sm:flex-1 border border-gray-300 px-4 py-3 text-sm text-black placeholder-gray-400 focus:border-black transition-all duration-200"
            />
          )}
          {currentStep === 3 && (
            <DatePicker
              value={formData.fecha}
              onChange={(v) => {
                setFormData((d) => ({ ...d, fecha: v }));
                writeSpeakerMatchData({
                  intake: { ...formData, fecha: v },
                });
              }}
            />
          )}
          </div>

          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="bg-black text-white w-4/5 mx-auto py-3 sm:w-auto sm:px-5 sm:mx-0 sm:py-0 flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-30 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md cursor-pointer disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span className="btn-primary-typo text-sm mr-2">Siguiente</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="16.4 7 21.5 12 16.4 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="2.5" x2="19.2" y1="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-11/12 mx-auto bg-gray-200 h-1.5 rounded-full">
        <div
          className="bg-black h-1.5 transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
