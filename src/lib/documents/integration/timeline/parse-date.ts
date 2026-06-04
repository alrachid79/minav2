const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function toUtcNoonIso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString();
}

function parseNumericDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  let year = Number(match[3]);

  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }

  if (month < 0 || month > 11 || day < 1 || day > 31) {
    return null;
  }

  return toUtcNoonIso(year, month, day);
}

function parseMonthNameDate(value: string): string | null {
  const match = value
    .trim()
    .match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);

  if (!match) {
    return null;
  }

  const month = MONTHS[match[1].toLowerCase()];

  if (month === undefined) {
    return null;
  }

  const day = Number(match[2]);
  const year = Number(match[3]);

  if (day < 1 || day > 31) {
    return null;
  }

  return toUtcNoonIso(year, month, day);
}

export function parseTimelineDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return parseNumericDate(value) ?? parseMonthNameDate(value);
}

export function isFutureTimelineDate(isoDate: string, reference = new Date()): boolean {
  return new Date(isoDate).getTime() > reference.getTime();
}
