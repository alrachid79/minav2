import type { EntityIntegrationSummary } from "@/types/document-confirm";

interface DocumentIntegrationSuccessProps {
  entities: EntityIntegrationSummary;
  onUploadAnother?: () => void;
}

function EntityLinkRow({
  label,
  linked,
  created,
  name,
}: {
  label: string;
  linked: boolean;
  created: boolean;
  name: string | null;
}) {
  if (!linked) {
    return (
      <div className="flex flex-col gap-0.5 border-b border-[#0F172A]/6 py-2 last:border-b-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          {label}
        </dt>
        <dd className="text-sm text-[#6B7280]">Not linked</dd>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 border-b border-[#0F172A]/6 py-2 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[#0F172A]">
        {created ? `${label} linked (created)` : `${label} linked`}
      </dd>
      {name ? <dd className="text-sm text-[#6B7280]">{name}</dd> : null}
    </div>
  );
}

export function DocumentIntegrationSuccess({
  entities,
  onUploadAnother,
}: DocumentIntegrationSuccessProps) {
  return (
    <div className="rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/5 px-6 py-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#14B8A6]/15">
        <span className="text-lg font-bold text-[#14B8A6]" aria-hidden>
          ✓
        </span>
      </div>
      <h2 className="text-lg font-semibold text-[#0F172A]">
        Document confirmed and ready for Mina intelligence.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
        Shared entities are linked. Timeline and dashboard connections will be
        added in the next checkpoints.
      </p>

      <dl className="mt-5 space-y-1 rounded-xl border border-[#0F172A]/8 bg-white px-4 py-3">
        <EntityLinkRow
          label="Collector"
          linked={entities.collectorLinked}
          created={entities.collectorCreated}
          name={entities.collectorName}
        />
        <EntityLinkRow
          label="Creditor"
          linked={entities.creditorLinked}
          created={entities.creditorCreated}
          name={entities.creditorName}
        />
        <EntityLinkRow
          label="Debt situation"
          linked={entities.debtSituationLinked}
          created={entities.debtSituationCreated}
          name={entities.debtSituationLabel}
        />
      </dl>

      {entities.debtSituationCreated ? (
        <p className="mt-4 text-sm font-medium text-[#0F172A]">
          Debt situation created
        </p>
      ) : entities.debtSituationLinked ? (
        <p className="mt-4 text-sm font-medium text-[#0F172A]">
          Existing debt situation linked
        </p>
      ) : null}

      {onUploadAnother ? (
        <button
          type="button"
          onClick={onUploadAnother}
          className="mt-6 min-h-[44px] rounded-lg border border-[#0F172A]/15 bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC]"
        >
          Upload another document
        </button>
      ) : null}
    </div>
  );
}
