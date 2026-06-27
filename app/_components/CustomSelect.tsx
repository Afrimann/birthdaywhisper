"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`select-trigger w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-left min-h-[44px] touch-manipulation ${
          open ? "select-trigger-open" : ""
        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`text-sm truncate ${selected ? "text-cream" : "text-ghost"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-gold" : "text-stone"
          }`}
        />
      </button>

      {open && (
        <div className="select-dropdown absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden">
          <div role="listbox" className="select-list max-h-52 overflow-y-auto py-1">
            {options.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{ animationDelay: `${Math.min(i * 14, 160)}ms` }}
                className={`select-option w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  opt.value === value
                    ? "text-gold bg-[rgba(200,88,28,0.08)]"
                    : "text-brown hover:text-[#E06B28] hover:bg-[rgba(200,88,28,0.1)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
