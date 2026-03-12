"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DayPicker, useDayPicker, UI } from "react-day-picker";
import { es } from "react-day-picker/locale";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

function CalendarIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 transition-colors duration-150 ${
        open ? "text-black" : "text-gray-400"
      }`}
    >
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="12"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M1.5 6.5h13"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M5 1v3M11 1v3"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
      <rect x="4" y="9" width="1.75" height="1.75" fill="currentColor" />
      <rect x="7.125" y="9" width="1.75" height="1.75" fill="currentColor" />
      <rect x="10.25" y="9" width="1.75" height="1.75" fill="currentColor" />
      <rect x="4" y="11.75" width="1.75" height="1.75" fill="currentColor" />
      <rect x="7.125" y="11.75" width="1.75" height="1.75" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ orientation }: { orientation: "left" | "right" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transform: orientation === "left" ? "rotate(180deg)" : undefined,
      }}
    >
      <path
        d="M4.5 2.5L8 6L4.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** Nav que incluye el mes/año (caption) dentro de la barra de navegación */
function NavWithCaption(props: {
  onPreviousClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onNextClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  previousMonth?: Date;
  nextMonth?: Date;
} & React.HTMLAttributes<HTMLElement>) {
  const { onPreviousClick, onNextClick, previousMonth, nextMonth, ...navProps } = props;
  const {
    components,
    classNames,
    formatters,
    months,
    labels: { labelPrevious, labelNext },
    dayPickerProps,
  } = useDayPicker();

  const handleNextClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (nextMonth) onNextClick?.(e);
    },
    [nextMonth, onNextClick]
  );
  const handlePreviousClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (previousMonth) onPreviousClick?.(e);
    },
    [previousMonth, onPreviousClick]
  );

  const currentDate = months[0]?.date;
  const locale = dayPickerProps?.locale;
  const options = locale?.code ? { locale: locale as typeof locale & { code: string } } : undefined;
  const caption = currentDate
    ? formatters.formatCaption(currentDate, options as Parameters<typeof formatters.formatCaption>[1], undefined)
    : "";

  return (
    <nav {...navProps}>
      <components.PreviousMonthButton
        type="button"
        className={classNames[UI.PreviousMonthButton]}
        tabIndex={previousMonth ? undefined : -1}
        aria-disabled={previousMonth ? undefined : true}
        aria-label={labelPrevious(previousMonth)}
        onClick={handlePreviousClick}
      >
        <components.Chevron
          disabled={previousMonth ? undefined : true}
          className={classNames[UI.Chevron]}
          orientation="left"
        />
      </components.PreviousMonthButton>
      <span
        className={classNames[UI.CaptionLabel]}
        role="status"
        aria-live="polite"
      >
        {caption}
      </span>
      <components.NextMonthButton
        type="button"
        className={classNames[UI.NextMonthButton]}
        tabIndex={nextMonth ? undefined : -1}
        aria-disabled={nextMonth ? undefined : true}
        aria-label={labelNext(nextMonth)}
        onClick={handleNextClick}
      >
        <components.Chevron
          disabled={nextMonth ? undefined : true}
          className={classNames[UI.Chevron]}
          orientation="right"
        />
      </components.NextMonthButton>
    </nav>
  );
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + "T12:00:00") : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const updatePosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 3, left: rect.left, width: rect.width });
  }, []);
  useEffect(() => {
    if (!open) {
      const id = requestAnimationFrame(() => setDropdownPosition(null));
      return () => cancelAnimationFrame(id);
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const displayValue = selected
    ? new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(selected)
    : "";

  return (
    <div ref={ref} className="relative flex-1">
      {/* Trigger input */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
          if (e.key === "Escape") setOpen(false);
        }}
        className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-colors duration-150 select-none focus:outline-none ${
          open
            ? "border-black"
            : "border-gray-300 hover:border-gray-500"
        }`}
      >
        <span
          className={`flex-1 text-left text-sm leading-none ${
            displayValue ? "text-black" : "text-gray-400"
          }`}
        >
          {displayValue || "Selecciona una fecha"}
        </span>
        <CalendarIcon open={open} />
      </div>

      {/* Calendar dropdown: portal to body to escape stacking context from animate-fade-slide-in */}
      {open &&
        dropdownPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-9999 bg-white border border-black min-w-0 overflow-hidden overflow-y-auto max-h-[70vh]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              animation: "dpSlideIn 0.14s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <style>{`
            @keyframes dpSlideIn {
              from { opacity: 0; transform: translateY(-5px); }
              to   { opacity: 1; transform: translateY(0);    }
            }
            /* caption: mes/año al mismo nivel que los botones (h-7 = 28px) */
            .rdp-month_caption {
              display: flex !important;
              align-items: center !important;
              align-content: center !important;
              height: 28px !important;
              min-height: 28px !important;
            }
            .rdp-month_caption .rdp-nav {
              height: 28px !important;
              display: inline-flex !important;
              align-items: center !important;
            }
            .rdp-caption_label {
              margin: 0 !important;
              padding: 0 !important;
              display: inline-flex !important;
              align-items: center !important;
              height: 28px !important;
              line-height: 1 !important;
              font-size: 11px !important;
              vertical-align: middle !important;
            }
            /* today dot */
            .rdp-day[data-today="true"] .rdp-day_button::after {
              content: "";
              position: absolute;
              bottom: 3px;
              left: 50%;
              transform: translateX(-50%);
              width: 3px;
              height: 3px;
              background: currentColor;
              border-radius: 50%;
            }
            .rdp-day[data-today="true"][data-selected="true"] .rdp-day_button::after {
              background: white;
            }
          `}</style>

          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected ?? today}
            onSelect={(date) => {
              if (date) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                onChange(`${y}-${m}-${d}`);
                setOpen(false);
              }
            }}
            disabled={{ before: today }}
            locale={es}
            components={{
              Chevron: (props) => <ChevronIcon orientation={props.orientation === "left" ? "left" : "right"} />,
              Nav: NavWithCaption,
              MonthCaption: () => <></>,
            }}
            classNames={{
              root: "p-5 select-none w-full min-w-0",
              months: "w-full min-w-0",
              month: "w-full min-w-0",
              month_caption: "hidden",
              caption_label:
                "flex-1 h-7 inline-flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.18em] text-black leading-none",
              nav: "flex flex-row items-center justify-between gap-2 mb-4 h-7 w-full",
              button_previous:
                "w-7 h-7 flex items-center justify-center border border-r-0 border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all duration-150 cursor-pointer shrink-0",
              button_next:
                "w-7 h-7 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all duration-150 cursor-pointer shrink-0",
              month_grid: "w-full min-w-0 border-collapse",
              weekdays: "flex w-full border-b border-gray-100 mb-1",
              weekday:
                "flex-1 min-w-0 h-8 flex items-center justify-center text-[9px] font-bold tracking-[0.12em] text-gray-400 uppercase",
              weeks: "w-full min-w-0",
              week: "flex w-full",
              day: "flex-1 min-w-0 h-[42px] p-0 relative min-w-0",
              day_button: [
                "w-full h-full relative flex items-center justify-center",
                "text-[13px] font-medium",
                "transition-colors duration-100 cursor-pointer",
                /* default hover */
                "hover:bg-gray-100",
                /* selected */
                "data-[selected]:bg-black data-[selected]:text-white data-[selected]:hover:bg-black data-[selected]:font-bold",
                /* disabled */
                "data-[disabled]:text-gray-200 data-[disabled]:cursor-not-allowed data-[disabled]:hover:bg-transparent",
                /* outside month */
                "data-[outside]:text-gray-300 data-[outside]:hover:bg-transparent data-[outside]:cursor-default",
              ].join(" "),
            }}
          />
          </div>,
          document.body
        )}
    </div>
  );
}
