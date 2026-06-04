import type { ConfirmFieldValue } from "@/types/document-confirm";

export function confirmedFieldHasValue(field: ConfirmFieldValue): boolean {
  return !field.unknown && field.value.trim().length > 0;
}

export function readConfirmedFieldValue(field: ConfirmFieldValue): string | null {
  if (!confirmedFieldHasValue(field)) {
    return null;
  }

  return field.value.trim();
}
