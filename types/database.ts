// Database schema types. Kept in sync manually with supabase/migrations/*.sql.
// If you later adopt the Supabase CLI, replace this file with the output of
// `supabase gen types typescript --local`.
//
// Each table entry must include `Relationships: []` (even empty) — the
// @supabase/postgrest-js GenericTable constraint requires it, and without it
// `.from(...).insert(...)` falls back to `never` and every write errors.

import type { PainFrequency, PriceWillingness } from '@/lib/waitlist'

// NOTE: `case_studies.compiled_narrative` is typed `unknown` on purpose. It
// holds documents in the deleted 8-section sales-genre shape, and nothing
// reads it any more. The column is kept because dropping it cannot be undone
// and deferring costs nothing; the replacement shape lives in
// lib/case-study-blocks.ts. See check-revision-prompt.md.

export type CaseStudyStatus = 'draft' | 'preview' | 'paid' | 'complete'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed'
export type ReviewRole = 'user' | 'agent'

export type ProjectType = 'focused_fix' | 'zero_to_one' | 'advisory'
export type Tone =
  | 'professional'
  | 'direct'
  | 'confident'
  | 'data_driven'
  | 'warm'

// The whole intake form, stored as one jsonb column. Submitted in a single
// shot, so per-field rows buy nothing.
export type Intake = {
  title: string
  client_type: string
  problem: string
  solution: string
  business_impact: string
  metrics?: string
  timeline_investment?: string
  client_reaction?: string
  // Not a project fact — a sample of how the designer actually talks, used to
  // anchor the prose style. The prompt is explicit that its CONTENT must never
  // be treated as something that happened.
  voice_sample?: string
}

// AI-inferred, anonymized meta grid. Persisted in case_studies.meta (jsonb) —
// see migration 0008.
//
// STALE, like `compiled_narrative` above: this is the shape the deleted page
// wrote and read, and nothing writes it now. Both halves have replacements in
// the block schema — a `metadata_grid` block (4–6 label/value pairs, and the
// wizard collects them directly in Phase 2 rather than inferring them), and a
// caption on each `annotated_visual`. Kept only so the column stays typed; do
// not build against it.
export type CaseStudyMeta = {
  role: string
  client: string
  audience: string
  platform: string
  // Per-attachment caption, keyed by case_study_attachments.id (uuid).
  image_captions?: Record<string, string>
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          // Written only by spend_credit() and add_credits(). A column-level
          // grant stops the browser from updating it directly.
          credit_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          credit_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          // Only `email` is actually grantable to the browser; the rest are
          // here for service-role writes.
          id?: string
          email?: string | null
          credit_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          id: string
          user_id: string
          status: CaseStudyStatus
          title: string | null
          headline: string | null
          compile_claimed_at: string | null
          meta: CaseStudyMeta | null
          client_type: string | null
          project_type: ProjectType | null
          tone: Tone | null
          intake: Intake | null
          compiled_narrative: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: CaseStudyStatus
          title?: string | null
          headline?: string | null
          compile_claimed_at?: string | null
          meta?: CaseStudyMeta | null
          client_type?: string | null
          project_type?: ProjectType | null
          tone?: Tone | null
          intake?: Intake | null
          compiled_narrative?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: CaseStudyStatus
          title?: string | null
          headline?: string | null
          compile_claimed_at?: string | null
          meta?: CaseStudyMeta | null
          client_type?: string | null
          project_type?: ProjectType | null
          tone?: Tone | null
          intake?: Intake | null
          compiled_narrative?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_messages: {
        Row: {
          id: string
          case_study_id: string
          role: ReviewRole
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          case_study_id: string
          role: ReviewRole
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          case_study_id?: string
          role?: ReviewRole
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          // Positive for purchases, negative for spends.
          delta: number
          reason: string
          case_study_id: string | null
          stripe_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          delta: number
          reason: string
          case_study_id?: string | null
          stripe_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          delta?: number
          reason?: string
          case_study_id?: string | null
          stripe_payment_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      case_study_attachments: {
        Row: {
          id: string
          case_study_id: string
          storage_path: string
          order_index: number
          mime_type: string
          size_bytes: number
          created_at: string
        }
        Insert: {
          id?: string
          case_study_id: string
          storage_path: string
          order_index: number
          mime_type: string
          size_bytes: number
          created_at?: string
        }
        Update: {
          id?: string
          case_study_id?: string
          storage_path?: string
          order_index?: number
          mime_type?: string
          size_bytes?: number
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          // Nullable: a payment buys a credit pack, not one specific study.
          case_study_id: string | null
          amount: number
          currency: string
          stripe_payment_id: string | null
          status: PaymentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          case_study_id?: string | null
          amount: number
          currency?: string
          stripe_payment_id?: string | null
          status?: PaymentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          case_study_id?: string | null
          amount?: number
          currency?: string
          stripe_payment_id?: string | null
          status?: PaymentStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Landing-page early-access signups. Not tied to users — a visitor
      // leaves an email long before there is any account to attach it to.
      // The two answers are slugs from lib/waitlist.ts, not free text.
      waitlist: {
        Row: {
          id: string
          email: string
          pain_frequency: PainFrequency
          price_willingness: PriceWillingness
          // Which wording the answers refer to. Slugs match across versions;
          // the questions do not. See migration 0013.
          survey_version: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          pain_frequency: PainFrequency
          price_willingness: PriceWillingness
          survey_version?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          pain_frequency?: PainFrequency
          price_willingness?: PriceWillingness
          survey_version?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      // Atomic unlock: checks balance, decrements, writes the ledger entry,
      // and flips status — all in one transaction. Returns the new balance.
      spend_credit: {
        Args: { p_case_study_id: string }
        Returns: number
      }
      // Service-role only. Idempotent on stripe_payment_id so a webhook
      // retry can't double-credit.
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_stripe_payment_id: string
        }
        Returns: number
      }
      // Atomic upsert-and-check. Raises 'rate_limit_exceeded' when the caller
      // has already had `p_max` compiles today. Returns the post-increment
      // count on success.
      //
      // Takes NO user id on purpose — the counter is keyed to auth.uid()
      // inside the function (migration 0009). Accepting one let any signed-in
      // caller exhaust another user's daily quota via PostgREST.
      rate_limit_compile: {
        Args: { p_max: number }
        Returns: number
      }
      // Atomic claim on a compile. Returns 'claimed' | 'in_progress' |
      // 'already_done' | 'not_found'. Takes no user id — it scopes every
      // statement to auth.uid() itself, the same lesson migration 0009 wrote
      // into rate_limit_compile.
      claim_compile: {
        Args: { p_case_study_id: string; p_stale_after: string }
        Returns: string
      }
      // Service-role only. Grants a one-time signup bonus of 1 credit,
      // idempotent per user_id via a 'signup_bonus' row in
      // credit_transactions. Returns the (possibly unchanged) balance.
      grant_signup_bonus: {
        Args: { p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      case_study_status: CaseStudyStatus
      payment_status: PaymentStatus
      review_role: ReviewRole
    }
    CompositeTypes: Record<never, never>
  }
}
