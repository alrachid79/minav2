"use client";

import { LETTER_TYPE_LABELS } from "@/lib/letters/constants";
import { LETTER_TYPES, type LetterType } from "@/types/letters";

interface LetterTypeSelectorProps {
  value: LetterType;
  onChange: (value: LetterType) => void;
  templateNames: Map<LetterType, string>;
}

export function LetterTypeSelector({
  value,
  onChange,
  templateNames,
}: LetterTypeSelectorProps) {
  return (
    <div className="grid gap-3">
      {LETTER_TYPES.map((letterType) => {
        const isSelected = value === letterType;
        const label = templateNames.get(letterType) ?? LETTER_TYPE_LABELS[letterType];

        return (
          <button
            key={letterType}
            type="button"
            onClick={() => onChange(letterType)}
            className={`rounded-xl border px-4 py-4 text-left transition ${
              isSelected
                ? "border-[#14B8A6] bg-[#F0FDFA] ring-2 ring-[#14B8A6]/30"
                : "border-[#0F172A]/10 bg-white hover:border-[#0F172A]/20"
            }`}
          >
            <span className="block text-sm font-semibold text-[#0F172A]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
