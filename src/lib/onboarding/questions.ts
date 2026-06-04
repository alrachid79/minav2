import type {
  CurrentSituationReason,
  OnboardingStepKey,
  SituationTypeCategory,
} from "@/types/onboarding";

export type OnboardingScreenInputType =
  | "welcome"
  | "interstitial"
  | "single_select"
  | "multi_select"
  | "yes_no_not_sure"
  | "slider"
  | "state_select";

export type OnboardingSection =
  | "welcome"
  | "situation"
  | "severity"
  | "financial"
  | "stress"
  | "results"
  | "signup";

export interface OnboardingQuestionOption {
  value: string;
  label: string;
  minaReflection?: string;
}

export interface OnboardingScreenDefinition {
  id: string;
  stepKey: OnboardingStepKey | null;
  section: OnboardingSection;
  title: string;
  subtitle?: string;
  options?: OnboardingQuestionOption[];
  minaReflection?: string;
  minaNote?: string;
  required: boolean;
  multiSelect: boolean;
  inputType: OnboardingScreenInputType;
  sliderMin?: number;
  sliderMax?: number;
  sliderLowLabel?: string;
  sliderHighLabel?: string;
}

export const WELCOME_SCREEN: OnboardingScreenDefinition = {
  id: "welcome",
  stepKey: null,
  section: "welcome",
  title: "Welcome to Mina",
  subtitle:
    "Understand your situation. See your options. Take one step at a time.",
  minaReflection:
    "Financial pressure is exhausting. Let's take this one step at a time — about five minutes, at your pace.",
  required: false,
  multiSelect: false,
  inputType: "welcome",
};

export const CURRENT_SITUATION_REFLECTIONS: Record<
  CurrentSituationReason,
  string
> = {
  collector_contacted:
    "Contact from a collector can feel intrusive and stressful — even when you want to handle things the right way. We'll help you understand what's happening and what you can do next.",
  letter_received:
    "Letters can be confusing on purpose. You're doing the right thing by pausing to understand it instead of reacting from fear.",
  worried_about_debt:
    "Worry often comes before anything 'official' happens — and that's okay. Getting clarity early is one of the smartest moves you can make.",
  behind_on_payments:
    "Falling behind doesn't define you. Many people hit this point and recover with a clear plan. Let's figure out where you stand.",
  facing_legal_action:
    "Legal pressure is serious — and you deserve calm, structured support. Mina can help you prepare and understand your options. This is guidance, not legal advice.",
  not_sure_where_to_start:
    "Not knowing where to start is one of the hardest parts. You don't need to have it figured out — we'll map it together, one step at a time.",
};

export const CURRENT_SITUATION_SCREEN: OnboardingScreenDefinition = {
  id: "current_situation",
  stepKey: "current_situation",
  section: "situation",
  title: "What brought you here today?",
  subtitle: "Choose what feels closest. You can change this later.",
  options: [
    {
      value: "collector_contacted",
      label: "A collector contacted me",
      minaReflection: CURRENT_SITUATION_REFLECTIONS.collector_contacted,
    },
    {
      value: "letter_received",
      label: "I received a letter or notice",
      minaReflection: CURRENT_SITUATION_REFLECTIONS.letter_received,
    },
    {
      value: "worried_about_debt",
      label: "I'm worried about debt",
      minaReflection: CURRENT_SITUATION_REFLECTIONS.worried_about_debt,
    },
    {
      value: "behind_on_payments",
      label: "I'm behind on payments",
      minaReflection: CURRENT_SITUATION_REFLECTIONS.behind_on_payments,
    },
    {
      value: "facing_legal_action",
      label: "I'm facing legal action",
      minaReflection: CURRENT_SITUATION_REFLECTIONS.facing_legal_action,
    },
    {
      value: "not_sure_where_to_start",
      label: "I'm not sure where to start",
      minaReflection: CURRENT_SITUATION_REFLECTIONS.not_sure_where_to_start,
    },
  ],
  required: true,
  multiSelect: false,
  inputType: "single_select",
};

export const SITUATION_TYPE_OPTIONS: OnboardingQuestionOption[] = [
  { value: "credit_card", label: "Credit card debt" },
  { value: "medical", label: "Medical bills" },
  { value: "personal_loan", label: "Personal loan" },
  { value: "auto_loan", label: "Auto loan" },
  { value: "student_loans", label: "Student loans" },
  { value: "mortgage", label: "Mortgage" },
  { value: "irs_tax", label: "IRS / Tax debt" },
  { value: "utilities", label: "Utilities" },
  { value: "collections_unknown", label: "Collections (unknown)" },
  { value: "multiple_debts", label: "Multiple debts" },
  { value: "not_sure", label: "Not sure" },
];

export const SITUATION_TYPE_SCREEN: OnboardingScreenDefinition = {
  id: "situation_type",
  stepKey: "situation_type",
  section: "situation",
  title: "What type of situation are you dealing with?",
  subtitle: "Select all that apply, or choose the one that feels most pressing.",
  options: SITUATION_TYPE_OPTIONS,
  minaReflection:
    "You've named the types of pressure you're carrying. That alone takes courage — and it gives us a clearer place to start.",
  required: true,
  multiSelect: true,
  inputType: "multi_select",
};

export interface SituationFollowUpDefinition {
  category: SituationTypeCategory;
  title: string;
  subtitle?: string;
  options: OnboardingQuestionOption[];
}

export const SITUATION_TYPE_FOLLOW_UPS: Record<
  SituationTypeCategory,
  SituationFollowUpDefinition
> = {
  credit_card: {
    category: "credit_card",
    title: "Roughly how many credit accounts are involved?",
    options: [
      { value: "one", label: "One" },
      { value: "two_to_three", label: "Two to three" },
      { value: "four_or_more", label: "Four or more" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  medical: {
    category: "medical",
    title: "Are any bills in collections, or still with the provider?",
    options: [
      { value: "with_provider", label: "With provider" },
      { value: "in_collections", label: "In collections" },
      { value: "both", label: "Both" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  personal_loan: {
    category: "personal_loan",
    title: "Is the loan current, behind, or in collections?",
    options: [
      { value: "current", label: "Current" },
      { value: "behind", label: "Behind" },
      { value: "collections", label: "Collections" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  auto_loan: {
    category: "auto_loan",
    title: "Are you worried about repossession, or mostly keeping up?",
    options: [
      { value: "keeping_up", label: "Keeping up" },
      { value: "behind_on_payments", label: "Behind on payments" },
      { value: "repossession_concern", label: "Repossession concern" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  student_loans: {
    category: "student_loans",
    title: "Federal, private, or both?",
    options: [
      { value: "federal", label: "Federal" },
      { value: "private", label: "Private" },
      { value: "both", label: "Both" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  mortgage: {
    category: "mortgage",
    title: "Are you current, behind, or facing foreclosure concern?",
    options: [
      { value: "current", label: "Current" },
      { value: "behind", label: "Behind" },
      { value: "foreclosure_concern", label: "Foreclosure concern" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  irs_tax: {
    category: "irs_tax",
    title: "Have you received a notice from the IRS or state tax agency?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  utilities: {
    category: "utilities",
    title: "Are services at risk of shutoff, or already disconnected?",
    options: [
      { value: "at_risk", label: "At risk" },
      { value: "disconnected", label: "Disconnected" },
      { value: "caught_up", label: "Caught up" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  collections_unknown: {
    category: "collections_unknown",
    title: "Do you know who is contacting you, or is it unclear?",
    options: [
      { value: "know_who", label: "I know who" },
      { value: "unclear", label: "Unclear" },
      { value: "mixed", label: "Mixed" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  multiple_debts: {
    category: "multiple_debts",
    title: "Which feels most urgent right now?",
    subtitle: "Choose the one weighing on you most.",
    options: SITUATION_TYPE_OPTIONS.filter(
      (option) =>
        option.value !== "multiple_debts" && option.value !== "not_sure",
    ),
  },
  not_sure: {
    category: "not_sure",
    title: "That's okay.",
    subtitle: "We'll focus on what's causing the most stress first.",
    options: [],
  },
};

export function getSituationFollowUpScreenId(
  category: SituationTypeCategory,
): string {
  return `situation_follow_up_${category}`;
}

export function buildSituationFollowUpScreen(
  category: SituationTypeCategory,
): OnboardingScreenDefinition {
  const followUp = SITUATION_TYPE_FOLLOW_UPS[category];

  return {
    id: getSituationFollowUpScreenId(category),
    stepKey: "situation_type",
    section: "situation",
    title: followUp.title,
    subtitle: followUp.subtitle,
    options: followUp.options,
    required: category !== "not_sure",
    multiSelect: category === "multiple_debts" ? false : false,
    inputType: category === "not_sure" ? "interstitial" : "single_select",
  };
}

export const YES_NO_NOT_SURE_OPTIONS: OnboardingQuestionOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

export const SEVERITY_SCREENS: OnboardingScreenDefinition[] = [
  {
    id: "severity_received_letter",
    stepKey: "severity",
    section: "severity",
    title: "Have you received a letter?",
    required: true,
    multiSelect: false,
    inputType: "yes_no_not_sure",
    options: YES_NO_NOT_SURE_OPTIONS,
  },
  {
    id: "severity_letter_about",
    stepKey: "severity",
    section: "severity",
    title: "Do you remember what it was about?",
    options: [
      { value: "payment_demand", label: "Payment demand" },
      { value: "court_or_legal", label: "Court or legal" },
      {
        value: "verification_or_validation",
        label: "Verification or validation",
      },
      { value: "not_sure", label: "Not sure" },
      { value: "not_opened_yet", label: "Haven't opened it yet" },
    ],
    minaNote:
      "That's okay. When you're ready, you can upload it in Mina and we'll help you understand it — plain language, no jargon.",
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "severity_collector_contact",
    stepKey: "severity",
    section: "severity",
    title: "Have you been contacted by a collector?",
    required: true,
    multiSelect: false,
    inputType: "yes_no_not_sure",
    options: YES_NO_NOT_SURE_OPTIONS,
  },
  {
    id: "severity_collector_frequency",
    stepKey: "severity",
    section: "severity",
    title: "How often?",
    options: [
      { value: "once", label: "Once" },
      { value: "a_few_times", label: "A few times" },
      { value: "frequently", label: "Frequently" },
      { value: "not_sure", label: "Not sure" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "severity_currently_sued",
    stepKey: "severity",
    section: "severity",
    title: "Are you currently being sued?",
    required: true,
    multiSelect: false,
    inputType: "yes_no_not_sure",
    options: YES_NO_NOT_SURE_OPTIONS,
    minaReflection:
      "This sounds like a situation where professional legal help may be important. Mina can help you prepare questions and find resources — but we're not a law firm, and this isn't legal advice.",
  },
  {
    id: "severity_lawsuit_follow_up",
    stepKey: "severity",
    section: "severity",
    title: "Have you been served papers or received a court date?",
    options: [
      { value: "served", label: "Served" },
      { value: "court_date_known", label: "Court date known" },
      { value: "heard_not_sure", label: "Heard about it, not sure" },
      { value: "not_sure", label: "Not sure" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "severity_wages_bank",
    stepKey: "severity",
    section: "severity",
    title: "Have wages or bank accounts been affected?",
    options: [
      { value: "yes_garnishment_or_levy", label: "Yes, garnishment or levy" },
      { value: "yes_unsure_type", label: "Yes, but not sure what type" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "severity_upcoming_deadlines",
    stepKey: "severity",
    section: "severity",
    title: "Are there upcoming deadlines?",
    required: true,
    multiSelect: false,
    inputType: "yes_no_not_sure",
    options: YES_NO_NOT_SURE_OPTIONS,
  },
  {
    id: "severity_deadline_window",
    stepKey: "severity",
    section: "severity",
    title: "Do you know roughly when?",
    options: [
      { value: "within_2_weeks", label: "Within 2 weeks" },
      { value: "within_30_days", label: "Within 30 days" },
      { value: "more_than_30_days", label: "More than 30 days" },
      { value: "not_sure", label: "Not sure" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "severity_uncertainty",
    stepKey: "severity",
    section: "severity",
    title: "Is there anything you're uncertain about right now?",
    subtitle: "Select all that apply.",
    options: [
      { value: "who_is_contacting", label: "Who is contacting me" },
      { value: "whether_i_owe", label: "Whether I owe this" },
      { value: "what_if_ignore", label: "What happens if I ignore it" },
      { value: "whether_legitimate", label: "Whether this is legitimate" },
      { value: "what_to_do_first", label: "What I should do first" },
      {
        value: "none_mostly_understand",
        label: "None of these — I mostly understand",
      },
    ],
    minaReflection:
      "Uncertainty is normal — especially when the stakes feel high. Part of our job is to turn 'I don't know' into 'I know my next step.'",
    required: true,
    multiSelect: true,
    inputType: "multi_select",
  },
];

export const FINANCIAL_SCREENS: OnboardingScreenDefinition[] = [
  {
    id: "financial_us_state",
    stepKey: "financial_snapshot",
    section: "financial",
    title: "What state do you live in?",
    subtitle:
      "Some guidance depends on where you live. We don't share this with collectors.",
    required: true,
    multiSelect: false,
    inputType: "state_select",
  },
  {
    id: "financial_income",
    stepKey: "financial_snapshot",
    section: "financial",
    title: "Roughly, what's your monthly household income?",
    subtitle:
      "A range is fine — this helps us understand flexibility, not to judge you.",
    options: [
      { value: "under_2000", label: "Under $2,000" },
      { value: "2000_4000", label: "$2,000–$4,000" },
      { value: "4000_6000", label: "$4,000–$6,000" },
      { value: "6000_10000", label: "$6,000–$10,000" },
      { value: "over_10000", label: "Over $10,000" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "financial_expenses",
    stepKey: "financial_snapshot",
    section: "financial",
    title: "Roughly, what are your essential monthly expenses?",
    subtitle: "Rent, utilities, food, transport — ballpark is enough.",
    options: [
      { value: "under_2000", label: "Under $2,000" },
      { value: "2000_4000", label: "$2,000–$4,000" },
      { value: "4000_6000", label: "$4,000–$6,000" },
      { value: "over_10000", label: "Over $6,000" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "financial_emergency_savings",
    stepKey: "financial_snapshot",
    section: "financial",
    title: "If an unexpected $500 expense came up, how would that feel?",
    options: [
      { value: "very_difficult", label: "Very difficult" },
      { value: "manageable_but_tight", label: "Manageable but tight" },
      { value: "comfortable", label: "Comfortable" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
    minaReflection:
      "Thank you. This isn't about perfect numbers — it's about understanding your room to breathe while you work through this.",
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "financial_debt_count",
    stepKey: "financial_snapshot",
    section: "financial",
    title: "How many separate debt situations are you juggling?",
    options: [
      { value: "one", label: "One" },
      { value: "two_to_three", label: "Two to three" },
      { value: "four_or_more", label: "Four or more" },
      { value: "not_sure", label: "Not sure" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
];

export const STRESS_SCREENS: OnboardingScreenDefinition[] = [
  {
    id: "stress_emotional",
    stepKey: "stress_profile",
    section: "stress",
    title: "How much is this affecting you emotionally day to day?",
    sliderMin: 1,
    sliderMax: 5,
    sliderLowLabel: "Mostly manageable",
    sliderHighLabel: "Overwhelming most days",
    required: true,
    multiSelect: false,
    inputType: "slider",
  },
  {
    id: "stress_financial",
    stepKey: "stress_profile",
    section: "stress",
    title: "How tight does money feel right now?",
    sliderMin: 1,
    sliderMax: 5,
    sliderLowLabel: "Some concern",
    sliderHighLabel: "Constant stress about bills",
    required: true,
    multiSelect: false,
    inputType: "slider",
  },
  {
    id: "stress_legal",
    stepKey: "stress_profile",
    section: "stress",
    title: "How much are legal consequences on your mind?",
    sliderMin: 1,
    sliderMax: 5,
    sliderLowLabel: "Barely / not applicable",
    sliderHighLabel: "It's my biggest fear",
    required: true,
    multiSelect: false,
    inputType: "slider",
  },
  {
    id: "stress_confidence",
    stepKey: "stress_profile",
    section: "stress",
    title: "How confident do you feel handling this on your own?",
    sliderMin: 1,
    sliderMax: 5,
    sliderLowLabel: "Not confident at all",
    sliderHighLabel: "I mostly know what to do",
    required: true,
    multiSelect: false,
    inputType: "slider",
  },
  {
    id: "stress_behavior",
    stepKey: "stress_profile",
    section: "stress",
    title: "When financial pressure hits, what do you usually do first?",
    options: [
      { value: "avoider", label: "Put it aside and hope it resolves" },
      { value: "analyzer", label: "Research for hours before acting" },
      { value: "reactor", label: "React quickly — call, pay, or respond" },
      { value: "freezer", label: "Feel stuck and struggle to decide" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "stress_support",
    stepKey: "stress_profile",
    section: "stress",
    title: "How do you prefer to receive guidance?",
    options: [
      { value: "coach", label: "Step-by-step coach" },
      { value: "direct", label: "Straight facts" },
      { value: "emotional_first", label: "Emotional support first" },
      { value: "educator", label: "Teach me how it works" },
      { value: "accountability", label: "Keep me accountable" },
    ],
    required: true,
    multiSelect: false,
    inputType: "single_select",
  },
  {
    id: "stress_recovery_goals",
    stepKey: "stress_profile",
    section: "stress",
    title: "What would feel like progress for you right now?",
    subtitle: "Choose up to three.",
    options: [
      { value: "stop_worrying", label: "Stop worrying" },
      { value: "respond_confidently", label: "Respond confidently" },
      { value: "settle_or_negotiate", label: "Settle or negotiate" },
      { value: "avoid_legal_problems", label: "Avoid legal problems" },
      { value: "create_a_plan", label: "Create a plan" },
      { value: "rebuild_stability", label: "Rebuild stability" },
    ],
    minaReflection:
      "I have what I need. Let me put together a clear picture for you.",
    required: true,
    multiSelect: true,
    inputType: "multi_select",
  },
];

export const ANALYSIS_INTERSTITIAL_SCREEN: OnboardingScreenDefinition = {
  id: "analysis_loading",
  stepKey: null,
  section: "results",
  title: "Give me a moment to put this together for you.",
  subtitle: "Based on what you shared, here's a clear picture of where you are.",
  required: false,
  multiSelect: false,
  inputType: "interstitial",
};

export const SIGNUP_HANDOFF_SCREEN: OnboardingScreenDefinition = {
  id: "signup_handoff",
  stepKey: null,
  section: "signup",
  title: "Save your Mina profile",
  subtitle:
    "Create a free account to keep your analysis, recovery stage, and next steps — and continue when you're ready.",
  minaReflection:
    "You've done the hard part — naming what's going on. A free account lets Mina remember your situation so you don't have to retell your story.",
  required: false,
  multiSelect: false,
  inputType: "interstitial",
};

export const ONBOARDING_SCREEN_MAP: Record<string, OnboardingScreenDefinition> =
  {
    [WELCOME_SCREEN.id]: WELCOME_SCREEN,
    [CURRENT_SITUATION_SCREEN.id]: CURRENT_SITUATION_SCREEN,
    [SITUATION_TYPE_SCREEN.id]: SITUATION_TYPE_SCREEN,
    ...Object.fromEntries(
      SEVERITY_SCREENS.map((screen) => [screen.id, screen]),
    ),
    ...Object.fromEntries(
      FINANCIAL_SCREENS.map((screen) => [screen.id, screen]),
    ),
    ...Object.fromEntries(STRESS_SCREENS.map((screen) => [screen.id, screen])),
    [ANALYSIS_INTERSTITIAL_SCREEN.id]: ANALYSIS_INTERSTITIAL_SCREEN,
    [SIGNUP_HANDOFF_SCREEN.id]: SIGNUP_HANDOFF_SCREEN,
  };

export function getOnboardingScreen(
  screenId: string,
): OnboardingScreenDefinition | undefined {
  if (screenId.startsWith("situation_follow_up_")) {
    const category = screenId.replace(
      "situation_follow_up_",
      "",
    ) as SituationTypeCategory;

    if (category in SITUATION_TYPE_FOLLOW_UPS) {
      return buildSituationFollowUpScreen(category);
    }
  }

  return ONBOARDING_SCREEN_MAP[screenId];
}

export function getMinaReflectionForOption(
  screenId: string,
  optionValue: string,
): string | undefined {
  const screen = getOnboardingScreen(screenId);
  return screen?.options?.find((option) => option.value === optionValue)
    ?.minaReflection;
}

export function getCurrentSituationReflection(
  reason: CurrentSituationReason,
): string {
  return CURRENT_SITUATION_REFLECTIONS[reason];
}

export const ONBOARDING_SECTION_LABELS: Record<OnboardingSection, string> = {
  welcome: "Welcome",
  situation: "Your situation",
  severity: "What's happening",
  financial: "Financial snapshot",
  stress: "How you're feeling",
  results: "Your Mina profile",
  signup: "Save progress",
};
