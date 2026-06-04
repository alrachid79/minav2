"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AnalysisResultsContent } from "@/components/onboarding/analysis/AnalysisResultsContent";
import { MinaReflection } from "@/components/onboarding/MinaReflection";
import { OnboardingScreenContent } from "@/components/onboarding/OnboardingScreenContent";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { SignupHandoffView } from "@/components/onboarding/SignupHandoffView";
import { generateOnboardingAnalysis } from "@/lib/onboarding/analysis";
import {
  ANALYSIS_INTERSTITIAL_SCREEN,
  getMinaReflectionForOption,
  getOnboardingScreen,
  ONBOARDING_SECTION_LABELS,
  SIGNUP_HANDOFF_SCREEN,
  SITUATION_TYPE_SCREEN,
  type OnboardingSection,
  WELCOME_SCREEN,
} from "@/lib/onboarding/questions";
import {
  calculateOnboardingProgress,
  getAnalysisResultsScreenIds,
  getVisibleScreenIds,
  isOnboardingQuestionFlowComplete,
} from "@/lib/onboarding/progress";
import {
  getResultScreenMeta,
  isAnalysisResultScreen,
} from "@/lib/onboarding/resultScreens";
import {
  applyScreenValue,
  buildFinancialSnapshotAnswer,
  buildSeverityAnswer,
  buildSituationTypeAnswer,
  buildStressProfileAnswer,
  createEmptyDrafts,
  getSectionIntroReflection,
  isFirstScreenInSection,
  readScreenValue,
  type ScreenDraftAnswers,
  validateScreenValue,
} from "@/lib/onboarding/screenAnswers";
import {
  clearGuestAnalysisResults,
  getOrCreateGuestSession,
  saveGuestSession,
  setGuestAnalysisResults,
  setGuestStepAnswer,
} from "@/lib/onboarding/session";
import type {
  CurrentSituationReason,
  GuestOnboardingSession,
  OnboardingAnswers,
  StressSliderValue,
} from "@/types/onboarding";

const SIGNUP_SCREEN_ID = SIGNUP_HANDOFF_SCREEN.id;
const ANALYSIS_LOADING_MS = 2800;

function getQuestionFlowScreenIds(answers: OnboardingAnswers): string[] {
  return getVisibleScreenIds(answers).filter(
    (screenId) =>
      screenId !== SIGNUP_SCREEN_ID &&
      screenId !== ANALYSIS_INTERSTITIAL_SCREEN.id &&
      !isAnalysisResultScreen(screenId),
  );
}

function getFullFlowScreenIds(answers: OnboardingAnswers): string[] {
  return [
    ...getQuestionFlowScreenIds(answers),
    ANALYSIS_INTERSTITIAL_SCREEN.id,
    ...getAnalysisResultsScreenIds(),
    SIGNUP_SCREEN_ID,
  ];
}

function getFlowNextScreenId(
  currentScreenId: string,
  answers: OnboardingAnswers,
): string | null {
  const visibleScreens = getFullFlowScreenIds(answers);
  const currentIndex = visibleScreens.indexOf(currentScreenId);

  if (currentIndex === -1) {
    return visibleScreens[0] ?? null;
  }

  return visibleScreens[currentIndex + 1] ?? null;
}

function getFlowPreviousScreenId(
  currentScreenId: string,
  answers: OnboardingAnswers,
): string | null {
  const visibleScreens = getFullFlowScreenIds(answers);
  const currentIndex = visibleScreens.indexOf(currentScreenId);

  if (currentIndex <= 0) {
    return null;
  }

  return visibleScreens[currentIndex - 1] ?? null;
}

function hasSavedAnswerForScreen(
  screenId: string,
  answers: OnboardingAnswers,
): boolean {
  if (screenId === "welcome") {
    return true;
  }

  if (screenId === "current_situation") {
    return Boolean(answers.current_situation?.reason);
  }

  if (screenId === "situation_type") {
    return (answers.situation_type?.categories.length ?? 0) > 0;
  }

  if (screenId.startsWith("situation_follow_up_")) {
    const category = screenId.replace("situation_follow_up_", "");

    if (category === "not_sure") {
      return true;
    }

    if (category === "multiple_debts") {
      return Boolean(answers.situation_type?.most_urgent);
    }

    return Boolean(
      answers.situation_type?.follow_ups?.some(
        (item) => item.category === category,
      ),
    );
  }

  if (screenId.startsWith("severity_")) {
    return Boolean(answers.severity);
  }

  if (screenId.startsWith("financial_")) {
    return Boolean(answers.financial_snapshot);
  }

  if (screenId.startsWith("stress_")) {
    return Boolean(answers.stress_profile);
  }

  return false;
}

function getResumeScreenId(session: GuestOnboardingSession): string {
  if (
    session.analysis &&
    session.pressure_profile &&
    session.recovery_path
  ) {
    return "results_understanding";
  }

  if (isOnboardingQuestionFlowComplete(session.answers)) {
    return ANALYSIS_INTERSTITIAL_SCREEN.id;
  }

  const visibleScreens = getQuestionFlowScreenIds(session.answers);

  for (const screenId of visibleScreens) {
    if (!hasSavedAnswerForScreen(screenId, session.answers)) {
      return screenId;
    }
  }

  return visibleScreens[0] ?? WELCOME_SCREEN.id;
}

function isAnalysisPhase(screenId: string): boolean {
  return (
    screenId === ANALYSIS_INTERSTITIAL_SCREEN.id ||
    isAnalysisResultScreen(screenId)
  );
}

function isSignupHandoff(screenId: string): boolean {
  return screenId === SIGNUP_SCREEN_ID;
}

function getHeroContextMessage(
  section: OnboardingSection,
  screenId: string,
): string {
  const resultMeta = getResultScreenMeta(screenId);
  if (resultMeta) {
    return resultMeta.heroMessage;
  }

  if (screenId === ANALYSIS_INTERSTITIAL_SCREEN.id) {
    return "Reviewing what you shared — no judgment, just clarity.";
  }

  const sectionMessages: Record<OnboardingSection, string> = {
    welcome: "Take a breath. We'll walk through this together.",
    situation: "Every situation is different — choose what feels closest.",
    severity:
      "These questions help us understand urgency — 'Not sure' is always okay.",
    financial:
      "Ballpark ranges are enough. This helps us understand your flexibility.",
    stress: "Your feelings matter here. This shapes how Mina supports you.",
    results: "Your picture is coming together.",
    signup: "Save your progress when you're ready.",
  };

  const screenOverrides: Record<string, string> = {
    current_situation:
      "Every situation is different — choose what feels closest.",
    situation_type: "Select all that apply. There's no wrong answer here.",
    severity_uncertainty:
      "Uncertainty is normal. Naming it is the first step toward clarity.",
    stress_recovery_goals:
      "Choose what progress would feel meaningful to you right now.",
  };

  return screenOverrides[screenId] ?? sectionMessages[section];
}

function resolveReflection(
  screenId: string,
  value: string | string[] | number | null,
): string | null {
  const screen = getOnboardingScreen(screenId);
  if (!screen) {
    return null;
  }

  if (screenId === "current_situation" && typeof value === "string") {
    return getMinaReflectionForOption(screenId, value) ?? null;
  }

  if (screenId === "situation_type" && Array.isArray(value) && value.length > 0) {
    return SITUATION_TYPE_SCREEN.minaReflection ?? null;
  }

  if (
    screenId === "severity_currently_sued" &&
    (value === "yes" || value === "not_sure")
  ) {
    return screen.minaReflection ?? null;
  }

  if (
    screenId === "severity_uncertainty" &&
    Array.isArray(value) &&
    value.length > 0
  ) {
    return screen.minaReflection ?? null;
  }

  if (screenId === "financial_emergency_savings" && typeof value === "string") {
    return screen.minaReflection ?? null;
  }

  if (
    screenId === "stress_recovery_goals" &&
    Array.isArray(value) &&
    value.length > 0
  ) {
    return screen.minaReflection ?? null;
  }

  if (screenId === "welcome") {
    return WELCOME_SCREEN.minaReflection ?? null;
  }

  return null;
}

export function OnboardingShell() {
  const [session, setSession] = useState<GuestOnboardingSession | null>(null);
  const [screenId, setScreenId] = useState<string>(WELCOME_SCREEN.id);
  const [drafts, setDrafts] = useState<ScreenDraftAnswers>(createEmptyDrafts());
  const [currentValue, setCurrentValue] = useState<
    string | string[] | number | null
  >(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [sectionIntro, setSectionIntro] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const syncSession = useCallback((next: GuestOnboardingSession) => {
    saveGuestSession(next);
    setSession(next);
  }, []);

  const navigateToScreen = useCallback(
    (
      nextScreenId: string,
      answers: OnboardingAnswers,
      draftsState: ScreenDraftAnswers,
    ) => {
      const questionScreen = getOnboardingScreen(nextScreenId);
      const visibleQuestionScreens = getQuestionFlowScreenIds(answers);
      const value = readScreenValue(nextScreenId, answers, draftsState);

      setScreenId(nextScreenId);
      setCurrentValue(value);
      setReflection(resolveReflection(nextScreenId, value));
      setError(null);

      if (
        questionScreen &&
        isFirstScreenInSection(nextScreenId, visibleQuestionScreens) &&
        questionScreen.section !== "welcome" &&
        questionScreen.section !== "situation"
      ) {
        setSectionIntro(getSectionIntroReflection(questionScreen.section));
      } else {
        setSectionIntro(null);
      }
    },
    [],
  );

  useEffect(() => {
    const loaded = getOrCreateGuestSession();
    setSession(loaded);
    navigateToScreen(getResumeScreenId(loaded), loaded.answers, createEmptyDrafts());
    setHydrated(true);
  }, [navigateToScreen]);

  useEffect(() => {
    if (!session || screenId !== ANALYSIS_INTERSTITIAL_SCREEN.id) {
      return;
    }

    if (session.analysis && session.pressure_profile && session.recovery_path) {
      setScreenId("results_understanding");
      return;
    }

    const timer = window.setTimeout(() => {
      try {
        const results = generateOnboardingAnalysis(session.answers);
        const nextSession = setGuestAnalysisResults(results);
        syncSession(nextSession);
        setScreenId("results_understanding");
        setError(null);
      } catch {
        setError(
          "We couldn't complete your analysis. Please go back and check your answers.",
        );
      }
    }, ANALYSIS_LOADING_MS);

    return () => window.clearTimeout(timer);
  }, [screenId, session, syncSession]);

  const questionScreen = getOnboardingScreen(screenId);
  const resultMeta = getResultScreenMeta(screenId);
  const inAnalysisPhase = isAnalysisPhase(screenId);
  const inHandoff = isSignupHandoff(screenId);
  const handoffScreen = inHandoff ? SIGNUP_HANDOFF_SCREEN : null;
  const answers = session?.answers ?? {};

  const progress = useMemo(() => {
    const visibleScreens = getFullFlowScreenIds(answers);
    const currentIndex = Math.max(visibleScreens.indexOf(screenId), 0);
    const totalScreens = visibleScreens.length;
    const percentComplete =
      totalScreens <= 1
        ? 0
        : Math.round((currentIndex / (totalScreens - 1)) * 100);
    const base = calculateOnboardingProgress(screenId, answers);

    return {
      currentStep: currentIndex + 1,
      totalSteps: totalScreens,
      percentComplete,
      sectionLabel: inHandoff
        ? ONBOARDING_SECTION_LABELS.signup
        : inAnalysisPhase
          ? ONBOARDING_SECTION_LABELS.results
          : ONBOARDING_SECTION_LABELS[base.section],
    };
  }, [screenId, answers, inAnalysisPhase, inHandoff]);

  const heroMessage = useMemo(() => {
    if (resultMeta) {
      return resultMeta.heroMessage;
    }

    if (inHandoff) {
      return "Your onboarding is ready to save — create an account or log in.";
    }

    const section = questionScreen?.section ?? "results";
    return getHeroContextMessage(section, screenId);
  }, [questionScreen, screenId, resultMeta, inHandoff]);

  const displayTitle =
    screenId === ANALYSIS_INTERSTITIAL_SCREEN.id
      ? "Mina is reviewing your situation"
      : (resultMeta?.title ??
        handoffScreen?.title ??
        questionScreen?.title ??
        "");

  const displaySubtitle =
    screenId === ANALYSIS_INTERSTITIAL_SCREEN.id
      ? "Based on what you shared, Mina is building a clear picture."
      : (resultMeta?.subtitle ??
        handoffScreen?.subtitle ??
        questionScreen?.subtitle);

  function updateCurrentValue(next: string | string[] | number) {
    setCurrentValue(next);
    setError(null);
    setReflection(resolveReflection(screenId, next));
  }

  function handleSingleSelect(value: string) {
    updateCurrentValue(value);
  }

  function handleMultiToggle(value: string) {
    const existing = Array.isArray(currentValue) ? currentValue : [];

    if (screenId === "stress_recovery_goals") {
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : existing.length >= 3
          ? existing
          : [...existing, value];
      updateCurrentValue(next);
      return;
    }

    if (screenId === "severity_uncertainty" && value === "none_mostly_understand") {
      updateCurrentValue(["none_mostly_understand"]);
      return;
    }

    if (screenId === "severity_uncertainty" && existing.includes("none_mostly_understand")) {
      updateCurrentValue([value]);
      return;
    }

    const next = existing.includes(value)
      ? existing.filter((item) => item !== value)
      : [...existing, value];
    updateCurrentValue(next);
  }

  function handleSliderChange(value: StressSliderValue) {
    updateCurrentValue(value);
  }

  function handleStateChange(value: string) {
    updateCurrentValue(value);
  }

  function persistSituationType(
    nextAnswers: OnboardingAnswers,
    nextDrafts: ScreenDraftAnswers,
  ) {
    const situationType = buildSituationTypeAnswer(nextAnswers, nextDrafts);
    return setGuestStepAnswer("situation_type", situationType);
  }

  function handleBack() {
    if (!session) {
      return;
    }

    if (screenId === "results_understanding") {
      const cleared = clearGuestAnalysisResults();
      syncSession(cleared);
      navigateToScreen("stress_recovery_goals", cleared.answers, drafts);
      return;
    }

    const previousScreenId = getFlowPreviousScreenId(screenId, session.answers);

    if (!previousScreenId) {
      return;
    }

    navigateToScreen(previousScreenId, session.answers, drafts);
  }

  function handlePrimaryAction() {
    if (!session) {
      return;
    }

    if (screenId === "results_complete") {
      navigateToScreen(SIGNUP_SCREEN_ID, session.answers, drafts);
      return;
    }

    if (isSignupHandoff(screenId)) {
      return;
    }

    if (isAnalysisResultScreen(screenId)) {
      const nextScreenId = getFlowNextScreenId(screenId, session.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, session.answers, drafts);
      }
      return;
    }

    if (screenId === ANALYSIS_INTERSTITIAL_SCREEN.id) {
      return;
    }

    if (!questionScreen) {
      return;
    }

    const validationError = validateScreenValue(screenId, currentValue);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    let nextDrafts = drafts;
    let nextSession = session;

    if (screenId === "welcome") {
      const nextScreenId = getFlowNextScreenId(screenId, session.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, session.answers, drafts);
      }
      return;
    }

    if (screenId === "current_situation") {
      nextSession = setGuestStepAnswer("current_situation", {
        reason: currentValue as CurrentSituationReason,
      });
      syncSession(nextSession);
      const nextScreenId = getFlowNextScreenId(screenId, nextSession.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, nextSession.answers, drafts);
      }
      return;
    }

    if (
      screenId === "situation_type" ||
      screenId.startsWith("situation_follow_up_")
    ) {
      nextDrafts = applyScreenValue(
        screenId,
        currentValue as string | string[],
        drafts,
      );
      setDrafts(nextDrafts);
      nextSession = persistSituationType(nextSession.answers, nextDrafts);
      syncSession(nextSession);

      const nextScreenId = getFlowNextScreenId(screenId, nextSession.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, nextSession.answers, nextDrafts);
      }
      return;
    }

    if (screenId.startsWith("severity_")) {
      nextDrafts = applyScreenValue(
        screenId,
        currentValue as string | string[],
        drafts,
      );
      setDrafts(nextDrafts);

      if (screenId === "severity_uncertainty") {
        const severity = buildSeverityAnswer(nextSession.answers, nextDrafts);
        nextSession = setGuestStepAnswer("severity", severity);
        syncSession(nextSession);
      }

      const nextScreenId = getFlowNextScreenId(screenId, nextSession.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, nextSession.answers, nextDrafts);
      }
      return;
    }

    if (screenId.startsWith("financial_")) {
      nextDrafts = applyScreenValue(
        screenId,
        currentValue as string | string[],
        drafts,
      );
      setDrafts(nextDrafts);

      if (screenId === "financial_debt_count") {
        const financial = buildFinancialSnapshotAnswer(
          nextSession.answers,
          nextDrafts,
        );
        nextSession = setGuestStepAnswer("financial_snapshot", financial);
        syncSession(nextSession);
      }

      const nextScreenId = getFlowNextScreenId(screenId, nextSession.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, nextSession.answers, nextDrafts);
      }
      return;
    }

    if (screenId.startsWith("stress_")) {
      nextDrafts = applyScreenValue(
        screenId,
        currentValue as string | number | string[],
        drafts,
      );
      setDrafts(nextDrafts);

      if (screenId === "stress_recovery_goals") {
        const stressProfile = buildStressProfileAnswer(nextDrafts);
        nextSession = setGuestStepAnswer("stress_profile", stressProfile);
        syncSession(nextSession);
        navigateToScreen(ANALYSIS_INTERSTITIAL_SCREEN.id, nextSession.answers, nextDrafts);
        return;
      }

      const nextScreenId = getFlowNextScreenId(screenId, nextSession.answers);
      if (nextScreenId) {
        navigateToScreen(nextScreenId, nextSession.answers, nextDrafts);
      }
    }
  }

  if (!hydrated || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4">
        <p className="text-sm text-white/70">Loading...</p>
      </div>
    );
  }

  const isWelcome = screenId === WELCOME_SCREEN.id;
  const isLoading = screenId === ANALYSIS_INTERSTITIAL_SCREEN.id;
  const showProgress = screenId !== WELCOME_SCREEN.id;
  const showBack =
    !isLoading &&
    !inHandoff &&
    getFlowPreviousScreenId(screenId, session.answers) !== null;

  const primaryLabel =
    screenId === WELCOME_SCREEN.id
      ? "Let's begin"
      : (resultMeta?.primaryLabel ?? "Continue");

  const showFooter = !isLoading && !inHandoff;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="bg-[#0F172A] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A017]/15 text-sm font-bold text-[#D4A017]"
                  aria-hidden
                >
                  M
                </span>
                <span className="text-xl font-semibold tracking-tight text-white">
                  Mina
                </span>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#D4A017]">
                Financial Pressure Intelligence
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#14B8A6] transition hover:bg-white/5 hover:text-white"
            >
              Log in
            </Link>
          </div>

          <p className="mb-6 max-w-[32ch] text-[15px] leading-relaxed text-white/80">
            {heroMessage}
          </p>

          {showProgress ? (
            <ProgressBar
              currentStep={progress.currentStep}
              totalSteps={progress.totalSteps}
              percentComplete={progress.percentComplete}
              sectionLabel={progress.sectionLabel}
              variant="dark"
            />
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-white/50">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D4A017]" />
              About 5–8 minutes · Private · No account required
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-[480px] px-4 sm:px-6">
        <div className="-mt-5 rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.08),0_8px_32px_rgba(15,23,42,0.06)] sm:-mt-6">
          <main className="flex flex-col px-5 py-7 sm:px-7 sm:py-9">
            {!isLoading ? (
              <div className="mb-7 space-y-3 sm:mb-8">
                <h1
                  className={`font-semibold leading-tight tracking-tight text-[#0F172A] ${
                    isWelcome
                      ? "text-[1.75rem] sm:text-[2rem]"
                      : "text-2xl sm:text-[1.75rem]"
                  }`}
                >
                  {displayTitle}
                </h1>
                {displaySubtitle ? (
                  <p className="max-w-[36ch] text-base leading-relaxed text-[#6B7280]">
                    {displaySubtitle}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-1 flex-col gap-6 sm:gap-7">
              {inHandoff ? (
                <SignupHandoffView initialConsents={session.consents} />
              ) : inAnalysisPhase ? (
                <AnalysisResultsContent screenId={screenId} session={session} />
              ) : (
                <>
                  {sectionIntro ? (
                    <MinaReflection message={sectionIntro} />
                  ) : null}

                  {isWelcome && WELCOME_SCREEN.minaReflection ? (
                    <MinaReflection message={WELCOME_SCREEN.minaReflection} />
                  ) : null}

                  {questionScreen ? (
                    <OnboardingScreenContent
                      screen={questionScreen}
                      value={currentValue}
                      onSingleSelect={handleSingleSelect}
                      onMultiToggle={handleMultiToggle}
                      onSliderChange={handleSliderChange}
                      onStateChange={handleStateChange}
                    />
                  ) : null}

                  {questionScreen?.minaNote ? (
                    <p className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-3 text-sm leading-relaxed text-[#6B7280]">
                      {questionScreen.minaNote}
                    </p>
                  ) : null}

                  {reflection && !isWelcome ? (
                    <MinaReflection message={reflection} />
                  ) : null}
                </>
              )}

              {error ? (
                <p className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
                  {error}
                </p>
              ) : null}
            </div>
          </main>

          {showFooter ? (
            <footer className="border-t border-[#0F172A]/6 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex gap-3">
                {showBack ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="min-h-[48px] flex-1 rounded-lg border border-[#0F172A]/15 bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] transition hover:border-[#0F172A]/25 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
                  >
                    Back
                  </button>
                ) : null}
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="min-h-[48px] flex-1 rounded-lg bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(15,23,42,0.25)] transition hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
              >
                {primaryLabel}
              </button>
              </div>
            </footer>
          ) : null}
        </div>

        <div className="h-6 sm:h-8" aria-hidden />
      </div>
    </div>
  );
}
