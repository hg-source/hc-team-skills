[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [string]$Title = "Deep Validation Project",
    [ValidateSet("Standard", "Deep", "Night")]
    [string]$Mode = "Deep",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$fullPath = [System.IO.Path]::GetFullPath($Path)
if (-not (Test-Path -LiteralPath $fullPath)) {
    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
}

$timestamp = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId(
    [DateTimeOffset]::UtcNow,
    "Korea Standard Time"
).ToString("yyyy-MM-dd HH:mm 'KST'")

$templates = [ordered]@{
    "DECISION_CONTRACT.md" = @'
# {{TITLE}} — Decision Contract

- Mode: {{MODE}}
- Created: {{TIMESTAMP}}
- Decision owner: [확인 필요]
- Decision statement: [결정 동사로 시작]
- Deadline: [확인 필요]
- Reversibility: [one-way / two-way]
- Freshness boundary: [KST 기준일]

## Options

1. Status quo
2. Option A
3. Option B

## Success metrics and constraints

| Item | Definition | Threshold | Horizon |
|---|---|---:|---|
| Primary outcome | [산정 필요] | [산정 필요] | [확인 필요] |

## Authority map

| Role | Owner |
|---|---|
| Recommend | [확인 필요] |
| Agree | [확인 필요] |
| Input | [확인 필요] |
| Decide | [확인 필요] |
| Perform | [확인 필요] |

## Competing hypotheses

- H1:
- H2:
- H0 / status quo:

## Decision-changing evidence

- 

## Definition of Enough

| Workstream | Numeric stop condition |
|---|---|
| Evidence | [확인 필요] |
| Quantification | [확인 필요] |
| Validation | [확인 필요] |
'@
    "TASK_TOPOLOGY.md" = @'
# Task Topology

| Task ID | Question | Dependency | Parallel group | Owner | Output | Status |
|---|---|---|---|---|---|---|
| F01 | Decision framing | none | frame | lead | DECISION_CONTRACT.md | pending |
| R01 | Independent evidence track A | F01 | wave-1 | unassigned | structured handoff | pending |
| R02 | Independent evidence track B | F01 | wave-1 | unassigned | structured handoff | pending |
| Q01 | Quantification and sensitivity | F01 | wave-1 | unassigned | forecast ledger | pending |
| I01 | Evidence-weighted integration | R01,R02,Q01 | synthesis | lead | decision brief | pending |
| V01 | Red team and independent evaluation | I01 | challenge | unassigned | EVAL_REPORT.md | pending |
'@
    "TEAM_CHARTER.md" = @'
# Team Charter

## Shared rules

- Independent initial judgments precede peer exposure.
- Facts, inferences, assumptions, forecasts, and recommendations stay distinct.
- The lead owns shared ledgers unless exclusive ownership is assigned.
- No worker sends, publishes, purchases, deletes, changes permissions, or writes externally without authorization.

## Delegation contracts

| Task ID | Role | Bounded question | Evidence standard | Exclusions | Stop condition | Handoff recipient |
|---|---|---|---|---|---|---|
| R01 | [assign] | [define] | [define] | [define] | [define] | lead |

## Handoff schema

- Initial judgment and confidence
- Claim IDs and source families
- Counterevidence
- Conflicts and missing evidence
- Recommended next task if decision-changing
- Status: sent / acknowledged / incorporated / rejected with reason
'@
    "EVIDENCE_LEDGER.csv" = "claim_id,claim_type,claim,hypothesis,direction,source_title,source_url_or_path,publisher,publication_date,accessed_kst,source_class,independence_family,directness,freshness,limitations,confidence,owner,verification_status`r`n"
    "FORECAST_LEDGER.csv" = "forecast_id,metric,horizon,reference_class,base_rate,low,base,high,confidence,key_assumptions,evidence_or_model,resolution_date,actual,score,status`r`n"
    "CONFLICT_LOG.md" = @'
# Conflict Log

| Conflict ID | Claims in conflict | Source quality and independence | Resolution | Remaining uncertainty | Decision impact |
|---|---|---|---|---|---|
| C001 | [add] | [assess] | unresolved | [add] | [add] |

## Minority report

- Dissenting view:
- Evidence supporting it:
- Why the lead did not adopt it:
- Evidence that would make it dominant:
'@
    "DECISION_BRIEF.md" = @'
# {{TITLE}} — Decision Brief

## Decision and status

- Decision statement:
- Status: GO TO RESEARCH
- Confidence:
- Next gate:

## Executive conclusion

[Write the decision-ready conclusion.]

## Supporting and opposing evidence

| Side | Claim IDs | Interpretation |
|---|---|---|
| Supporting | | |
| Opposing | | |

## Assumptions, forecasts, and sensitivity

- 

## Conflicts and minority view

- 

## Risks, mitigations, and gates

| Risk | Leading indicator | Mitigation | Kill/Pivot/Scale threshold | Owner |
|---|---|---|---|---|

## Next actions

| Action | Owner | Timing | Expected decision impact |
|---|---|---|---|

## Freshness, limits, and unresolved items

- Freshness:
- Source boundary:
- 확인 필요:
'@
    "EVAL_REPORT.md" = @'
# Independent Evaluation

## Result

- Evaluator:
- Independent from synthesis: [yes/no]
- Outcome quality: [pass/fail]
- Process integrity: [pass/fail]
- Actual-state verification: [pass/fail]
- Hard fail present: [yes/no]
- Final status allowed: [yes/no]

## Findings

| Severity | Invariant | Finding | Evidence | Required correction |
|---|---|---|---|---|

## MAST-style failure audit

- [ ] Role ambiguity
- [ ] Task omission or dependency error
- [ ] Redundant or correlated work
- [ ] Handoff failure
- [ ] Source laundering or staleness
- [ ] Confirmation bias or assumption hiding
- [ ] Quantification gap
- [ ] Premature convergence
- [ ] Authority violation
- [ ] Output-state mismatch
'@
}

foreach ($key in $templates.Keys) {
    $existing = Join-Path $fullPath $key
    if ((Test-Path -LiteralPath $existing) -and -not $Force) { throw "Existing scaffold; use a new run folder or review before -Force." }
}
foreach ($entry in $templates.GetEnumerator()) {
    $destination = Join-Path $fullPath $entry.Key
    if ((Test-Path -LiteralPath $destination) -and -not $Force) {
        throw "Refusing to overwrite existing file: $destination. Re-run with -Force only if overwrite is intended."
    }
    if (Test-Path -LiteralPath $destination) {
        $backup = $destination + "_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss") + "_" + [guid]::NewGuid().ToString("N")
        Copy-Item -LiteralPath $destination -Destination $backup -ErrorAction Stop
    }
    $content = $entry.Value.Replace("{{TITLE}}", $Title).Replace("{{MODE}}", $Mode).Replace("{{TIMESTAMP}}", $timestamp)
    [System.IO.File]::WriteAllText($destination, $content, [System.Text.UTF8Encoding]::new($false))
}

Write-Output "Created Deep Solution scaffold at: $fullPath"
Write-Output "Mode: $Mode"
Write-Output "Files: $($templates.Count)"
