# Generated pages, kept for comparison

Every file here is the raw `markdown` from a generated envelope, exactly as the model
returned it. They are committed because the next change to the specification or the
pipeline is read as a diff against them, and until now they existed only in `.dev/`, which
is ignored — one `rm -rf` from gone.

`.dev/generated/` stays ignored and stays scratch. A page only lands here when something is
going to be compared against it.

All runs are the `handover` fixture on `claude-sonnet-5-5` at `effort: 'high'`, so a diff
between any two of them is the specification and the pipeline, never the input.

## Before the audit

The three pages the output audit was written against.

| File | Row | Attempts | Notes |
|---|---|---|---|
| `wizard-run.md` | `3cef9afd-b00f-4c18-b65b-a830a89ca7c9` | 2 | Through the wizard in a browser. **The first attempt was truncated at `max_tokens`**, so the kept page was written under the old retry note telling the model to be more compact — which is part of why it reads thin |
| `fixture-run.md` | `c18b49ed-f51c-48f3-9508-dea95c94ce77` | 1 | `npm run fixture`, 65s, ~$0.09 |
| `dry-run.md` | — | 1 | `npm run fixture -- --dry`, 74s, no database row |

What the audit found in these, in short: no fabrication and almost no unused input, but the
variance register claimed `dominant_section: Problem` on a page whose Solution ran 1.8×
longer — in all three — and the tie-backs were one syntactic frame repeated per block
("This is the … described in Problem").

## After the validator changes

| File | Row | Attempts | Notes |
|---|---|---|---|
| `round2-dry.md` | — | 2 | First run with the new checks. Attempt 1 was **rejected on `dominance`** and the model corrected itself to `Solution` |
| `round2-wizard-path.md` | `90493c5b-aa20-40aa-8e6a-c63aa85537a0` | 2 | Same, through the database path. No truncation: `agent_runs` reads `0:ok \| 1:ok` |
| `round2-final.md` | — | **1** | After the contract learned to say the register is checked against the page. 61s, back to ~$0.09. **This is the current baseline** |
| `round2-blank-diagnosis.md` | — | 1 | Ablation: `--blank diagnosis`. No invention — the model rebuilt the diagnosis from the decision fields and the tie-backs, which are the same facts. Evidence that `diagnosis` is substantially redundant with step 3 |

## After Approach gained a visual

| File | Row | Attempts | Notes |
|---|---|---|---|
| `round4-approach-visual.md` | — | 1 | The first page with a guaranteed visual in Approach. The markdown is unchanged in kind — the diagram lives in the envelope's `diagram` field, not in the prose — so a diff against `round2-final.md` shows only how the writing moved, which is what makes this pair worth keeping |

The diagram that page carries, which the markdown does not contain:

```
1  Freeze the note
2  Sort by escalation   (breaks the pattern)
3  Hold escalated notes
```

## After the Approach diagram became a contract

| File | Row | Attempts | Notes |
|---|---|---|---|
| `round6-approach-contract.md` | — | 1 | The floor form is gone and no visual is drawn. Approach renders as prose, which is what §9.7 asks for. The envelope carries a validated `set-exception` contract derived from the intake — four parts worked on, one with no precedent — and the markdown makes no reference to it |

## Reading a diff against these

`round2-final.md` is what a new run should be compared with. Five things the audit named,
all of which that page passes and a regression would show up in:

1. The register's `dominant_section` is the section that is actually longest.
2. No two tie-backs share an opening frame, and none says "described in Problem".
3. The fix blocks do not all close on the same construction.
4. No sentence of the specification appears on the page.
5. The cost figure the designer supplied still carries the stakes in Problem.
