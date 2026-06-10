const SITUATION_CATEGORY_LABELS: Record<string, string> = {
  collections: "Collection",
  medical: "Medical bill",
  tax: "Tax balance",
  legal: "Legal case",
  other: "Situation",
};

const SITUATION_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  resolved: "Resolved",
  archived: "Archived",
};

export function formatSituationCategoryLabel(category: string): string {
  return SITUATION_CATEGORY_LABELS[category] ?? "Situation";
}

export function formatSituationStatusLabel(status: string): string {
  return SITUATION_STATUS_LABELS[status] ?? "Active";
}

export function formatSituationName(label: string | null, category: string): string {
  if (label?.trim()) {
    return label.trim();
  }

  return formatSituationCategoryLabel(category);
}
