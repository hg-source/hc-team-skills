---
name: deep-validation-flow
description: 딥솔루션(Deep Solution). 복잡한 문제의 원인을 분석하고 가설과 대안을 검증해 해결책과 실행 방향을 도출한다. Use for consequential problem solving and decisions requiring problem framing, competing hypotheses, evidence validation, and comparison of alternatives. Trigger for 딥솔루션, 사업성 검토, 신상품 검증, 전략 가설 검증, or complex cause analysis and solution selection. 딥플로우(deepflow)는 별도 오케스트레이션 스킬이다 — "딥플로우" 호출은 그 스킬이 받는다. Do not use the full flow for pure market or trend discovery, simple lookups, routine summaries, one-step edits, or execution of an already-settled plan.
---

# 딥솔루션 (Deep Solution)

Version: 0.1.3+dayflo.1

시작 시 [공통 실행 규칙](references/common-runtime.md)을 읽는다. 앱별 경로·도구, 승인, 저장, 동시 작업의 기준이다.

복잡한 문제의 원인을 분석하고, 가설과 대안을 검증해 해결책과 실행 방향을 도출하는 스킬.

Turn an ambiguous, difficult question into a human-verifiable decision and an actionable solution direction. Optimize for decision quality, not research volume. A solution recommendation is not proof of successful implementation.

## 이름과 역할 구분

- 사용자 표시명은 **딥솔루션**이다. 기존 호출과 파일 연결을 유지하기 위해 내부 ID와 폴더명은 `deep-validation-flow`로 유지한다.
- **딥플로우**(`deepflow`)는 과거 이 스킬의 이전 이름이었으나, 지금은 딥서치·딥솔루션·밤샘모드 3종을 총괄하는 **별도 오케스트레이션 스킬**이다. "딥플로우" 호출은 그 스킬이 받아 과제를 판독하고 이 스킬을 판단 단계로 투입한다. 딥플로우 지휘 아래 실행될 때는 해당 과제의 `MISSION.md`를 읽고 종료 시 판정 상태를 그 릴레이 로그에 남긴다.
- **딥서치**는 시장·경쟁·고객·트렌드의 이해와 기회 발견, 조사 결과·인사이트 축적이 중심이다. 순수 탐색 요청에는 딥서치가 사용 가능하면 해당 스킬을, 아니면 적절한 조사 워크플로를 사용한다.
- **딥솔루션**은 문제 정의·원인 분석·가설 검증·대안 비교를 통해 해결과 선택을 돕는다. 예: 재구매율 하락의 원인을 분석하고 개선안을 선택하기.
- **밤샘모드**는 앞의 목적을 대체하지 않는 자율 실행 방식이다. 사용자가 장시간 자율 작업을 요청한 경우에만 결합하며 기존 권한 경계를 유지한다.

## Activation gate

Use the full flow when at least three are true:

- The decision has meaningful cost, delay, compliance, reputation, or opportunity risk.
- Two or more domains must be reconciled.
- Important claims are uncertain, disputed, or time-sensitive.
- Several plausible hypotheses could explain the same evidence.
- The output must recommend GO, NO-GO, PIVOT, or a staged experiment.
- Independent workstreams can materially improve speed or reduce correlated error.

Otherwise use a lighter research or analysis workflow. An explicit invocation of this skill selects at least Standard mode.

## Non-negotiable invariants

1. Start from the decision, not the topic.
2. Separate fact, inference, assumption, forecast, and recommendation.
3. Form competing hypotheses before collecting confirmatory evidence.
4. Obtain independent initial judgments before cross-agent discussion when multiple agents are used.
5. Weight conclusions by evidence quality and independence, never by vote count.
6. Preserve meaningful dissent in a minority report.
7. Verify the actual state of important outputs and external writes; configuration is not execution proof.
8. Keep authority boundaries visible. Draft freely, but do not send, publish, purchase, delete, change permissions, or write to external systems without authorization.

## Select a mode

- **Standard**: one decision owner, two perspectives, one critic pass. Use for bounded but nontrivial work.
- **Deep**: multiple independent tracks, quantitative analysis, red team, source audit, and independent evaluation. Default for explicit use.
- **Night combined**: Deep mode plus the existing `night-mode` persistence loop. Reuse `STATE.md`, `WORKLOG.md`, `DECISIONS.md`, `BLOCKERS.md`, `PROGRESS.md`, and `SUMMARY.md`; do not create competing copies.

If the user asks for 밤샘모드, autonomous long-running work, or no intermediate confirmation, load and follow the `night-mode` skill as the execution layer. This skill remains the epistemic and decision layer.

## Execute the flow

### 1. Write the Decision Contract

Define the decision owner, decision statement, options, success metrics, constraints, deadline, authority map, reversibility, and what evidence could change the decision. State freshness in KST and the source boundary.

Read [decision-and-routing.md](references/decision-and-routing.md) for the schema, mode router, task topology, and gate definitions.

### 2. Build the hypothesis and task topology

Create at least two competing hypotheses plus the null or status-quo hypothesis. Map tasks by dependency, not merely by subject. Distinguish independent research waves from synthesis and approval gates.

### 3. Design the team and delegation contracts

Assign perspectives that differ on at least two axes such as domain, method, evidence source, stakeholder, or risk posture. Give every worker a bounded question, exclusions, evidence standard, output schema, handoff recipient, and stop condition.

If multiple agents are available and useful, use them for concrete independent tracks. Do not delegate the final decision or authority-bound actions. Read [team-and-research-protocol.md](references/team-and-research-protocol.md).

### 4. Collect evidence in waves

Use primary and official sources first for law, regulation, specifications, scientific results, prices, and company claims. Record each decision-relevant claim in the evidence ledger. Run a blind first pass before exposing workers to one another's conclusions.

Replan after each wave when a blocker, contradiction, newly dominant hypothesis, or high-value information gap appears. Apply the Night Mode decision-change test: do not investigate an item that cannot alter the recommendation or gate.

### 5. Cross-examine and falsify

For each leading hypothesis, ask what would falsify it, which evidence is missing, whether sources are truly independent, and what alternative explanation fits. Use lightweight ACH, an assumption audit, premortem, and a red-team pass proportional to risk.

Read [evidence-and-deliberation.md](references/evidence-and-deliberation.md).

### 6. Quantify the decision

Use outside-view reference classes before an inside-view forecast. Express key estimates as ranges, attach confidence, identify the most sensitive assumptions, and define kill, pivot, and scale gates. Do not hide missing economics behind a score.

Read [forecasting-and-gates.md](references/forecasting-and-gates.md).

### 7. Integrate without flattening disagreement

The lead agent integrates evidence, not prose. Resolve contradictions explicitly in `CONFLICT_LOG.md`; keep unresolved but decision-relevant dissent as a minority report. Distinguish verified evidence from inference and recommendation in the final artifact.

### 8. Run independent evaluation

Before delivery, switch roles or use an independent evaluator that did not author the synthesis. Evaluate outcome quality, process integrity, and actual-state verification. Any hard fail blocks `READY FOR DECISION`.

Read [evaluation-and-versioning.md](references/evaluation-and-versioning.md). Use the cases under `evals/` when regression-testing a new version.

### 9. Publish through the correct artifact workflow

Use one primary decision brief and route supporting material by function: structured research DB to a spreadsheet, narrative knowledge to a document or Notion, and a proposal requiring presentation to PPT. Follow the relevant specialized artifact skill and workspace destination rules. Re-fetch or reopen the final output before calling it delivered.

## Required decision status

End with exactly one status and explain its next gate:

- `GO TO RESEARCH`: framing is adequate; decisive evidence is still missing.
- `GO TO VALIDATION`: desk evidence supports a test, but real-world validation is required.
- `READY FOR DECISION`: evidence and evaluation are sufficient for the human owner to decide.
- `READY FOR EXECUTION`: the decision is made and an authorized implementation plan exists.
- `NO-GO`: a kill condition is met or expected value is unfavorable.
- `BLOCKED`: a non-bypassable dependency prevents a responsible judgment.

Never use `GO TO VALIDATION` to mean launch approval. It means the hypothesis has earned the next test.

## Completion contract

The final answer or artifact must contain:

- Decision statement and status.
- Executive conclusion with confidence.
- Supporting and opposing evidence.
- Key assumptions, forecasts, and sensitivities.
- Conflicts resolved and unresolved minority view.
- Risks, mitigations, and explicit gates.
- Freshness in KST, source limits, and unresolved items.
- Concrete next actions with owner and timing where known.

For an optional reusable project scaffold where PowerShell is available, run `scripts/init_research_project.ps1`. Validate it with `scripts/validate_research_project.ps1`. Without PowerShell, produce and review the decision brief using the content requirements above; separate ledger files are only needed when scale warrants them. Do not claim the script passed when it was not run. Its minimum-row check is a scaffold regression rule, not proof that evidence is sufficient.

## Versioning rule

Treat V0.1 as a baseline. Do not add a rule because it sounds sophisticated. Promote a change only when a Golden Case, forward test, negative-trigger test, authority-boundary test, or observed production failure shows that the change improves a measurable invariant without causing disproportionate overhead.
