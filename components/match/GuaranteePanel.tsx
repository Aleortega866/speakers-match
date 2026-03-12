function ArrowRightIcon({ className, width = 14, height = 24 }: { className?: string, width?: number, height?: number }) {
  return (
    <span className={className}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16.4 7 21.5 12 16.4 17" />
        <line x1="2.5" x2="19.2" y1="12" y2="12" />
      </svg>
    </span>
  );
}

export default function GuaranteePanel() {
  return (
    <div className="bg-[#F5F5F5] p-8 flex-1 flex flex-col justify-center min-h-0 animate-fade-slide-in-right">
      <h2 className="text-3xl font-bold text-black mb-2">
        Garantía Speakers{" "}
        <span className="font-light tracking-widest">PLUS</span>
      </h2>
      <p className="text-lead text-gray-600 mb-8 leading-relaxed">
        Al participar en esta campaña especial tendrás acceso a beneficios
        superiores a nuestra garantía estándar:
      </p>

      <ul className="space-y-6">
        <li className="flex gap-3">
          <ArrowRightIcon className="text-black shrink-0 flex items-center" width={24} height={24} />
          <span className="text-lg text-black leading-snug">
            Shortlist{" "}
            <span className="line-through text-gray-400">
              en menos de 24 horas
            </span>{" "}
            <strong>instantáneo</strong>
          </span>
        </li>
        <li className="flex gap-3">
          <ArrowRightIcon className="text-black shrink-0 flex items-center" width={24} height={24} />
          <span className="text-lg text-black leading-snug">
            Prioridad de agenda{" "}
            <strong className="underline">Q1</strong> para eventos
            corporativos.
          </span>
        </li>
        <li className="flex gap-3">
          <ArrowRightIcon className="text-black shrink-0 flex items-center" width={24} height={24} />
          <span className="text-lg text-black leading-snug">
            Agenda un speaker con el{" "}
            <span className="line-through text-gray-400">50%</span>{" "}
            <strong>25%</strong> del precio de cotización
          </span>
        </li>
      </ul>
    </div>
  );
}
