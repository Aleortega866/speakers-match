"use client";

import { memo } from "react";

interface RadioOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

// rerender-memo: componente de presentacion puro — evita re-renders en cadena al seleccionar opciones
function RadioOption({
  label,
  value,
  selected,
  onSelect,
}: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="flex items-center gap-3 w-full text-left py-3 px-4 border border-gray-200 hover:border-black transition-all duration-150 hover:scale-[1.01] cursor-pointer group"
    >
      <div
        className={`
          w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
          ${selected ? "border-black bg-black" : "border-gray-400 bg-white group-hover:border-black"}
        `}
      >
        {selected && (
          <div className="w-2 h-2 rounded-full bg-white" />
        )}
      </div>
      <span className="text-sm text-black leading-snug">{label}</span>
    </button>
  );
}

export default memo(RadioOption);
