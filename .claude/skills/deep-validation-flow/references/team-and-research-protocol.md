# Team and research protocol

## Role architecture

Use the smallest team that creates real cognitive diversity:

- **Decision lead**: owns framing, topology, integration, and final status.
- **Domain researchers**: independently gather evidence from distinct domains or source classes.
- **Quantifier**: owns economics, scenarios, ranges, and sensitivity.
- **Contrarian or red team**: searches for disconfirming evidence and failure paths.
- **Source auditor**: checks authority, freshness, independence, and claim-source fit.
- **Independent evaluator**: judges the completed work without having authored it.

One person or agent may hold multiple roles in Standard mode, but the evaluator must perform a fresh pass after synthesis.

## Delegation Contract

Every delegated task must state:

1. Decision context and the bounded question.
2. In-scope and out-of-scope work.
3. Initial hypotheses, including what would falsify them.
4. Preferred sources and freshness requirements.
5. Required output: claims, evidence, counterevidence, gaps, confidence, handoff.
6. Dependencies and intended recipient.
7. Stop condition and authority boundaries.
8. File ownership when shared files are involved.

Workers are not alone in the codebase or workspace. They must preserve others' edits and must not overwrite shared synthesis artifacts. The lead owns shared ledgers unless exclusive ownership is assigned.

## Epistemic independence

Before the first exchange gate:

- Do not give workers another worker's conclusion.
- Ask each worker for an initial judgment and confidence.
- Vary at least two of: domain, method, source class, stakeholder, time horizon, or risk posture.
- Treat repeated claims derived from one original source as one evidence family.

After the blind pass, share structured claims and invite revision. Record meaningful belief changes and their evidence.

## Structured handoff

Each handoff contains:

| Field | Meaning |
|---|---|
| Task ID | Stable identifier |
| Initial judgment | Conclusion before peer exposure |
| Claim IDs | Decision-relevant claims contributed |
| Counterevidence | Evidence against the worker's own view |
| Confidence | Probability or calibrated low/medium/high |
| Conflicts | Contradictions requiring integration |
| Missing evidence | Gaps that could change the decision |
| Recommended next task | Only if it passes the decision-change test |
| Handoff status | sent, acknowledged, incorporated, rejected with reason |

## Rolling replan triggers

Rebuild the topology when:

- A foundational definition or constraint changes.
- A leading hypothesis loses decisive support.
- Two authoritative sources materially conflict.
- A real-world constraint makes an option infeasible.
- New information creates a higher-value test.
- A worker or tool failure removes a critical evidence path.

Continue unaffected tracks. Do not restart the entire project unless the Decision Contract changes.
