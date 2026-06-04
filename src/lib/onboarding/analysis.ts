import {
  ONBOARDING_STEP_KEYS,
  type AnalyzeOnboardingResponse,
  type BehaviorPattern,
  type LegalRiskLevel,
  type OnboardingAnalysis,
  type OnboardingAnswers,
  type PressureProfile,
  type RecoveryGoal,
  type RecoveryPath,
  type RecoveryStage,
  type SituationTypeCategory,
  type StressIntensity,
  type SupportStyle,
} from "@/types/onboarding";

import { parseOnboardingAnswersForAnalyze } from "@/lib/onboarding/schemas";
import { SITUATION_TYPE_OPTIONS } from "@/lib/onboarding/questions";

const SITUATION_LABELS: Record<SituationTypeCategory, string> = {
  credit_card: "Credit card debt",
  medical: "Medical bills",
  personal_loan: "Personal loan",
  auto_loan: "Auto loan",
  student_loans: "Student loans",
  mortgage: "Mortgage",
  irs_tax: "IRS / tax debt",
  utilities: "Utilities",
  collections_unknown: "Unknown collections contact",
  multiple_debts: "Multiple debts",
  not_sure: "Uncertain debt situation",
};

const BEHAVIOR_LABELS: Record<BehaviorPattern, string> = {
  avoider: "Avoider",
  analyzer: "Analyzer",
  reactor: "Reactor",
  freezer: "Freezer",
};

const SUPPORT_LABELS: Record<SupportStyle, string> = {
  coach: "Step-by-step coach",
  direct: "Straight facts",
  emotional_first: "Emotional support first",
  educator: "Educational guide",
  accountability: "Accountability partner",
};

const STRESS_LABELS: Record<StressIntensity, string> = {
  low: "Steady",
  medium: "Stretched",
  high: "Heavy",
  critical: "Overwhelming",
};

const STAGE_EXPLANATIONS: Record<RecoveryStage, string> = {
  stabilize:
    "Right now the priority is reducing overwhelm and creating a little breathing room before bigger decisions.",
  understand:
    "You're in a clarity-first phase — understanding what's happening before you commit to a response.",
  protect:
    "Timing and careful responses matter now. The focus is protecting your rights and avoiding rushed moves.",
  act:
    "You have enough context to start taking structured steps — one confident action at a time.",
  resolve:
    "You're moving situations toward closure with deliberate steps rather than reactive fixes.",
  recover:
    "You're rebuilding stability and confidence after an intense period of financial pressure.",
};

interface AnalysisContext {
  answers: OnboardingAnswers;
  stressComposite: number;
  stressIntensity: StressIntensity;
  riskCategory: LegalRiskLevel;
  categories: SituationTypeCategory[];
}

export function computeStressComposite(answers: OnboardingAnswers): number {
  const stress = answers.stress_profile;

  if (!stress) {
    return 3;
  }

  return (
    (stress.emotional_pressure + stress.financial_pressure + stress.legal_pressure) /
    3
  );
}

export function mapStressIntensity(composite: number): StressIntensity {
  if (composite <= 2) {
    return "low";
  }

  if (composite <= 3) {
    return "medium";
  }

  if (composite <= 4) {
    return "high";
  }

  return "critical";
}

function getIrsFollowUpResponse(answers: OnboardingAnswers): string | undefined {
  return answers.situation_type?.follow_ups.find(
    (followUp) => followUp.category === "irs_tax",
  )?.response;
}

function getMortgageFollowUpResponse(
  answers: OnboardingAnswers,
): string | undefined {
  return answers.situation_type?.follow_ups.find(
    (followUp) => followUp.category === "mortgage",
  )?.response;
}

function getMedicalFollowUpResponse(
  answers: OnboardingAnswers,
): string | undefined {
  return answers.situation_type?.follow_ups.find(
    (followUp) => followUp.category === "medical",
  )?.response;
}

export function computeLegalRiskCategory(answers: OnboardingAnswers): LegalRiskLevel {
  const severity = answers.severity;
  const categories = answers.situation_type?.categories ?? [];

  if (!severity) {
    return "medium";
  }

  const garnishment =
    severity.wages_or_bank_affected === "yes_garnishment_or_levy" ||
    severity.wages_or_bank_affected === "yes_unsure_type";

  const served =
    severity.currently_sued === "yes" &&
    (severity.lawsuit_follow_up === "served" ||
      severity.lawsuit_follow_up === "court_date_known");

  const urgentDeadline =
    severity.upcoming_deadlines === "yes" &&
    (severity.deadline_window === "within_2_weeks" ||
      severity.deadline_window === "within_30_days");

  const foreclosureConcern =
    categories.includes("mortgage") &&
    getMortgageFollowUpResponse(answers) === "foreclosure_concern";

  const irsNoticeConcern =
    categories.includes("irs_tax") &&
    (getIrsFollowUpResponse(answers) === "yes" ||
      getIrsFollowUpResponse(answers) === "not_sure");

  if (garnishment || served) {
    return "legal_attention";
  }

  if (
    urgentDeadline &&
    (severity.currently_sued === "yes" ||
      severity.letter_about === "court_or_legal" ||
      foreclosureConcern)
  ) {
    return "legal_attention";
  }

  if (
    severity.currently_sued === "yes" ||
    severity.letter_about === "court_or_legal" ||
    foreclosureConcern ||
    answers.current_situation?.reason === "facing_legal_action"
  ) {
    return "high";
  }

  if (
    irsNoticeConcern ||
    severity.received_letter === "yes" ||
    severity.collector_contact === "yes" ||
    severity.collector_contact_frequency === "frequently"
  ) {
    return "medium";
  }

  if (
    answers.current_situation?.reason === "worried_about_debt" &&
    severity.received_letter === "no" &&
    severity.collector_contact === "no"
  ) {
    return "low";
  }

  return "medium";
}

export function assignRecoveryStage(context: AnalysisContext): RecoveryStage {
  const { answers, stressIntensity, riskCategory, stressComposite } = context;
  const stress = answers.stress_profile;
  const severity = answers.severity;

  if (
    stressIntensity === "critical" ||
    (answers.current_situation?.reason === "not_sure_where_to_start" &&
      (stress?.emotional_pressure ?? 0) >= 4)
  ) {
    return "stabilize";
  }

  if (riskCategory === "legal_attention") {
    return "protect";
  }

  if (
    riskCategory === "high" ||
    answers.current_situation?.reason === "facing_legal_action" ||
    (severity?.collector_contact === "yes" &&
      severity.received_letter === "yes" &&
      !(severity.uncertainty_flags ?? []).includes("none_mostly_understand"))
  ) {
    return context.stressComposite >= 4.1 ? "stabilize" : "protect";
  }

  if (
    stress?.recovery_goals.includes("rebuild_stability") &&
    riskCategory === "low" &&
    stressComposite <= 2.5
  ) {
    return "recover";
  }

  if (
    answers.current_situation?.reason === "behind_on_payments" &&
    riskCategory === "medium" &&
    (stress?.confidence_level ?? 0) >= 4
  ) {
    return "act";
  }

  if (riskCategory === "low" || riskCategory === "medium") {
    return context.stressComposite >= 4.1 ? "stabilize" : "understand";
  }

  return "understand";
}

function buildPressureSources(categories: SituationTypeCategory[]): string[] {
  const labels = categories
    .filter((category) => category !== "not_sure")
    .map((category) => SITUATION_LABELS[category]);

  return labels.length > 0 ? labels : ["General financial pressure"];
}

function buildPressureProfile(context: AnalysisContext): PressureProfile {
  const stress = context.answers.stress_profile!;

  return {
    pressure_sources: buildPressureSources(context.categories),
    stress_intensity: context.stressIntensity,
    stress_label: STRESS_LABELS[context.stressIntensity],
    behavior_pattern: stress.behavior_pattern,
    support_style: stress.support_style,
    summary: `You're carrying ${STRESS_LABELS[context.stressIntensity].toLowerCase()} pressure across ${buildPressureSources(context.categories).join(", ").toLowerCase()}.`,
  };
}

function buildRecoverySteps(
  stage: RecoveryStage,
  goals: RecoveryGoal[],
): RecoveryPath["steps"] {
  const primaryGoal = goals[0];

  const byStage: Record<RecoveryStage, RecoveryPath["steps"]> = {
    stabilize: [
      {
        title: "Pause and breathe",
        description:
          "Take ten minutes to list what's due soon and what's causing the most stress — no decisions yet.",
        is_primary: true,
      },
      {
        title: "Name one priority",
        description: "Choose the single situation that needs attention first.",
        is_primary: false,
      },
      {
        title: "Set a small next check-in",
        description: "Plan when you'll revisit this with a clear head.",
        is_primary: false,
      },
    ],
    understand: [
      {
        title: "Clarify the notice or contact",
        description:
          "Gather the letter, message, or call details so you know exactly what you're responding to.",
        is_primary: true,
      },
      {
        title: "Separate facts from fear",
        description: "Write down what you know, what you don't, and what questions remain.",
        is_primary: false,
      },
      {
        title: "Identify one deadline",
        description: "If a date was mentioned, mark it — even if you're not sure yet.",
        is_primary: false,
      },
    ],
    protect: [
      {
        title: "Confirm time-sensitive items",
        description:
          "Identify any deadlines, court dates, or formal notices that may need prompt attention.",
        is_primary: true,
      },
      {
        title: "Avoid rushed commitments",
        description: "Pause before making payments or agreements you don't fully understand.",
        is_primary: false,
      },
      {
        title: "Prepare questions for support",
        description:
          "List what you need to ask a qualified professional if legal pressure is involved.",
        is_primary: false,
      },
    ],
    act: [
      {
        title: "Choose one response to draft",
        description:
          "Pick a single collector, creditor, or notice to respond to with a clear script or letter.",
        is_primary: true,
      },
      {
        title: "Document what you send",
        description: "Keep a simple record of dates, amounts discussed, and copies of correspondence.",
        is_primary: false,
      },
      {
        title: "Schedule a follow-up",
        description: "Set a reminder to check for replies or next steps.",
        is_primary: false,
      },
    ],
    resolve: [
      {
        title: "Review open situations",
        description: "List what's still active versus what's waiting on a response.",
        is_primary: true,
      },
      {
        title: "Confirm your next milestone",
        description: "Choose one closure step you can complete this week.",
        is_primary: false,
      },
    ],
    recover: [
      {
        title: "Establish a weekly check-in",
        description: "Short, regular reviews beat crisis-mode bursts.",
        is_primary: true,
      },
      {
        title: "Celebrate one stable habit",
        description: "Notice what's already working, even if the path isn't finished.",
        is_primary: false,
      },
    ],
  };

  const steps = byStage[stage].map((step) => ({ ...step }));

  if (primaryGoal === "respond_confidently") {
    steps[0] = {
      ...steps[0],
      description:
        "Prepare one calm response you can use the next time you're contacted.",
      is_primary: true,
    };
  }

  return steps;
}

function buildRecoveryPath(context: AnalysisContext): RecoveryPath {
  const stage = assignRecoveryStage(context);
  const goals = context.answers.stress_profile?.recovery_goals ?? [];

  return {
    current_stage: stage,
    stage_explanation: STAGE_EXPLANATIONS[stage],
    steps: buildRecoverySteps(stage, goals),
  };
}

function buildBiggestRisk(context: AnalysisContext): string {
  const { answers, riskCategory } = context;
  const severity = answers.severity;
  const categories = context.categories;

  if (severity?.wages_or_bank_affected === "yes_garnishment_or_levy") {
    return "Income or bank funds may already be affected. Understanding what's happening and what options you have deserves careful attention soon.";
  }

  if (
    severity?.currently_sued === "yes" &&
    (severity.lawsuit_follow_up === "served" ||
      severity.lawsuit_follow_up === "court_date_known")
  ) {
    return "Active court-related pressure can move quickly. Waiting without understanding the timeline may limit your options.";
  }

  if (
    categories.includes("irs_tax") &&
    (getIrsFollowUpResponse(answers) === "yes" ||
      getIrsFollowUpResponse(answers) === "not_sure")
  ) {
    return "Tax notices often include deadlines and specific response steps. Not knowing what's in the notice can make a stressful situation harder to manage.";
  }

  if (
    categories.includes("mortgage") &&
    getMortgageFollowUpResponse(answers) === "foreclosure_concern"
  ) {
    return "Housing-related pressure can escalate faster than other debts. Understanding where you are in the process matters before you make big decisions.";
  }

  if (severity?.received_letter === "yes" && severity.letter_about === "not_opened_yet") {
    return "An unopened letter may still contain time-sensitive information. Not knowing what's inside can leave you responding blind.";
  }

  if (
    severity?.collector_contact === "yes" &&
    severity.collector_contact_frequency === "frequently"
  ) {
    return "Repeated collector contact can push you toward rushed decisions before you have a clear picture of your options.";
  }

  if (severity?.upcoming_deadlines === "yes") {
    return "A approaching deadline — even one you're unsure about — can narrow your window to respond thoughtfully.";
  }

  if (riskCategory === "low") {
    return "The main risk is staying in worry mode without a plan, which can make small issues feel larger over time.";
  }

  return "Uncertainty about who is contacting you and what happens next can keep you stuck longer than the situation requires.";
}

function buildBiggestOpportunity(context: AnalysisContext): string {
  const { answers } = context;
  const severity = answers.severity;

  if (answers.current_situation?.reason === "letter_received") {
    return "You paused before reacting — that gives you a chance to read carefully, verify details, and respond from clarity instead of fear.";
  }

  if (severity?.received_letter === "yes" && severity.letter_about === "not_opened_yet") {
    return "You haven't opened the letter yet, which means you can choose a calm moment to review it with support instead of discovering it under pressure.";
  }

  if (answers.stress_profile?.behavior_pattern === "analyzer") {
    return "Your instinct to understand first is an asset. Structured information will help you act with more confidence.";
  }

  if ((answers.stress_profile?.confidence_level ?? 5) <= 2) {
    return "Low confidence right now doesn't mean you're incapable — it often means you need clearer information before the next step feels doable.";
  }

  if (context.categories.includes("medical")) {
    return "Medical bills sometimes have billing errors or assistance options. Clarity about the bill itself can change what you do next.";
  }

  return "You reached out before the pressure made every decision feel urgent. That head start matters more than you might think.";
}

function buildRecommendedNextStep(context: AnalysisContext): OnboardingAnalysis["recommended_next_step"] {
  const { answers, riskCategory } = context;
  const stage = assignRecoveryStage(context);
  const severity = answers.severity;
  const categories = context.categories;

  if (severity?.received_letter === "yes") {
    return {
      title: "Review your letter with Mina",
      description:
        "When you're ready, upload or photograph the letter so Mina can summarize it in plain language and flag anything time-sensitive.",
      target_feature: "document_analysis",
    };
  }

  if (
    categories.includes("irs_tax") &&
    (getIrsFollowUpResponse(answers) === "yes" ||
      getIrsFollowUpResponse(answers) === "not_sure")
  ) {
    return {
      title: "Understand your tax notice",
      description:
        "Upload the IRS or state notice when you have it. Mina can help you identify key dates and questions to ask — this is guidance, not tax or legal advice.",
      target_feature: "document_analysis",
    };
  }

  if (riskCategory === "legal_attention") {
    return {
      title: "Prepare for legal support resources",
      description:
        "Explore Mina's legal support preparation checklist and questions to ask a qualified professional in your state.",
      target_feature: "legal_support",
    };
  }

  if (stage === "stabilize") {
    return {
      title: "Create a one-page pressure snapshot",
      description:
        "List what's due, who's contacting you, and what you're most worried about — one page, no perfection required.",
      target_feature: "dashboard",
    };
  }

  if (severity?.collector_contact === "yes") {
    return {
      title: "Plan your next collector conversation",
      description:
        "Save a simple script and checklist for the next call so you can respond calmly instead of reactively.",
      target_feature: "live_call",
    };
  }

  return {
    title: "Save your Mina profile",
    description:
      "Create a free account to keep your recovery stage and next step on your dashboard.",
    target_feature: "dashboard",
  };
}

function buildRecommendedActions(context: AnalysisContext): string[] {
  const primary = buildRecommendedNextStep(context);
  const stage = assignRecoveryStage(context);
  const extras: string[] = [];

  if (context.answers.stress_profile?.recovery_goals.includes("create_a_plan")) {
    extras.push("Outline a simple weekly check-in to track progress.");
  }

  if (context.riskCategory === "high" || context.riskCategory === "legal_attention") {
    extras.push("Review Mina's legal support preparation resources for your state.");
  }

  if (stage === "understand") {
    extras.push("Write down three questions you still need answered.");
  }

  return [primary.title, ...extras.slice(0, 2)];
}

function buildNarrative(context: AnalysisContext): string {
  const { answers, stressIntensity } = context;
  const situation = answers.current_situation?.reason;
  const categories = buildPressureSources(context.categories).join(", ").toLowerCase();
  const pattern = answers.stress_profile?.behavior_pattern;
  const stage = assignRecoveryStage(context);

  const opening =
    situation === "letter_received"
      ? "You're dealing with notice-related pressure"
      : situation === "collector_contacted"
        ? "Collector contact is adding stress"
        : situation === "facing_legal_action"
          ? "Legal pressure is part of what you're carrying"
          : "Financial pressure is weighing on you";

  const emotional =
    stressIntensity === "critical" || stressIntensity === "high"
      ? "That level of stress is exhausting — and it makes every decision feel heavier than it needs to be."
      : "You're taking this seriously, which shows you want to handle it thoughtfully rather than react from fear.";

  const patternLine =
    pattern === "freezer"
      ? "Feeling stuck when things are unclear is a common response — clarity usually comes before confidence."
      : pattern === "avoider"
        ? "Putting pressure aside can feel protective in the moment, but it often leaves uncertainty growing in the background."
        : pattern === "analyzer"
          ? "Your instinct to understand first is a strength — you do best when you have a clear picture before acting."
          : "Your quick-response instinct can be useful, but it helps to pause when the stakes feel high.";

  const direction =
    stage === "protect"
      ? "Your most important move right now is to understand timing and protect your options before you commit to a response."
      : stage === "stabilize"
        ? "Before big decisions, a little grounding and one small priority can reduce the overwhelm you're feeling."
        : "Your next step is about understanding what's in front of you — not fixing everything at once.";

  return `${opening} related to ${categories}. ${emotional} ${patternLine} ${direction}`;
}

function buildWhatMinaSees(context: AnalysisContext): string[] {
  const { answers } = context;
  const bullets: string[] = [];
  const severity = answers.severity;

  if (answers.current_situation) {
    bullets.push(
      `You said you came here because ${answers.current_situation.reason.replaceAll("_", " ")}.`,
    );
  }

  if (context.categories.length > 0) {
    bullets.push(
      `Your main debt situations include ${buildPressureSources(context.categories).join(", ").toLowerCase()}.`,
    );
  }

  if (severity?.received_letter === "yes" && severity.letter_about === "not_opened_yet") {
    bullets.push("You received a letter but haven't opened it yet — uncertainty is driving stress.");
  }

  if (severity?.collector_contact === "yes") {
    bullets.push("Collector contact is part of the pressure you're facing.");
  }

  if ((severity?.uncertainty_flags ?? []).includes("who_is_contacting")) {
    bullets.push("You're unsure who is contacting you — verification matters before you respond.");
  }

  if (answers.stress_profile) {
    bullets.push(
      `You prefer ${SUPPORT_LABELS[answers.stress_profile.support_style].toLowerCase()} guidance.`,
    );
    bullets.push(
      `Your confidence is ${answers.stress_profile.confidence_level <= 2 ? "low" : "moderate"} right now — that's normal when the picture isn't clear yet.`,
    );
  }

  if (getMedicalFollowUpResponse(answers) === "in_collections") {
    bullets.push("Medical bills appear to be in collections — billing details may be worth verifying.");
  }

  return bullets.slice(0, 6);
}

function buildAnalysisCards(context: AnalysisContext): OnboardingAnalysis["cards"] {
  const stage = assignRecoveryStage(context);
  const stress = context.answers.stress_profile!;
  const actions = buildRecommendedActions(context);

  return [
    {
      key: "pressure",
      title: "Pressure",
      body: buildPressureSources(context.categories).join(" · "),
    },
    {
      key: "pattern",
      title: "Pattern",
      body: `${BEHAVIOR_LABELS[stress.behavior_pattern]} — ${SUPPORT_LABELS[stress.support_style]}`,
    },
    {
      key: "biggest_risk",
      title: "Biggest risk",
      body: buildBiggestRisk(context),
    },
    {
      key: "recovery_stage",
      title: "Recovery stage",
      body: `${stage.charAt(0).toUpperCase()}${stage.slice(1)} — ${STAGE_EXPLANATIONS[stage]}`,
    },
    {
      key: "recommended_actions",
      title: "Recommended actions",
      body: actions.join(" · "),
    },
    {
      key: "what_mina_sees",
      title: "What Mina sees",
      body: buildWhatMinaSees(context).join(" "),
    },
  ];
}

function buildAnalysis(context: AnalysisContext): OnboardingAnalysis {
  const recommendedNextStep = buildRecommendedNextStep(context);

  return {
    narrative: buildNarrative(context),
    cards: buildAnalysisCards(context),
    biggest_risk: buildBiggestRisk(context),
    biggest_opportunity: buildBiggestOpportunity(context),
    recommended_next_step: recommendedNextStep,
    what_mina_sees: buildWhatMinaSees(context),
    risk_category: context.riskCategory,
  };
}

export function generateOnboardingAnalysis(
  answers: OnboardingAnswers,
): AnalyzeOnboardingResponse {
  const parsed = parseOnboardingAnswersForAnalyze(answers);

  if (!parsed.success) {
    throw new Error(parsed.error);
  }

  const completeAnswers = parsed.data;
  const stressComposite = computeStressComposite(completeAnswers);
  const stressIntensity = mapStressIntensity(stressComposite);
  const riskCategory = computeLegalRiskCategory(completeAnswers);
  const categories = completeAnswers.situation_type?.categories ?? [];

  const context: AnalysisContext = {
    answers: completeAnswers,
    stressComposite,
    stressIntensity,
    riskCategory,
    categories,
  };

  const pressure_profile = buildPressureProfile(context);
  const recovery_path = buildRecoveryPath(context);
  const analysis = buildAnalysis(context);

  return {
    pressure_profile,
    recovery_path,
    analysis,
  };
}

export function getSituationTypeLabel(value: SituationTypeCategory): string {
  return SITUATION_LABELS[value];
}

export function getAllSituationTypeLabels(): typeof SITUATION_TYPE_OPTIONS {
  return SITUATION_TYPE_OPTIONS;
}

export function validateAnalysisInputs(answers: OnboardingAnswers): string[] {
  const missing = ONBOARDING_STEP_KEYS.filter((key) => !answers[key]);
  return missing;
}
