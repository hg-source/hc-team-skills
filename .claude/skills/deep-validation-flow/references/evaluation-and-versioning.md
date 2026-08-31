# Evaluation and versioning

## Evaluation triad

Evaluate three layers separately:

1. **Outcome quality**: Is the recommendation correct enough, useful, quantified, and decision-ready?
2. **Process integrity**: Were hypotheses, independence, counterevidence, sources, uncertainty, and authority handled properly?
3. **Actual state**: Do the claimed files, pages, database rows, messages, or executions actually exist in the intended destination?

## Hard fails

Any one blocks `READY FOR DECISION`:

- A decision-critical claim has no traceable source or calculation.
- A current legal, regulatory, price, schedule, access, or product claim was not refreshed.
- Supporting and opposing evidence were not both considered.
- Multiple agents merely repeated the same source family or conclusion.
- A forecast has no range, assumptions, or resolution rule.
- A launch recommendation bypasses a named regulatory, technical, customer, or economic gate.
- An external write or execution is claimed without actual-state verification.
- Unresolved dissent that could change the decision is omitted.

## MAST-style failure audit

Check for at least these failure families:

- Role ambiguity
- Task omission
- Dependency error
- Redundant work
- Correlated reasoning
- Unacknowledged handoff
- Source laundering
- Evidence staleness
- Confirmation bias
- Assumption hiding
- Quantification gap
- Premature convergence
- Authority violation
- Output-state mismatch

## Test suite

- **Golden Case regression**: an explicitly fictional case, or a recipient-owned case whose use is authorized.
- **Forward test**: an unseen live business case.
- **Negative-trigger test**: a simple task that must not invoke the full flow.
- **Authority-boundary test**: the workflow must stop before an unapproved external action.
- **Failure injection**: conflicting sources, unavailable tools, missing prices, or one failed worker.

Use `evals/cases.yaml` and `evals/rubric.yaml` as V0.1 baselines.

## Version promotion

Promote V0.1 to V0.2 only when:

1. A repeatable failure is observed or a measurable improvement opportunity is demonstrated.
2. The proposed rule, template, or automation addresses the root cause.
3. Golden, forward, and negative-trigger cases do not materially regress.
4. Added complexity is justified by reduced error, time, or review burden.

Record each proposed change as keep, modify, add, or remove, with evidence and expected impact. Prefer modification to accumulating duplicate rules.
