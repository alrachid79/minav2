interface SituationNextActionCardProps {
  nextBestAction: string;
}

export function SituationNextActionCard({ nextBestAction }: SituationNextActionCardProps) {
  return (
    <section className="rounded-2xl border border-[#22C55E]/25 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#22C55E]">
        Next best action
      </p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white">{nextBestAction}</p>
    </section>
  );
}
