---
name: visual-deck
description: >-
  조사·분석·보고 결과를 시각화된 16:9 슬라이드로 전달하며 HTML을 편집 가능한 정본으로
  유지할 때 사용한다. Trigger for 결과를 HTML로, 시각화, 발표용, HTML-first
  deck. 스토리보드 설계부터 단계별 승인으로 덱을 함께 만드는 요청(PPT덱,
  "슬라이드 만들자", "슬라이드로 해줘", "PPT 만들자", 스토리보드)은 ppt-deck을
  사용한다. 사용자가 처음부터 네이티브 편집형 PPTX를 명시하거나 기존 PPTX를 크게 수정해야
  하면 pptx-expert-v2 또는 presentations를 사용한다. 웹사이트·웹앱·대시보드·A4 문서
  또는 일반 HTML 코드 수정에는 사용하지 않는다.
---

# Visual Deck

Use one invariant: **HTML first, PPT or PDF last.**

## Workflow

1. Pick a template by purpose from the Templates table below; default to [assets/executive-minimal.html](assets/executive-minimal.html) when unclear.
2. Create an editable 16:9 HTML deck as the canonical source.
3. Revise the HTML until content and design are settled.
4. Generate PPT or PDF only when the user asks for final conversion.

A normal request such as “PPT로 만들어줘” means: make and show the HTML draft first, collect revisions, then make the PPT. If the user asks to complete everything in one pass, still create and verify HTML first, then export during the same task. Skip HTML only when the user explicitly asks to skip it.

## Routing boundary

Treat a short HTML request according to the referenced artifact, not the word `HTML` alone.

- Use this skill for “이번 조사 결과를 HTML로 만들어줘”, “분석 결과를 HTML로 정리해줘”, “이 보고서를 HTML로 보여줘”, or equivalent requests where the output is meant to communicate a result visually.
- Do not use it for “이 HTML 버그를 고쳐줘”, “랜딩페이지를 HTML로 만들어줘”, “대시보드 HTML을 수정해줘”, or requests whose primary output is a website, web app, dashboard, email template, or source-code component.
- If the user explicitly requests a continuous scrolling document or A4 handout, preserve that format instead of forcing slides.

## HTML defaults

- Use a 16:9 slide canvas with previous/next controls, keyboard arrows, mobile swipe, progress, current/total page display, and overview mode.
- Treat HTML as the editable canonical source. PPT and PDF are derived outputs and must not become the source of truth.
- Use claim-led titles and one primary message per slide.
- Favor flat editorial composition, strong typography, and evidence hierarchy over decorative cards, gradients, and effects.
- Keep external-share files standalone when practical and remove internal paths or sensitive information.

## Templates

Pick the template by the deliverable's purpose. When the purpose is unclear, default to `executive-minimal`.

| Template | 용도 | 시각 언어 | 핵심 패턴 |
|---|---|---|---|
| [assets/executive-minimal.html](assets/executive-minimal.html) | 경영 보고 · 전략 메시지 (기본값) | 종이톤 에디토리얼, 타이포 중심 | Statement · 비교 · 원칙 그리드 · 플로우 |
| [assets/data-report.html](assets/data-report.html) | 실적 리뷰 · 데이터 분석 보고 | 화이트 + 딥틸 단일 리드컬러, 컨설팅 그리드 | SCR 요약(bold-bullet) · KPI 4종 · 라인/가로막대/도넛 차트 · 판단 열 표 · 2×2 매트릭스 · 타임라인 · 리스크/의사결정 |
| [assets/pitch-impact.html](assets/pitch-impact.html) | 신사업 제안 · 투자 심의 · 피칭 | 다크 + 그라디언트, 빅넘버 | Sequoia 구조(Purpose→Problem→Solution→Why now→Market→Competition→Model→Traction→Roadmap→Team→Ask) |
| [assets/learning-friendly.html](assets/learning-friendly.html) | 교육 · 온보딩 · 워크숍 | 웜톤 + 라운드 카드, 큰 글씨 | 학습목표(≤4) · 섹션 디바이더 · 개념+비유 · 3단계 실습 · Do/Don't · 퀴즈 · 리캡 · 실천 과제 |

Template rules:

- Sample content in each template is placeholder demo data — replace all of it with the real deliverable's content.
- Reuse each template's pattern CSS as a library: copy a pattern block (KPI row, chart, table, matrix) into another template when the story needs it, keeping that deck's color tokens.
- Keep 데이터 슬라이드 principles: claim-led title, one emphasis per chart, every KPI with a comparison basis (목표·전기·추세), status colors only for status.
- Add a new template only after a distinct real use case needs a materially different visual language. Preserve the common navigation engine (auto slide numbering, keyboard, swipe, overview, progress, print) and HTML-first behavior across templates — the `<script>` block is shared verbatim.

## Minimum verification

Before delivery, verify slide fit at 16:9, navigation, keyboard, swipe, overview, page count, progress, print layout, JavaScript syntax, links, assets, and external-sharing safety. When exporting, compare the derived PPT or PDF against the final HTML and report unavoidable differences.
