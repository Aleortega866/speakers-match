interface StepIndicatorProps {
  total: number;
  current: number;
}

export default function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-black flex items-center justify-center
                text-xs sm:text-sm font-semibold transition-all duration-200
                ${isActive || isDone ? "bg-black text-white" : "bg-white text-black"}
                ${isActive ? "scale-105" : ""}
              `}
            >
              {step}
            </div>
            {step < total && (
              <div
                className={`w-5 sm:w-8 md:w-10 h-px ${isDone || isActive ? "bg-black" : "bg-gray-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
