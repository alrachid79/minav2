-- Mina V2 MVP Schema
-- Source: MINA_DATABASE_MVP.md (32 tables only)
-- Run in Supabase SQL Editor or via supabase db push

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- HELPERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- CORE
-- =============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  language TEXT NOT NULL DEFAULT 'en',
  consents JSONB NOT NULL DEFAULT '{}'::JSONB,
  preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions (user_id);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- CATALOG (no user_id — created before feature FKs)
-- =============================================================================

CREATE TABLE public.letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_type TEXT NOT NULL,
  name TEXT NOT NULL,
  jurisdiction_scope TEXT NOT NULL DEFAULT 'federal',
  template_body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX letter_templates_type_active_idx ON public.letter_templates (letter_type, is_active);

CREATE TRIGGER letter_templates_set_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.legal_support_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (
    resource_type IN (
      'legal_aid', 'state_bar', 'consumer_protection', 'court_self_help', 'education'
    )
  ),
  state_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  phone TEXT,
  content_body TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX legal_support_resources_state_type_idx
  ON public.legal_support_resources (state_code, resource_type, is_active);

CREATE TRIGGER legal_support_resources_set_updated_at
  BEFORE UPDATE ON public.legal_support_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ONBOARDING
-- =============================================================================

CREATE TABLE public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL DEFAULT 1,
  is_origin_session BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  pressure_profile JSONB,
  recovery_path JSONB,
  analysis JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX onboarding_sessions_user_completed_idx
  ON public.onboarding_sessions (user_id, completed_at DESC);

CREATE TRIGGER onboarding_sessions_set_updated_at
  BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  onboarding_session_id UUID NOT NULL REFERENCES public.onboarding_sessions (id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX onboarding_answers_session_step_idx
  ON public.onboarding_answers (onboarding_session_id, step_key);

CREATE TRIGGER onboarding_answers_set_updated_at
  BEFORE UPDATE ON public.onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SHARED ENTITIES
-- =============================================================================

CREATE TABLE public.collectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX collectors_user_id_idx ON public.collectors (user_id);

CREATE TRIGGER collectors_set_updated_at
  BEFORE UPDATE ON public.collectors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.creditors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX creditors_user_id_idx ON public.creditors (user_id);

CREATE TRIGGER creditors_set_updated_at
  BEFORE UPDATE ON public.creditors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.debt_situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  collector_id UUID REFERENCES public.collectors (id) ON DELETE SET NULL,
  creditor_id UUID REFERENCES public.creditors (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX debt_situations_user_status_idx ON public.debt_situations (user_id, status);

CREATE TRIGGER debt_situations_set_updated_at
  BEFORE UPDATE ON public.debt_situations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SHARED INTELLIGENCE
-- =============================================================================

CREATE TABLE public.debt_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  debt_categories JSONB NOT NULL DEFAULT '[]'::JSONB,
  collector_involvement TEXT,
  legal_risk_level TEXT CHECK (
    legal_risk_level IS NULL OR legal_risk_level IN ('low', 'medium', 'high', 'legal_attention')
  ),
  settlement_status TEXT,
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER debt_profiles_set_updated_at
  BEFORE UPDATE ON public.debt_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.stress_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  stress_intensity TEXT NOT NULL CHECK (
    stress_intensity IN ('low', 'medium', 'high', 'critical')
  ),
  fear_intensity TEXT,
  avoidance_level TEXT,
  pressure_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER stress_profiles_set_updated_at
  BEFORE UPDATE ON public.stress_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recovery_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL CHECK (
    current_stage IN ('stabilize', 'understand', 'protect', 'act', 'resolve', 'recover')
  ),
  recovery_score INTEGER NOT NULL DEFAULT 0 CHECK (recovery_score >= 0 AND recovery_score <= 100),
  stage_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER recovery_statuses_set_updated_at
  BEFORE UPDATE ON public.recovery_statuses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.memory_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  proposing_feature TEXT NOT NULL,
  source_record_id UUID,
  category TEXT NOT NULL CHECK (
    category IN (
      'communication_preference', 'fear_pattern', 'behavioral_pattern', 'coaching_insight'
    )
  ),
  proposed_content TEXT NOT NULL,
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memory_candidates_user_status_idx ON public.memory_candidates (user_id, status);

CREATE TABLE public.memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  memory_candidate_id UUID REFERENCES public.memory_candidates (id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'user' CHECK (level IN ('user', 'debt_situation')),
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_corrected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memory_entries_user_active_idx
  ON public.memory_entries (user_id, status) WHERE status = 'active';

CREATE TRIGGER memory_entries_set_updated_at
  BEFORE UPDATE ON public.memory_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- DOCUMENT ANALYSIS
-- =============================================================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  collector_id UUID REFERENCES public.collectors (id) ON DELETE SET NULL,
  creditor_id UUID REFERENCES public.creditors (id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
  page_count INTEGER CHECK (page_count IS NULL OR (page_count > 0 AND page_count <= 50)),
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  storage_path TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'uploading' CHECK (
    upload_status IN ('uploading', 'ready', 'failed')
  ),
  document_type TEXT,
  risk_level TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX documents_user_created_idx ON public.documents (user_id, created_at DESC);

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.document_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  run_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  plain_language_summary TEXT,
  recommended_actions JSONB,
  what_mina_sees TEXT,
  extracted_text TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_analysis_runs_document_run_idx
  ON public.document_analysis_runs (document_id, run_number DESC);

CREATE TABLE public.document_extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_analysis_run_id UUID NOT NULL REFERENCES public.document_analysis_runs (id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,
  confidence_score NUMERIC(3, 2) CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  ),
  user_corrected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_extracted_fields_run_key_idx
  ON public.document_extracted_fields (document_analysis_run_id, field_key);

-- =============================================================================
-- LIVE CALL ASSISTANT
-- =============================================================================

CREATE TABLE public.live_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.collectors (id) ON DELETE SET NULL,
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'paused', 'completed', 'discarded')
  ),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX live_call_sessions_user_started_idx
  ON public.live_call_sessions (user_id, started_at DESC);

CREATE TRIGGER live_call_sessions_set_updated_at
  BEFORE UPDATE ON public.live_call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- LETTER GENERATOR
-- =============================================================================

CREATE TABLE public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  letter_type TEXT NOT NULL CHECK (
    letter_type IN ('validation', 'dispute', 'cease_communication', 'hardship')
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'finalized', 'exported', 'sent')
  ),
  document_id UUID REFERENCES public.documents (id) ON DELETE SET NULL,
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  collector_id UUID REFERENCES public.collectors (id) ON DELETE SET NULL,
  live_call_session_id UUID REFERENCES public.live_call_sessions (id) ON DELETE SET NULL,
  letter_template_id UUID REFERENCES public.letter_templates (id) ON DELETE SET NULL,
  recipient_snapshot JSONB,
  current_version INTEGER NOT NULL DEFAULT 0,
  export_storage_path TEXT,
  export_format TEXT CHECK (export_format IS NULL OR export_format IN ('pdf', 'docx')),
  finalized_at TIMESTAMPTZ,
  sent_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX letters_user_status_idx ON public.letters (user_id, status);

CREATE TRIGGER letters_set_updated_at
  BEFORE UPDATE ON public.letters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.letter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES public.letters (id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (letter_id, version_number)
);

CREATE INDEX letter_versions_letter_version_idx
  ON public.letter_versions (letter_id, version_number DESC);

CREATE TABLE public.live_call_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_call_session_id UUID NOT NULL REFERENCES public.live_call_sessions (id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'mina')),
  message_type TEXT NOT NULL CHECK (
    message_type IN ('collector_input', 'mina_response', 'coaching')
  ),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (live_call_session_id, sequence_number)
);

CREATE INDEX live_call_messages_session_seq_idx
  ON public.live_call_messages (live_call_session_id, sequence_number);

CREATE TABLE public.live_call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_call_session_id UUID NOT NULL UNIQUE REFERENCES public.live_call_sessions (id) ON DELETE CASCADE,
  what_happened TEXT NOT NULL,
  important_points JSONB,
  risks JSONB,
  recommended_actions JSONB,
  next_step TEXT,
  post_call_stress_level TEXT,
  saved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER live_call_summaries_set_updated_at
  BEFORE UPDATE ON public.live_call_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TIMELINE
-- =============================================================================

CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('past_event', 'upcoming_deadline')),
  source_feature TEXT NOT NULL,
  source_record_id UUID,
  severity TEXT,
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  collector_id UUID REFERENCES public.collectors (id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  is_legal_attention BOOLEAN NOT NULL DEFAULT FALSE,
  source_available BOOLEAN NOT NULL DEFAULT TRUE,
  deadline_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX timeline_events_user_occurred_idx
  ON public.timeline_events (user_id, occurred_at DESC);

CREATE INDEX timeline_events_user_upcoming_deadline_idx
  ON public.timeline_events (user_id, occurred_at)
  WHERE event_category = 'upcoming_deadline';

-- =============================================================================
-- DECISION SHIELD
-- =============================================================================

CREATE TABLE public.decision_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  decision_type TEXT,
  free_text_description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'discarded')),
  document_id UUID REFERENCES public.documents (id) ON DELETE SET NULL,
  letter_id UUID REFERENCES public.letters (id) ON DELETE SET NULL,
  live_call_session_id UUID REFERENCES public.live_call_sessions (id) ON DELETE SET NULL,
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  situation_summary TEXT,
  risks JSONB,
  unknowns JSONB,
  recommended_next_step TEXT,
  legal_support_note TEXT,
  current_choice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX decision_reviews_user_status_idx ON public.decision_reviews (user_id, status);

CREATE TRIGGER decision_reviews_set_updated_at
  BEFORE UPDATE ON public.decision_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_review_id UUID NOT NULL REFERENCES public.decision_reviews (id) ON DELETE CASCADE,
  option_label TEXT NOT NULL,
  pros JSONB,
  cons JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.decision_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_review_id UUID NOT NULL REFERENCES public.decision_reviews (id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (
    choice IN ('proceed', 'wait', 'gather_info', 'seek_legal_support', 'not_ready')
  ),
  outcome_description TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX decision_outcomes_review_recorded_idx
  ON public.decision_outcomes (decision_review_id, recorded_at DESC);

-- =============================================================================
-- LEGAL
-- =============================================================================

CREATE TABLE public.legal_attention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  source_feature TEXT NOT NULL,
  source_record_id UUID,
  severity TEXT NOT NULL,
  issue_type TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  debt_situation_id UUID REFERENCES public.debt_situations (id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX legal_attention_events_user_active_idx
  ON public.legal_attention_events (user_id, status) WHERE status = 'active';

CREATE TABLE public.legal_support_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  legal_attention_event_id UUID REFERENCES public.legal_attention_events (id) ON DELETE SET NULL,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('summons', 'garnishment', 'general')),
  issue_type TEXT NOT NULL,
  state TEXT NOT NULL,
  court_date DATE,
  urgency TEXT NOT NULL,
  intake_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  summary TEXT,
  preparation_checklist JSONB,
  questions_to_ask JSONB,
  recommended_resource_ids JSONB,
  user_response TEXT CHECK (
    user_response IS NULL OR user_response IN (
      'contacted_attorney', 'contacted_legal_aid', 'declined'
    )
  ),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX legal_support_intakes_user_status_idx
  ON public.legal_support_intakes (user_id, status);

CREATE TRIGGER legal_support_intakes_set_updated_at
  BEFORE UPDATE ON public.legal_support_intakes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- DASHBOARD
-- =============================================================================

CREATE TABLE public.dashboard_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('primary', 'secondary')),
  sort_order INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  target_feature TEXT NOT NULL,
  target_record_id UUID,
  source_feature TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'dismissed', 'snoozed', 'completed')
  ),
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dashboard_recommendations_user_active_idx
  ON public.dashboard_recommendations (user_id, status) WHERE status = 'active';

CREATE TRIGGER dashboard_recommendations_set_updated_at
  BEFORE UPDATE ON public.dashboard_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- COMPLIANCE
-- =============================================================================

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_category TEXT NOT NULL CHECK (
    event_category IN ('user_action', 'mina_generated', 'important_update')
  ),
  event_type TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  actor TEXT NOT NULL CHECK (actor IN ('user', 'mina', 'system')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_events_user_occurred_idx
  ON public.audit_events (user_id, occurred_at DESC);

CREATE TABLE public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  storage_bucket TEXT DEFAULT 'data_exports',
  storage_path TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX data_export_requests_user_id_idx ON public.data_export_requests (user_id);

CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed')
  ),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX account_deletion_requests_user_id_idx ON public.account_deletion_requests (user_id);

-- =============================================================================
-- ROW LEVEL SECURITY — USER-OWNED TABLES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_call_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_call_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_attention_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_support_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- profiles: id = auth.uid()
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated USING (id = auth.uid());

-- Standard user_id = auth.uid() policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'subscriptions', 'onboarding_sessions', 'onboarding_answers',
    'collectors', 'creditors', 'debt_situations',
    'debt_profiles', 'stress_profiles', 'recovery_statuses',
    'memory_candidates', 'memory_entries',
    'documents',
    'live_call_sessions', 'letters',
    'timeline_events', 'decision_reviews',
    'legal_attention_events', 'legal_support_intakes',
    'dashboard_recommendations',
    'data_export_requests', 'account_deletion_requests'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())',
      tbl || '_select_own', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())',
      tbl || '_insert_own', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      tbl || '_update_own', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid())',
      tbl || '_delete_own', tbl
    );
  END LOOP;
END;
$$;

-- document_analysis_runs: user must own the run AND the referenced document
CREATE POLICY document_analysis_runs_select_own ON public.document_analysis_runs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY document_analysis_runs_insert_own ON public.document_analysis_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_analysis_runs.document_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY document_analysis_runs_update_own ON public.document_analysis_runs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_analysis_runs.document_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY document_analysis_runs_delete_own ON public.document_analysis_runs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- audit_events: nullable user_id
CREATE POLICY audit_events_select_own ON public.audit_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY audit_events_insert_own ON public.audit_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Child tables without user_id — ownership via parent join

CREATE POLICY document_extracted_fields_select_own ON public.document_extracted_fields
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.document_analysis_runs dar
      JOIN public.documents d ON d.id = dar.document_id
      WHERE dar.id = document_extracted_fields.document_analysis_run_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY document_extracted_fields_insert_own ON public.document_extracted_fields
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_analysis_runs dar
      JOIN public.documents d ON d.id = dar.document_id
      WHERE dar.id = document_extracted_fields.document_analysis_run_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY document_extracted_fields_update_own ON public.document_extracted_fields
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.document_analysis_runs dar
      JOIN public.documents d ON d.id = dar.document_id
      WHERE dar.id = document_extracted_fields.document_analysis_run_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY document_extracted_fields_delete_own ON public.document_extracted_fields
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.document_analysis_runs dar
      JOIN public.documents d ON d.id = dar.document_id
      WHERE dar.id = document_extracted_fields.document_analysis_run_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY letter_versions_select_own ON public.letter_versions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.letters l
      WHERE l.id = letter_versions.letter_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY letter_versions_insert_own ON public.letter_versions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.letters l
      WHERE l.id = letter_versions.letter_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY letter_versions_update_own ON public.letter_versions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.letters l
      WHERE l.id = letter_versions.letter_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY letter_versions_delete_own ON public.letter_versions
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.letters l
      WHERE l.id = letter_versions.letter_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_messages_select_own ON public.live_call_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_messages.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_messages_insert_own ON public.live_call_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_messages.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_messages_update_own ON public.live_call_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_messages.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_messages_delete_own ON public.live_call_messages
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_messages.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_summaries_select_own ON public.live_call_summaries
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_summaries.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_summaries_insert_own ON public.live_call_summaries
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_summaries.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_summaries_update_own ON public.live_call_summaries
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_summaries.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY live_call_summaries_delete_own ON public.live_call_summaries
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_call_sessions s
      WHERE s.id = live_call_summaries.live_call_session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY decision_options_select_own ON public.decision_options
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_options.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_options_insert_own ON public.decision_options
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_options.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_options_update_own ON public.decision_options
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_options.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_options_delete_own ON public.decision_options
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_options.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_outcomes_select_own ON public.decision_outcomes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_outcomes.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_outcomes_insert_own ON public.decision_outcomes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_outcomes.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_outcomes_update_own ON public.decision_outcomes
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_outcomes.decision_review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY decision_outcomes_delete_own ON public.decision_outcomes
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.decision_reviews r
      WHERE r.id = decision_outcomes.decision_review_id AND r.user_id = auth.uid()
    )
  );

-- =============================================================================
-- ROW LEVEL SECURITY — CATALOG TABLES (read-only for authenticated)
-- =============================================================================

ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_support_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY letter_templates_select_authenticated ON public.letter_templates
  FOR SELECT TO authenticated USING (is_active = TRUE);

CREATE POLICY legal_support_resources_select_authenticated ON public.legal_support_resources
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('documents', 'documents', FALSE, 26214400),
  ('letter_exports', 'letter_exports', FALSE, 26214400),
  ('data_exports', 'data_exports', FALSE, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path convention {user_id}/{feature}/{record_id}/{filename}

CREATE POLICY storage_documents_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_documents_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_documents_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_documents_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_letter_exports_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'letter_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_letter_exports_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'letter_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_letter_exports_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'letter_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_letter_exports_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'letter_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_data_exports_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'data_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_data_exports_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'data_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY storage_data_exports_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'data_exports'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- =============================================================================
-- AUTH SIGNUP → PROFILES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at, state)
  VALUES (NEW.id, NEW.email, NOW(), NOW(), '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- state is temporarily set to empty string because profiles.state is NOT NULL.
-- onboarding must replace it with the user's real state before profile completion.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- API ROLE GRANTS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.letter_templates, public.legal_support_resources TO anon, authenticated;

-- =============================================================================
-- LETTER TEMPLATE SEED (federal-first catalog)
-- =============================================================================

INSERT INTO public.letter_templates (
  letter_type,
  name,
  jurisdiction_scope,
  template_body,
  is_active,
  version
) VALUES
  (
    'validation',
    'Debt Validation Letter',
    'federal',
    '{"subject":"Request for debt verification","greeting":"Dear {{recipient_name}},","body":"I am writing regarding the account referenced below. I received communication about this account and would like to request verification of the debt before taking further steps.\\n\\nPlease provide documentation that shows the amount owed, the original creditor, and how the balance was calculated. If you are not the current owner of this debt, please identify the party that is.\\n\\nAccount reference: {{account_reference}}\\nBalance listed: {{balance_amount}}\\n\\nThis message is for informational purposes. I am gathering details to understand the account more clearly.","closing":"Sincerely,\\n{{sender_name}}\\n{{sender_address_line}}"}',
    TRUE,
    1
  ),
  (
    'dispute',
    'Dispute Letter',
    'federal',
    '{"subject":"Dispute of account information","greeting":"Dear {{recipient_name}},","body":"I am writing to dispute the account information listed below. Based on my review, some details may be inaccurate or incomplete.\\n\\nPlease review the account and provide clarification. I am documenting this for my records while I review the information available to me.\\n\\nAccount reference: {{account_reference}}\\nBalance listed: {{balance_amount}}\\nDocument date referenced: {{document_date}}\\n\\n{{document_summary_note}}","closing":"Sincerely,\\n{{sender_name}}\\n{{sender_address_line}}"}',
    TRUE,
    1
  ),
  (
    'cease_communication',
    'Cease Communication Letter',
    'federal',
    '{"subject":"Request to limit contact about this account","greeting":"Dear {{recipient_name}},","body":"I am writing about the account referenced below. At this time, I am requesting that you limit contact with me regarding this account to written correspondence sent to the address below, except for messages that may be required under applicable law.\\n\\nAccount reference: {{account_reference}}\\n\\nI am keeping records of communications related to this account as I review my options.","closing":"Sincerely,\\n{{sender_name}}\\n{{sender_address_line}}"}',
    TRUE,
    1
  ),
  (
    'hardship',
    'Hardship Letter',
    'federal',
    '{"subject":"Financial hardship explanation","greeting":"Dear {{recipient_name}},","body":"I am writing to explain that I am currently experiencing financial hardship that affects my ability to address this account at this time.\\n\\nI want to provide context about my situation and ask that you note this in your records while I review possible next steps. I am not making any commitment regarding payment in this letter.\\n\\nAccount reference: {{account_reference}}\\nBalance listed: {{balance_amount}}\\n\\n{{document_summary_note}}","closing":"Sincerely,\\n{{sender_name}}\\n{{sender_address_line}}"}',
    TRUE,
    1
  );
