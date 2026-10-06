import type { ApproachDiagram } from '@/lib/approach-diagram'

// Database schema types. Kept in sync manually with supabase/migrations/*.sql.
// If you later adopt the Supabase CLI, replace this file with the output of
// `supabase gen types typescript --local`.
//
// Each table entry must include `Relationships: []` (even empty) — the
// @supabase/postgrest-js GenericTable constraint requires it, and without it
// `.from(...).insert(...)` falls back to `never` and every write errors.

import type { CaseStudy } from '@/lib/case-study-blocks'
import type { PainFrequency, PriceWillingness } from '@/lib/waitlist'

// NOTE: `case_studies.compiled_narrative` is typed `unknown` on purpose. It
// holds documents in the deleted 8-section sales-genre shape, and nothing
// reads it any more. The column is kept because dropping it cannot be undone
// and deferring costs nothing; the replacement shape lives in
// lib/case-study-blocks.ts. See check-revision-prompt.md.

/**
 * What the Focused Fix path writes to `case_studies.generated` (migration 0015).
 *
 * A different shape from `document`, which holds the {spine, blocks} object the
 * legacy pipeline produces. The two run side by side behind a dev flag, so this
 * is a second column rather than a reinterpretation of the first.
 *
 * `caption` and `alt` are separate strings because they are two different jobs
 * and must not be collapsed into one. `[[figure:<imageId>]]` markers in the
 * markdown are where each figure sits.
 */
export type GeneratedPage = {
  markdown: string
  figures: { imageId: string; caption: string; alt: string }[]
  /** One entry per page-level choice, each citing the fact that drove it. */
  variance_register: { choice: string; value: string; driver: string }[]
  branch: 'metric' | 'contribution'
  /**
   * The visual Approach carries (§9), or null.
   *
   * NOT part of the model's reply. It is derived from the intake in
   * `lib/approach-diagram.ts` and attached after validation, which is what makes
   * "never infer a product structure the user did not supply" structural: there
   * is no path by which an invented part name reaches the page. It also means
   * adding it cost no extra model call.
   *
   * Null is an ordinary outcome, and the common one.
   */
  diagram: ApproachDiagram | null
  /**
   * Passages the writer had to reason its way to and could not confirm from the
   * answers. Flagged rather than asserted; empty is the normal case.
   */
  needs_confirmation?: string[]
  /**
   * How this page was made. Stored beside it because the ablation runs compare
   * pages, and a comparison is only readable if each page says which model wrote
   * it, how many attempts it took, and what the code checks still had to say.
   */
  meta?: GeneratedMeta
}

export type GeneratedMeta = {
  model: string
  attempts: number
  /** Non-blocking findings from validateFocusedFix, kept so they are not lost. */
  warnings: string[]
  durationMs: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  /**
   * One line per attempt that was thrown away, in order.
   *
   * A rejected attempt used to vanish the moment a later one succeeded, which is
   * how a run whose first attempt was truncated came to look like a clean run
   * that merely took two tries. What a page cost to produce is part of reading it.
   */
  attemptLog: string[]
  /** Field paths blanked for this run, when it was an ablation. Empty otherwise. */
  blanked: string[]
}

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
//
// EVERY ANSWER IS OPTIONAL, deliberately. The wizard never blocks "next"
// (check-revision-prompt.md § Phase 2), so any answer can be empty when the
// row is written. The previous version of this type marked five fields
// required and the submit path reached them through `as unknown as Intake` —
// a cast that produced an object missing its own required properties without
// a word of complaint from anyone. Optional here is the truth.
//
// `title` and `client_type` MUST keep their key names: lib/case-studies.ts
// reads both by name to fill their own columns on case_studies, and renaming
// either one orphans every existing row.
//
// THE TRAILING IDS ARE LOAD-BEARING. Each one names the input this field
// supplies in prompts/focused-fix-inputs.md § B, which in turn names the rule
// in prompts/focused-fix-output.md that consumes it. A field with no id is a
// field no rule reads — section 2 of the manifest calls those orphans, and
// three of them (tone, the register sample, "what would you do differently")
// were removed in this rebuild rather than carried. Do not add a field here
// without an id to put beside it.
export type Intake = {
  /**
   * 2 = the shape below. Absent means a row written before the rebuild, which
   * carries `LegacyIntake`. /api/compile routes on this, and that routing is
   * not cosmetic: a v1 row handed to the spec prompt would be missing eleven
   * of its required inputs, and a prompt that lists what it did not get is an
   * invitation to supply it (§10.1).
   */
  schema_version?: 2

  // --- Step 1 — about the project -----------------------------------------
  title?: string                 // I52 (+ I3 partial) — the engagement in one line
  product_and_users?: string     // I1, I2 — what it is, who uses it by occupation
  client_type?: string           // I5 — industry and rough size
  /**
   * I6. The one fact only the user holds, which is why the spec's appendix
   * resolves anonymisation as an explicit user choice rather than a default
   * the generator picks. Absent means no — never name the client, anywhere on
   * the page, in a caption, or in Credits.
   */
  client_may_be_named?: boolean
  client_name?: string           // I6 — only meaningful with the toggle on
  year?: string                  // I19  ┐ split from the old fused `year_duration`, so
  duration?: string              // I18  ┘ §3.2's "only fields with a real value" reaches each
  role?: string                  // I4 — required by §4.1 and §4.6
  collaborators?: Collaborator[] // I54 — roles, not just names, or Credits cannot be built
  agency?: string                // I53 — the third party in a three-party engagement

  // --- Step 2 — what you walked into --------------------------------------
  reported_problem?: string      // I7 — in the reporter's own framing (§5.3)
  /**
   * I31. Marks `reported_problem` as the client's exact words, which is what
   * §8.5 needs before it may quote anything and what opens two of the five
   * page-opening options in §6.4c. Absent means an attributed report — rung 1
   * of §10.3's ladder — and a quotation is never reconstructed from it.
   */
  reported_verbatim?: boolean
  diagnosis?: string             // I8 + I9 — what it actually was, and where it showed
  diagnosis_provenance?: Provenance // I12 — feeds the provenance line (§4.2)
  cost_to_client?: string        // I11 — the stakes, in what they already spend or risk

  // --- Step 3 — the decisions ---------------------------------------------
  decisions: Decision[]

  // --- Step 4 — how the work fit together ---------------------------------
  approach_framework?: string    // I13 — only where the designer named one themselves
  constraints?: string           // I14 + I15 — what changed the shape of the solution

  /**
   * The product's own parts, and where this work sat inside them.
   *
   * Three answers rather than two, and the third is the one that matters. Which
   * parts were worked on is a coverage map; which of those had nothing like them
   * already is a different claim, and it is the claim the Approach diagram's
   * caption makes. Deriving the second from the first would be fabrication.
   *
   * `product_areas` is raw, as typed. The two arrays hold names parsed out of it,
   * and `product_areas_new` is always a subset of `product_areas_worked`.
   */
  product_areas?: string
  product_areas_worked?: string[]
  product_areas_new?: string[]
  authority_split?: string       // I17 — only where a split genuinely shaped the work

  // --- Step 5 — where it landed -------------------------------------------
  /** I40. Metadata only. §10.5 bars it from ever becoming Outcome's claim. */
  outcome_status?: OutcomeStatus
  /**
   * Whether a measurement exists at all. The seven fields below are what
   * `evidenceBranch` reads; this toggle only decides whether to ask for them.
   * Routing on a digit instead is the defect section A of the manifest
   * describes — see lib/wizard-steps.ts.
   */
  has_measurement?: boolean
  measure?: string               // I41 — what was measured
  baseline_value?: string        // I42 ┐ before
  baseline_period?: string       // I42 ┘
  baseline_source?: string       // I43 — required, not optional: no source, no number (§7.3)
  after_value?: string           // I44 ┐ after. The delta is derived, never asked
  after_period?: string          // I44 ┘
  attribution_limit?: string     // I45 — the only guard on borrowed causality
  team_change?: string           // I39 — what the team can now do, or no longer has to
  client_response?: string       // I36 (+ I37) — their words, after delivery

  // --- Screens, flat across every slot ------------------------------------
  image_notes: ImageNote[]

  /**
   * I25 — which pain point each fix answers.
   *
   * Written by the review screen, not by a step. §6.3 requires this per fix
   * block and refuses a section-level substitute, and the manifest proposed a
   * picker column to collect it. A picker asks the designer to classify their
   * own work, so the pipeline infers the mapping from step 2 and step 3 and
   * the user confirms or edits it — the same infer/propose/confirm shape §9.4
   * specifies for the diagram, and for the same reason: nothing about someone's
   * work gets published on a claim they never saw.
   */
  tiebacks?: Tieback[]
}

export type Collaborator = { name: string; role: string }

export type Tieback = { decisionId: string; painPoint: string }

/** I12. How the diagnosis was reached — the cheapest credibility on the page. */
export type Provenance =
  | 'audit'
  | 'user_research'
  | 'analytics'
  | 'testing'
  | 'client_told_me'

// One decision unit. The wizard asks for decisions because people can recall
// them; it never asks for "requirements", which nobody can.
//
// `prior_behaviour` and `consequence` are two fields on purpose. Merging them
// would repeat the fusion the manifest criticises in the old problem field,
// where the report, the diagnosis and the evidence shared one answer and the
// answer supplied whichever the user thought of first. A field that asks for
// two facts gets one, and the one it loses here is justification move 4 —
// which is the whole difference between a case study and a changelog (§6.1).
export type Decision = {
  /** Stable across edits and reorders. Ties a fix block to its tie-back. */
  id: string
  decided: string                // I20 — the decision itself, one line
  /**
   * I26. When true, `prior_behaviour` holds the ordered beats of how the thing
   * works (I30) instead of what it used to do, and the Before screen slot is
   * not offered — there is nothing to show. Drives §6.2's first selection rule.
   */
  no_prior_version?: boolean
  prior_behaviour?: string       // I23, or I30's walkthrough when the toggle is on
  consequence?: string           // I24 — what someone no longer has to do
  why: string                    // I21 — what made them decide it
  rejected?: string              // I22 — the option they turned down
  client_request?: string        // I32 — their words, where a request prompted this fix
  relations?: DecisionRelations
}

/**
 * I27, I28, I29 — how this decision sits against the others.
 *
 * Three independent members, not an enum: a fix can break the pattern, repeat
 * across many places, and depend on another one at the same time. There is no
 * "none" option because the absence of all three IS none. Between them they
 * decide which shape §6.2 selects for the block, and they are the only input
 * that could mark exceptions in a diagram — which is why the manifest gives
 * the diagram no question of its own.
 */
export type DecisionRelations = {
  /** The pattern the rest of the work follows, named. Set only when it applies. */
  breaks_pattern?: string
  repeated_treatment?: boolean
  /** Another Decision.id. Moves that fix earlier only where §4.4 requires it. */
  depends_on?: string
}

// What one uploaded screen is doing in the case study. `orderIndex` is the
// join key: uploadAttachments writes order_index straight from the array
// index, so position at submit time is what ties a note to its row. Notes are
// carried by attachment id inside the wizard and only flattened to indices at
// submit, so removing a screen mid-flow cannot shift notes onto the wrong one.
//
// The old `shows` string is gone. It held either a Decision.id or one of two
// fixed slot names, and the user picked it from a dropdown. Slot position now
// carries both the state and the decision link, which is what let the dropdown
// go — and `state` is what §6.2's asset veto and §8.6's after-only caption rule
// were missing entirely (I35).
export type ImageNote = {
  orderIndex: number
  /**
   * Where the screen was uploaded. 'problem' screens are §5.4 exhibits and
   * belong to no decision; 'before' and 'after' belong to the decision named
   * below. The two carry different caption jobs — see the output contract.
   */
  slot: ImageSlot
  /** A Decision.id. Absent, and only absent, for slot 'problem'. */
  decisionId?: string
  notice?: string                // I34 — what someone should notice here
}

export type ImageSlot = 'problem' | 'before' | 'after'

// ---------------------------------------------------------------------------
// The pre-rebuild shape
// ---------------------------------------------------------------------------
//
// Rows written before schema_version 2 carry this instead. Nothing writes it
// any more and the wizard cannot produce it, but two things still read it: the
// legacy pipeline behind the dev flag, and any re-compile of an old row.
//
// It is a separate type rather than a pile of optional keys on Intake because
// the two shapes disagree about what the same question means — `problem` fused
// the report, the diagnosis and the evidence into one answer, and `metrics`
// fused six components into one. Typing them as alternatives is what stops a
// v1 answer being read as if it were a v2 one.
export type LegacyIntake = {
  title?: string
  client_type?: string
  year_duration?: string
  role?: string
  team_credit?: string
  voice_sample?: string
  problem?: string
  why_it_mattered?: string
  constraints?: string
  approach_framework?: string
  decisions: Decision[]
  image_notes: LegacyImageNote[]
  outcome_status?: OutcomeStatus
  metrics?: string
  what_changed?: string
  do_differently?: string
}

export type LegacyImageNote = {
  orderIndex: number
  /** A Decision.id, or one of the two fixed slots that no longer exist. */
  shows: string
  notice?: string
}

/** What comes off `case_studies.intake`, before anything has narrowed it. */
export type StoredIntake = Intake | LegacyIntake

/** The narrowing. One place, so nothing has to re-derive the rule. */
export function isFocusedFixIntake(intake: StoredIntake): intake is Intake {
  return (intake as Intake).schema_version === 2
}

export type OutcomeStatus =
  | 'shipped'
  | 'proof_of_concept'
  | 'not_launched'
  | 'handed_off'

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
          intake: StoredIntake | null
          compiled_narrative: unknown | null
          document: CaseStudy | null
          generated: GeneratedPage | null
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
          intake?: StoredIntake | null
          compiled_narrative?: unknown | null
          document?: CaseStudy | null
          generated?: GeneratedPage | null
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
          intake?: StoredIntake | null
          compiled_narrative?: unknown | null
          document?: CaseStudy | null
          generated?: GeneratedPage | null
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
      // One row per model call, written only by the service role. See
      // migration 0014: the pipeline makes up to four calls per compile and
      // nothing else records what they cost.
      agent_runs: {
        Row: {
          id: string
          case_study_id: string
          agent: string
          model: string
          attempt: number
          input_tokens: number
          cache_read_input_tokens: number
          cache_creation_input_tokens: number
          output_tokens: number
          duration_ms: number
          ok: boolean
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_study_id: string
          agent: string
          model: string
          attempt?: number
          input_tokens?: number
          cache_read_input_tokens?: number
          cache_creation_input_tokens?: number
          output_tokens?: number
          duration_ms?: number
          ok?: boolean
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_study_id?: string
          agent?: string
          model?: string
          attempt?: number
          input_tokens?: number
          cache_read_input_tokens?: number
          cache_creation_input_tokens?: number
          output_tokens?: number
          duration_ms?: number
          ok?: boolean
          error?: string | null
          created_at?: string
        }
        Relationships: []
      }
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
