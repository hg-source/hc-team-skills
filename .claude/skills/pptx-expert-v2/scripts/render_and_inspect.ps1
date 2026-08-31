param(
  [Parameter(Mandatory=$true)][string]$PptxPath,
  [Parameter(Mandatory=$true)][string]$OutDir
)
$ErrorActionPreference = 'Stop'
$PptxPath = [System.IO.Path]::GetFullPath($PptxPath)
$OutDir = [System.IO.Path]::GetFullPath($OutDir)
$renderDir = Join-Path $OutDir 'rendered'
$pdfPath = Join-Path $OutDir (([System.IO.Path]::GetFileNameWithoutExtension($PptxPath)) + '.pdf')
$auditPath = Join-Path $OutDir 'audit.json'
$textPath = Join-Path $OutDir 'extracted-text.txt'
New-Item -ItemType Directory -Path $renderDir -Force | Out-Null
Get-ChildItem -LiteralPath $renderDir -Filter '*.PNG' -ErrorAction SilentlyContinue | Remove-Item -Force

$app = New-Object -ComObject PowerPoint.Application
$pres = $null
try {
  $pres = $app.Presentations.Open($PptxPath, $true, $false, $false)
  $pres.SaveAs($pdfPath, 32)
  $pres.Export($renderDir, 'PNG', 1600, 900)
  $slides = @()
  $lines = @()
  $totalOverflowCount = 0
  $totalPlaceholderCount = 0
  $placeholderPattern = '(?i)lorem|ipsum|xxxx|placeholder|click to (add|edit)'
  foreach ($slide in $pres.Slides) {
    $shapeCount = $slide.Shapes.Count
    $textShapeCount = 0
    $pictureCount = 0
    $tableCount = 0
    $overflows = @()
    $placeholders = @()
    $lines += "## Slide $($slide.SlideIndex)"
    foreach ($shape in $slide.Shapes) {
      if ($shape.Type -eq 13) { $pictureCount += 1 }
      if ($shape.HasTable) {
        $tableCount += 1
        for ($r = 1; $r -le $shape.Table.Rows.Count; $r++) {
          for ($c = 1; $c -le $shape.Table.Columns.Count; $c++) {
            $cellText = $shape.Table.Cell($r,$c).Shape.TextFrame.TextRange.Text.Trim()
            if ($cellText) {
              $lines += $cellText
              if ($cellText -match $placeholderPattern) { $placeholders += $cellText }
            }
          }
        }
      }
      if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
        $textShapeCount += 1
        $t = $shape.TextFrame.TextRange.Text.Trim()
        if ($t) {
          $lines += $t
          if ($t -match $placeholderPattern) { $placeholders += $t }
        }
        try {
          $bw = [double]$shape.TextFrame2.TextRange.BoundWidth
          $bh = [double]$shape.TextFrame2.TextRange.BoundHeight
          $sw = [double]$shape.Width
          $sh = [double]$shape.Height
          if ($bw -gt ($sw + 2) -or $bh -gt ($sh + 2)) {
            $overflows += [ordered]@{shape=$shape.Name; boundWidth=[math]::Round($bw,1); width=[math]::Round($sw,1); boundHeight=[math]::Round($bh,1); height=[math]::Round($sh,1)}
          }
        } catch {}
      }
    }
    $lines += ''
    $totalOverflowCount += $overflows.Count
    $totalPlaceholderCount += $placeholders.Count
    $slides += [pscustomobject][ordered]@{
      index=$slide.SlideIndex
      shapeCount=$shapeCount
      textShapeCount=$textShapeCount
      pictureCount=$pictureCount
      tableCount=$tableCount
      overflowCount=$overflows.Count
      overflows=$overflows
      placeholderCount=$placeholders.Count
      placeholders=$placeholders
    }
  }
  [System.IO.File]::WriteAllLines($textPath, $lines, [System.Text.UTF8Encoding]::new($false))
  $audit = [ordered]@{
    file=$PptxPath
    slideCount=$pres.Slides.Count
    pdf=$pdfPath
    renderDir=$renderDir
    slides=$slides
    totalOverflowCount=$totalOverflowCount
    totalPlaceholderCount=$totalPlaceholderCount
  }
  $audit | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $auditPath -Encoding UTF8
  Write-Output ($audit | ConvertTo-Json -Depth 4 -Compress)
}
finally {
  if ($pres) { $pres.Close() }
  $app.Quit()
  if ($pres) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null }
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
