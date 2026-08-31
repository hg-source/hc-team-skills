[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [ValidateSet("Scaffold", "Decision")]
    [string]$Phase = "Scaffold"
)

$ErrorActionPreference = "Stop"
$fullPath = [System.IO.Path]::GetFullPath($Path)
if (-not (Test-Path -LiteralPath $fullPath -PathType Container)) {
    throw "Project directory does not exist: $fullPath"
}

$required = @(
    "DECISION_CONTRACT.md",
    "TASK_TOPOLOGY.md",
    "TEAM_CHARTER.md",
    "EVIDENCE_LEDGER.csv",
    "FORECAST_LEDGER.csv",
    "CONFLICT_LOG.md",
    "DECISION_BRIEF.md",
    "EVAL_REPORT.md"
)

$errors = [System.Collections.Generic.List[string]]::new()
foreach ($name in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $fullPath $name) -PathType Leaf)) {
        $errors.Add("Missing required file: $name")
    }
}

if ($errors.Count -eq 0) {
    $evidenceHeader = Get-Content -LiteralPath (Join-Path $fullPath "EVIDENCE_LEDGER.csv") -Encoding utf8 -TotalCount 1
    $forecastHeader = Get-Content -LiteralPath (Join-Path $fullPath "FORECAST_LEDGER.csv") -Encoding utf8 -TotalCount 1

    foreach ($field in @("claim_id", "claim_type", "claim", "source_url_or_path", "independence_family", "verification_status")) {
        if ($evidenceHeader -notmatch "(^|,)$([regex]::Escape($field))(,|$)") { $errors.Add("Evidence ledger missing field: $field") }
    }
    foreach ($field in @("forecast_id", "metric", "horizon", "low", "base", "high", "resolution_date", "status")) {
        if ($forecastHeader -notmatch "(^|,)$([regex]::Escape($field))(,|$)") { $errors.Add("Forecast ledger missing field: $field") }
    }
    foreach ($section in @("Decision and status", "Supporting and opposing evidence", "Assumptions, forecasts, and sensitivity", "Conflicts and minority view", "Risks, mitigations, and gates", "Freshness, limits, and unresolved items")) {
        if (-not (Select-String -LiteralPath (Join-Path $fullPath "DECISION_BRIEF.md") -Pattern ([regex]::Escape($section)) -Quiet)) {
            $errors.Add("Decision brief missing section: $section")
        }
    }
}

if ($Phase -eq "Decision" -and $errors.Count -eq 0) {
    $evidenceRows = @(Import-Csv -LiteralPath (Join-Path $fullPath "EVIDENCE_LEDGER.csv"))
    if ($evidenceRows.Count -lt 3) { $errors.Add("Decision phase requires at least 3 evidence rows.") }

    $allowedStatus = "GO TO RESEARCH|GO TO VALIDATION|READY FOR DECISION|READY FOR EXECUTION|NO-GO|BLOCKED"
    if (-not (Select-String -LiteralPath (Join-Path $fullPath "DECISION_BRIEF.md") -Pattern "Status:\s*($allowedStatus)" -Quiet)) {
        $errors.Add("Decision brief does not contain an allowed status.")
    }
    if (-not (Select-String -LiteralPath (Join-Path $fullPath "EVAL_REPORT.md") -Pattern "Hard fail present:\s*no" -Quiet)) {
        $errors.Add("Independent evaluation has not cleared hard fails.")
    }
}

if ($errors.Count -gt 0) {
    Write-Output "VALIDATION FAILED"
    $errors | ForEach-Object { Write-Output "- $_" }
    exit 1
}

Write-Output "VALIDATION PASSED"
Write-Output "Path: $fullPath"
Write-Output "Phase: $Phase"
Write-Output "Required files: $($required.Count)"
