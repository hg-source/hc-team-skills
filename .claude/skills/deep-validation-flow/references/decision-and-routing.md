# Decision contract and routing

## Decision Contract

Complete these fields before broad research:

| Field | Required content |
|---|---|
| Decision owner | Person or role that decides |
| Decision statement | One sentence beginning with a decision verb |
| Options | At least status quo plus plausible alternatives |
| Success metrics | Quantified outcomes and time horizon |
| Constraints | Budget, regulation, capability, timing, brand, ethics |
| Reversibility | One-way door or two-way door |
| Deadline | Decision date, not report date |
| Authority map | Recommend, agree, input, decide, perform |
| Decision-changing evidence | Findings that would change option, timing, or gate |
| Source boundary | Included/excluded sources and freshness in KST |
| Definition of Enough | Numeric stopping thresholds by workstream |

If a missing field would materially change the entire direction, obtain it from available context. Ask the user only when it cannot be discovered and a reasonable assumption would be risky. Record assumptions explicitly.

## Method router

Select methods from the decision need:

| Need | Minimum methods |
|---|---|
| Causal explanation | Competing hypotheses, alternative explanation test, timeline |
| Market opportunity | Outside view, customer evidence, competition, unit economics |
| Product feasibility | Regulation, technical feasibility, supply/OEM, stability or QA plan |
| Strategic choice | Options, scenario ranges, sensitivities, premortem |
| Forecast | Reference class, base rates, forecast ledger, calibration |
| High downside risk | Red team, kill gates, source audit, independent evaluator |

MECE is a useful coverage heuristic, not a truth guarantee. Overlap is acceptable when it exposes interaction risk.

## Task topology

Model dependencies before assigning workers:

1. **Frame**: decision contract, hypotheses, issue map.
2. **Independent wave**: domains or methods that can begin without one another.
3. **Exchange gate**: structured handoff of claims, evidence, conflicts, and gaps.
4. **Targeted wave**: research driven by contradictions or high-value uncertainty.
5. **Integration**: evidence-weighted synthesis by the lead.
6. **Challenge**: red team, source audit, independent evaluation.
7. **Human gate**: approval for the decision or external action.

Do not parallelize work that depends on a shared unresolved definition. Do not serialize truly independent evidence gathering.

## Gate semantics

- `GO TO RESEARCH`: authorize the next desk-research wave.
- `GO TO VALIDATION`: authorize a bounded experiment, OEM check, customer test, prototype, legal review, or other real-world validation.
- `READY FOR DECISION`: the human owner has enough evidence to choose.
- `READY FOR EXECUTION`: an explicit decision and implementation authority exist.
- `NO-GO`: stop unless the named kill condition changes.
- `BLOCKED`: a critical dependency is unavailable and no responsible proxy exists.

Every status must name the evidence needed for the next transition.
