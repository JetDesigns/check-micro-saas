// Database schema types. Kept in sync manually with supabase/migrations/*.sql.
// If you later adopt the Supabase CLI, replace this file with the output of
// `supabase gen types typescript --local`.
//
// Each table entry must include `Relationships: []` (even empty) — the
// @supabase/postgrest-js GenericTable constraint requires it, and without it
// `.from(...).insert(...)` falls back to `never` and every write errors.

import type { PainFrequency, PriceWillingness } from '@/lib/waitlist'

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
}

// One section of the compiled case study. Named after the CSD process arc
// (Vision, Discovery, Signal, …); every section renders as:
//   {number} · The {label}
//   {subtitle}                ← serif H2 the model writes ("Designing for Dignity")
//   {body prose paragraphs}
//   {optional callout}
//
// The callout is where CSD-style rich elements live — an inline highlight
// box, big-number stats, or a numbered process list. Kept optional and
// per-section-restricted (see PROMPT + Callout renderer) so we never fake
// data the intake doesn't back.
export type NarrativeSection = {
  subtitle: string
  body: string
  callout: NarrativeCallout | null
}

// Discriminated union of the rich element kinds the case study page supports.
// Add a new kind here only after both the prompt and the <Callout> renderer
// handle it — the type IS the contract.
export type NarrativeCallout =
  | {
      kind: 'insight'
      // Pill label to the left of the box. Max ~4 words.
      // Examples: "Core Insight", "Design Insight", "The Bet".
      label: string
      // 1–2 sentence highlight, ≤180 characters.
      text: string
    }
  | {
      kind: 'stat'
      // 1–2 big-number tiles side by side.
      items: Array<{
        // The number itself, kept short: "40%", "3.5x", "85%", "30 min".
        value: string
        // Uppercase caption underneath, 3–6 words.
        label: string
      }>
    }
  | {
      kind: 'process'
      // 3–4 numbered mini-steps used for Discovery / Signal sections.
      steps: Array<{
        n: number
        // 2–4 word step title ("Contextual Inquiry", "Pattern Recognition").
        title: string
        // Single sentence ≤120 chars describing what happened at this step.
        text: string
      }>
    }

// The compiled narrative from /api/compile. Eight sections, ordered as the
// published page reads them. Section NAMES follow the CSD process/story arc;
// section CONTENT stays prospect-facing business writing, not portfolio brag.
export type CompiledNarrative = {
  vision: NarrativeSection
  discovery: NarrativeSection
  signal: NarrativeSection
  design: NarrativeSection
  testing: NarrativeSection
  launch: NarrativeSection
  growth: NarrativeSection
  reflection: NarrativeSection
}

// AI-inferred, anonymized meta grid rendered under the H1 on /c/[id].
// Persisted in case_studies.meta (jsonb) — see migration 0008.
export type CaseStudyMeta = {
  role: string
  client: string
  audience: string
  platform: string
  // Per-attachment caption, keyed by case_study_attachments.id (uuid). The
  // model writes one when it sees the attachment during /api/compile; the
  // renderer distributes attachments into inter-section slots and pulls the
  // caption from here. Missing entries render an empty caption.
  image_captions?: Record<string, string>
}

// The only section shown before payment. Everything else stays server-side
// until a credit is spent — see /api/compile and /api/unlock.
export const FREE_SECTION: keyof CompiledNarrative = 'vision'

export const NARRATIVE_SECTIONS: ReadonlyArray<{
  key: keyof CompiledNarrative
  label: string
  number: string
}> = [
  { key: 'vision', label: 'Vision', number: '01' },
  { key: 'discovery', label: 'Discovery', number: '02' },
  { key: 'signal', label: 'Signal', number: '03' },
  { key: 'design', label: 'Design', number: '04' },
  { key: 'testing', label: 'Testing', number: '05' },
  { key: 'launch', label: 'Launch', number: '06' },
  { key: 'growth', label: 'Growth', number: '07' },
  { key: 'reflection', label: 'Reflection', number: '08' },
] as const

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
          meta: CaseStudyMeta | null
          client_type: string | null
          project_type: ProjectType | null
          tone: Tone | null
          intake: Intake | null
          compiled_narrative: CompiledNarrative | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: CaseStudyStatus
          title?: string | null
          headline?: string | null
          meta?: CaseStudyMeta | null
          client_type?: string | null
          project_type?: ProjectType | null
          tone?: Tone | null
          intake?: Intake | null
          compiled_narrative?: CompiledNarrative | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: CaseStudyStatus
          title?: string | null
          headline?: string | null
          meta?: CaseStudyMeta | null
          client_type?: string | null
          project_type?: ProjectType | null
          tone?: Tone | null
          intake?: Intake | null
          compiled_narrative?: CompiledNarrative | null
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
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          pain_frequency: PainFrequency
          price_willingness: PriceWillingness
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          pain_frequency?: PainFrequency
          price_willingness?: PriceWillingness
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
