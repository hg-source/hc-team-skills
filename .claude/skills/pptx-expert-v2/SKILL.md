---
name: pptx-expert-v2
description: >-
  사용자가 네이티브 편집형 PPTX를 명시적으로 원하거나 기존 PowerPoint를 대폭 수정하고,
  PowerPoint 렌더링·시각 QA까지 필요한 경영진·전략·분석 보고서에 사용한다. 주장형
  스토리라인, 역할별 레이아웃, 템플릿 분석과 수정-재검증을 수행한다. HTML-first 덱을
  정본으로 유지하거나 웹 슬라이드만 필요한 요청은 visual-deck을 사용한다.
license: MIT
metadata:
  hermes:
    tags: [pptx, presentation, executive-reporting, design-system, visual-qa]
    related_skills: [powerpoint, design-md, executive-decision-reporting]
---

# PPTX Expert v2

Version: 0.1.0+dayflo.1

Platform: Windows for PowerPoint native rendering; planning and static analysis are cross-platform.

## Overview

이 스킬은 PPTX를 '내용을 카드에 채우는 작업'이 아니라 **의사결정 메시지 설계 → 레이아웃 선택 → 편집 가능한 개체 생성 → PowerPoint 렌더링 → 비평·수정**의 반복 작업으로 다룬다.

핵심 품질 기준은 장식이 아니라 다음 네 가지다.

1. 경영진이 슬라이드 제목만 읽어도 결론과 결정사항을 이해한다.
2. 페이지 역할에 따라 시각 문법이 달라진다.
3. 텍스트·표·도형·차트는 PowerPoint에서 계속 수정할 수 있다.
4. 첫 렌더링을 최종본으로 취급하지 않는다.

## When to Use

- 경영진 보고, 전략안, 실적 분석, 조직안, 포트폴리오, 투자·Go/No-Go 의사결정 PPTX
- 기존 사람 템플릿을 보존하면서 내용만 교체·확장할 때
- 'AI 티가 적고 사람이 만든 듯한' 덱이 필요할 때
- PPTX 생성 후 PNG/PDF 렌더링과 시각 QA까지 요구될 때

다음에는 사용하지 않는다.

- 단순 파일 형식 변환
- 발표용 웹 슬라이드만 필요한 경우
- 원본 디자인의 수정·재배포 권한이 불명확한 외부 템플릿 복제

## Required Inputs

작업 시작 전에 다음을 확보한다. 검색 가능한 경우 사용자에게 다시 묻지 않는다.

- 청중과 보고 목적
- 이번 회의에서 받아야 할 결정 1~3개
- 출처·기준일이 있는 사실과 숫자
- 추론·가정·데이터 공백
- 원하는 분량과 수정 가능성
- 내부 템플릿 또는 참고 덱의 사용 권한

완료 기준: `deck.audience`, `deck.decision`, 슬라이드별 `title`, `role`, `layout_family`, `visual`이 plan JSON에 존재한다.

## Pipeline

### 1. Message Map

원자료를 곧바로 슬라이드에 넣지 않는다.

1. 사실·추론·가정·데이터 공백을 분리한다.
2. 회의 후 달라져야 하는 결정이나 행동을 한 문장으로 쓴다.
3. 슬라이드마다 제목을 결론 문장으로 쓴다.
4. 근거는 제목을 증명하는 데 필요한 최소 단위만 남긴다.

금지 제목: `매출 현황`, `핵심 요약`, `전략`, `조직도`, `다음 단계`.

권장 제목: `CM2 개선이 6월 손익 전환을 견인했습니다`.

### 2. Layout Plan

`references/layout-catalog.md`에서 페이지 역할에 맞는 레이아웃을 선택한다. 동일 레이아웃을 관성적으로 반복하지 않는다.

```bash
python .claude/skills/pptx-expert-v2/scripts/validate_plan.py path/to/plan.json
```

검증이 실패하면 PPTX를 만들지 않는다.

- 같은 `layout_family` 연속 사용 금지(표지·구분면 제외)
- 카드 그리드는 전체의 30% 이하
- 표지·구분면 외 제목은 주장형 문장
- 모든 페이지에 명시적인 시각물 타입 필요

완료 기준: validator exit code 0.

### 3. Template Decision

#### 사람이 만든 내부 템플릿이 있는 경우 — 우선

```bash
python .claude/skills/pptx-expert-v2/scripts/analyze_pptx.py input.pptx --out template-analysis.json
```

분석 결과에서 다음만 추출한다.

- 슬라이드 크기
- 반복되는 타이포·색상
- 레이아웃별 좌표와 여백
- 표지·본문·표·차트·결론 페이지의 구성 원리

원본 텍스트·사진·로고를 별도 권한 없이 skill bundle에 복사하지 않는다.

#### 템플릿이 없는 경우

- `scripts/pptx-deck-builder.js`를 기반으로 네이티브 PPTX 생성
- `references/DESIGN.md` 토큰 사용
- 표는 반드시 builder의 `table()` 사용
- `writeAndVerify()`로 OOXML 열 너비 재검증

### 4. Visual Grammar

각 페이지에 주 시각축 하나를 정한다.

- 추세: annotated chart
- 수치 변화: bridge / slope / variance strip
- 비교: contrast table / paired columns
- 조직: ownership map
- 로드맵: staggered milestones
- 포트폴리오: matrix / sequence / gate map
- 리스크: exposure map
- 다음 행동: owner-deadline rows

차트·표를 장식용 카드 안에 넣지 않는다. 색은 의미에만 사용하고 배경색 면적은 최소화한다.

### 5. Generate Editable PPTX

- 텍스트는 텍스트 상자
- 표는 native PowerPoint table
- 단순 도식은 native shape/line
- 데이터 차트는 native chart 또는 편집 가능한 vector group
- 스크린샷은 증거 자체가 이미지인 경우에만 사용
- 이미지로 납작하게 만든 전체 슬라이드는 금지

페이지마다 `source`, `as-of`, `fact/assumption` 상태를 필요한 수준으로 표기한다.

### 6. PowerPoint Native Render

Windows PowerPoint COM을 사용한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  .claude/skills/pptx-expert-v2/scripts/render_and_inspect.ps1 `
  -PptxPath "C:\path\deck.pptx" -OutDir "C:\path\qa"
```

생성물:

- `rendered/Slide*.PNG`
- PDF
- `audit.json`
- `extracted-text.txt`

완료 기준: slide count가 예상과 같고 PowerPoint가 오류 없이 열고 export한다.

### 7. Critic Pass

첫 렌더링에서 문제를 최소 하나 찾는다는 태도로 검사한다.

#### 내용

- 제목이 결론인가
- 근거가 제목을 증명하는가
- 사실·추론·가정이 섞이지 않았는가
- 숫자에 기간·단위·비교 기준이 있는가
- 경영진 결정사항이 명확한가

#### 시각

- 텍스트 잘림·겹침
- 유사한 카드·패널 반복
- 과도한 둥근 모서리·그림자·그라데이션
- 페이지 간 밀도 리듬 부재
- 지나치게 균등한 대칭
- 장식용 아이콘
- 주 시각축이 둘 이상 경쟁
- 제목과 본문 위계 부족
- 0.5인치 미만 외곽 여백

#### 편집성

- 텍스트·표·도형이 native object인가
- 표가 이미지로 변환되지 않았는가
- 차트 데이터와 라벨을 수정할 수 있는가

### 8. Fix and Re-verify

1. 발견한 문제를 기록한다.
2. 원인에 해당하는 code/layout/token을 수정한다.
3. 영향을 받은 슬라이드를 다시 생성한다.
4. PowerPoint로 다시 render한다.
5. 새 문제와 회귀가 없는지 검사한다.

최소 한 번의 fix-and-verify cycle 없이는 완료를 선언하지 않는다.

## Anti-AI Hard Rules

전체 규칙은 `references/anti-ai-style.md`를 읽는다. 특히 다음은 강제한다.

1. 동일 레이아웃을 2장 연속 사용하지 않는다.
2. 카드 그리드를 기본 선택지로 사용하지 않는다.
3. 모든 불릿에 아이콘을 붙이지 않는다.
4. 이유 없는 보라·파랑 gradient/glow를 사용하지 않는다.
5. 모든 shape에 둥근 모서리와 그림자를 일괄 적용하지 않는다.
6. 제목 아래 장식용 선을 넣지 않는다.
7. 한 장에 주 시각물은 하나만 둔다.
8. 여백은 남은 공간이 아니라 의도된 정보 위계다.
9. 데이터 없음은 추정치로 채우지 않는다.
10. 기업 디자인은 복제하지 않고 일반 원칙으로 추상화한다.

## Common Pitfalls

1. **템플릿 우선 사고** — 내용을 미리 정해진 box에 끼워 넣지 않는다. 메시지 역할이 먼저다.
2. **페이지 다양성=무작위** — 레이아웃은 달라도 grid, type scale, palette는 동일해야 한다.
3. **큰 숫자만 강조** — 비교 기준과 판단이 없으면 숫자를 크게 만들지 않는다.
4. **렌더링 생략** — PPTX 생성 성공은 시각 품질 성공이 아니다.
5. **외부 자산 오인** — 공개 다운로드와 오픈소스·AI 학습 허용은 다르다.
6. **AGPL 코드 흡수** — 참고는 가능하지만 사내 skill code로 복사하기 전에 의무를 검토한다.
7. **원본 덮어쓰기** — 입력 템플릿을 수정하지 않고 새 경로에 저장한다.

## 선택 기능 의존성

편집형 PPTX 생성은 최초 1회 `scripts` 폴더에서 `npm install`을 실행해 고정된 Node.js 의존성을 설치한다. 렌더링 검증은 Windows PowerPoint가 설치된 환경에서만 가능하다.

## Verification Checklist

- [ ] 사실·추론·가정·데이터 공백이 분리됨
- [ ] 의사결정 1~3개가 명시됨
- [ ] plan validator exit 0
- [ ] 페이지 역할별 layout family가 다름
- [ ] 편집 가능한 PPTX로 생성됨
- [ ] `writeAndVerify()` 또는 동등한 OOXML 검증 통과
- [ ] PowerPoint native render 성공
- [ ] audit의 overflow/placeholder 오류 0건
- [ ] 전체 슬라이드 PNG 육안·비전 검사 완료
- [ ] 최소 한 번 수정 후 재렌더링 완료
- [ ] 변경 파일·핵심 변경·검증 결과 보고
