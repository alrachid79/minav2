import {
  GUEST_SESSION_TTL_DAYS,
  ONBOARDING_SESSION_VERSION,
  type GuestOnboardingSession,
  type GuestSessionLoadResult,
  type OnboardingAnswers,
  type OnboardingConsents,
  type OnboardingStepKey,
  type OnboardingAnalysis,
  type PressureProfile,
  type RecoveryPath,
} from "@/types/onboarding";

import { guestOnboardingSessionSchema } from "@/lib/onboarding/schemas";

export const GUEST_SESSION_STORAGE_KEY = "mina_guest_onboarding_v1";

export const GUEST_PENDING_TRANSFER_STORAGE_KEY =
  "mina_guest_onboarding_pending_transfer_v1";

const DEFAULT_CONSENTS: OnboardingConsents = {
  data_storage: false,
  guidance_disclaimer: false,
};

function assertBrowserStorage(): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Guest onboarding session storage is only available in the browser.",
    );
  }
}

function createGuestSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  throw new Error("crypto.randomUUID is not available in this environment.");
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function isGuestSessionExpired(session: GuestOnboardingSession): boolean {
  return Date.now() >= new Date(session.expires_at).getTime();
}

export function createGuestSession(
  currentStep: GuestOnboardingSession["current_step"] = "welcome",
): GuestOnboardingSession {
  const createdAt = new Date().toISOString();

  return {
    version: ONBOARDING_SESSION_VERSION,
    guest_session_id: createGuestSessionId(),
    created_at: createdAt,
    expires_at: addDays(createdAt, GUEST_SESSION_TTL_DAYS),
    current_step: currentStep,
    answers: {},
    pressure_profile: null,
    recovery_path: null,
    analysis: null,
    consents: { ...DEFAULT_CONSENTS },
    transfer_status: null,
  };
}

function readJsonFromStorage(storage: Storage, key: string): unknown | null {
  const raw = storage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJsonToStorage(
  storage: Storage,
  key: string,
  value: unknown,
): void {
  storage.setItem(key, JSON.stringify(value));
}

function removeFromStorage(storage: Storage, key: string): void {
  storage.removeItem(key);
}

function loadSessionFromStorage(
  storage: Storage,
  key: string,
): GuestSessionLoadResult {
  const parsed = readJsonFromStorage(storage, key);

  if (!parsed) {
    return { session: null, expired: false, invalid: false };
  }

  const result = guestOnboardingSessionSchema.safeParse(parsed);

  if (!result.success) {
    removeFromStorage(storage, key);
    return { session: null, expired: false, invalid: true };
  }

  if (isGuestSessionExpired(result.data)) {
    removeFromStorage(storage, key);
    return { session: null, expired: true, invalid: false };
  }

  return { session: result.data, expired: false, invalid: false };
}

export function loadGuestSession(): GuestSessionLoadResult {
  assertBrowserStorage();
  return loadSessionFromStorage(window.sessionStorage, GUEST_SESSION_STORAGE_KEY);
}

export function saveGuestSession(session: GuestOnboardingSession): void {
  assertBrowserStorage();

  const result = guestOnboardingSessionSchema.safeParse(session);

  if (!result.success) {
    throw new Error("Cannot save invalid guest onboarding session.");
  }

  writeJsonToStorage(
    window.sessionStorage,
    GUEST_SESSION_STORAGE_KEY,
    result.data,
  );
}

export function clearGuestSession(): void {
  assertBrowserStorage();
  removeFromStorage(window.sessionStorage, GUEST_SESSION_STORAGE_KEY);
}

export function getOrCreateGuestSession(): GuestOnboardingSession {
  const { session, expired, invalid } = loadGuestSession();

  if (session) {
    return session;
  }

  if (expired || invalid) {
    clearGuestSession();
  }

  const nextSession = createGuestSession();
  saveGuestSession(nextSession);
  return nextSession;
}

export function updateGuestSession(
  updater: (session: GuestOnboardingSession) => GuestOnboardingSession,
): GuestOnboardingSession {
  const current = getOrCreateGuestSession();
  const next = updater(current);
  saveGuestSession(next);
  return next;
}

export function setGuestCurrentStep(
  step: GuestOnboardingSession["current_step"],
): GuestOnboardingSession {
  return updateGuestSession((session) => ({
    ...session,
    current_step: step,
  }));
}

export function setGuestStepAnswer<K extends OnboardingStepKey>(
  stepKey: K,
  answer: NonNullable<OnboardingAnswers[K]>,
): GuestOnboardingSession {
  return updateGuestSession((session) => ({
    ...session,
    answers: {
      ...session.answers,
      [stepKey]: answer,
    },
  }));
}

export function setGuestAnalysisResults(input: {
  pressure_profile: PressureProfile;
  recovery_path: RecoveryPath;
  analysis: OnboardingAnalysis;
}): GuestOnboardingSession {
  return updateGuestSession((session) => ({
    ...session,
    pressure_profile: input.pressure_profile,
    recovery_path: input.recovery_path,
    analysis: input.analysis,
    current_step: "results",
  }));
}

export function clearGuestAnalysisResults(): GuestOnboardingSession {
  return updateGuestSession((session) => ({
    ...session,
    pressure_profile: null,
    recovery_path: null,
    analysis: null,
  }));
}

export function setGuestConsents(
  consents: OnboardingConsents,
): GuestOnboardingSession {
  return updateGuestSession((session) => ({
    ...session,
    consents,
  }));
}

export function copyGuestSessionToPendingTransfer(): GuestOnboardingSession {
  assertBrowserStorage();

  const { session } = loadGuestSession();

  if (!session) {
    throw new Error("No active guest onboarding session to copy for transfer.");
  }

  const pendingSession: GuestOnboardingSession = {
    ...session,
    transfer_status: "pending",
  };

  writeJsonToStorage(
    window.localStorage,
    GUEST_PENDING_TRANSFER_STORAGE_KEY,
    pendingSession,
  );

  saveGuestSession(pendingSession);
  return pendingSession;
}

export function loadPendingTransferSession(): GuestSessionLoadResult {
  assertBrowserStorage();
  return loadSessionFromStorage(
    window.localStorage,
    GUEST_PENDING_TRANSFER_STORAGE_KEY,
  );
}

export function clearPendingTransferSession(): void {
  assertBrowserStorage();
  removeFromStorage(window.localStorage, GUEST_PENDING_TRANSFER_STORAGE_KEY);
}

export function markGuestTransferCompleted(): void {
  assertBrowserStorage();

  const pending = loadPendingTransferSession();

  if (pending.session) {
    writeJsonToStorage(window.localStorage, GUEST_PENDING_TRANSFER_STORAGE_KEY, {
      ...pending.session,
      transfer_status: "completed",
    });
  }

  updateGuestSession((session) => ({
    ...session,
    transfer_status: "completed",
  }));
}

export function clearAllGuestOnboardingStorage(): void {
  assertBrowserStorage();
  clearGuestSession();
  clearPendingTransferSession();
}

export function hasCompleteGuestAnswers(session: GuestOnboardingSession): boolean {
  const keys: OnboardingStepKey[] = [
    "current_situation",
    "situation_type",
    "severity",
    "financial_snapshot",
    "stress_profile",
  ];

  return keys.every((key) => session.answers[key] !== undefined);
}

export function isGuestReadyForAnalysis(
  session: GuestOnboardingSession,
): boolean {
  return hasCompleteGuestAnswers(session);
}

export function isGuestReadyForSignupHandoff(
  session: GuestOnboardingSession,
): boolean {
  return (
    session.analysis !== null &&
    session.pressure_profile !== null &&
    session.recovery_path !== null &&
    session.consents.data_storage &&
    session.consents.guidance_disclaimer
  );
}
