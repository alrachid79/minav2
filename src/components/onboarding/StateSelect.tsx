import { US_STATE_CODES } from "@/lib/onboarding/schemas";

interface StateSelectProps {
  value: string | null;
  onChange: (value: string) => void;
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  AS: "American Samoa",
  GU: "Guam",
  MP: "Northern Mariana Islands",
  PR: "Puerto Rico",
  VI: "U.S. Virgin Islands",
};

export function StateSelect({ value, onChange }: StateSelectProps) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-h-[52px] appearance-none rounded-xl border border-[#0F172A]/10 bg-white px-4 py-3 pr-10 text-base font-medium text-[#111827] shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30"
      >
        <option value="" disabled>
          Select your state
        </option>
        {US_STATE_CODES.map((code) => (
          <option key={code} value={code}>
            {STATE_NAMES[code] ?? code}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6B7280]"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}
