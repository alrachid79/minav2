import type { RecoveryStage } from "@/types/onboarding";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentType } from "@/lib/documents/intelligence/types";

const RECOVERY_STAGE_ORDER: RecoveryStage[] = [
  "stabilize",
  "understand",
  "protect",
  "act",
  "resolve",
  "recover",
];

export interface RecoveryStageUpdateProposal {
  proposedStage: RecoveryStage;
  stageReason: string;
}

export function compareRecoveryStages(
  left: RecoveryStage,
  right: RecoveryStage,
): number {
  return RECOVERY_STAGE_ORDER.indexOf(left) - RECOVERY_STAGE_ORDER.indexOf(right);
}

function isProtectStageDocument(documentType: DocumentType): boolean {
  return documentType === "court_lawsuit_notice";
}

export function proposeRecoveryStageUpdate(input: {
  confirmedData: DocumentConfirmedData;
}): RecoveryStageUpdateProposal | null {
  if (isProtectStageDocument(input.confirmedData.document_type)) {
    return {
      proposedStage: "protect",
      stageReason:
        "Confirmed a court or lawsuit notice during document integration.",
    };
  }

  if (input.confirmedData.legal_attention_required) {
    return {
      proposedStage: "protect",
      stageReason:
        "Confirmed a document flagged for legal attention during document integration.",
    };
  }

  return null;
}

export function shouldApplyRecoveryStageUpdate(input: {
  currentStage: RecoveryStage;
  proposedStage: RecoveryStage;
}): boolean {
  return compareRecoveryStages(input.proposedStage, input.currentStage) > 0;
}
