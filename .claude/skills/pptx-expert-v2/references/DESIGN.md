---
version: alpha
name: HC Team Executive Editorial
description: Warm editorial minimalism for Korean executive decision decks; dense evidence, restrained accents, and native PowerPoint editability.
colors:
  primary: "#16181D"
  secondary: "#F3F1EC"
  tertiary: "#E8503A"
  neutral: "#FFFFFF"
typography:
  h1:
    fontFamily: Pretendard
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  h2:
    fontFamily: Pretendard
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.015em"
  body-md:
    fontFamily: Pretendard
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: Pretendard
    fontSize: 0.72rem
    fontWeight: 400
    lineHeight: 1.3
rounded:
  sm: 2px
  md: 4px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
---

## Overview

경영진이 제목과 핵심 숫자만 훑어도 결론과 요청 결정을 이해하는 편집형 보고 디자인이다. 앱 UI가 아니라 리서치 보고서와 재무 브리핑의 문법을 따른다.

## Colors

- Primary는 제목·본문·핵심 구조에 사용한다.
- Secondary는 표 전체가 아니라 강조해야 할 한 행·한 영역에만 사용한다.
- Tertiary는 위험·변곡점·결정 요청 중 한 역할에만 사용한다.
- Positive `#148565`, caution `#D58A27`, information `#376D91`을 의미색으로 쓸 수 있다.
- 한 슬라이드에서 accent는 원칙적으로 하나만 사용한다.

## Typography

- 제목은 28~34pt, 최대 두 줄이며 주장형 문장이다.
- 큰 수치는 30~46pt. 비교 기준이 있을 때만 사용한다.
- 본문은 11~15pt, caption과 source는 8~9pt까지 허용한다.
- 문단 중앙정렬은 금지한다. 표지의 짧은 키워드만 예외다.
- 영문 대문자 label은 8~9pt, tracking을 넓게 사용한다.

## Layout

- 16:9, 13.333×7.5in
- 좌우 margin 0.90in, 상단 title zone 0.65~1.55in, 하단 source zone 6.65~7.10in
- 12-column mental grid를 사용하되 완전한 균등 분할을 피한다.
- 기본 비율은 7:5, 8:4, 5:7 중 메시지 우선순위에 따라 선택한다.
- sparse→dense→sparse 리듬을 의도한다.
- 한 장에 하나의 visual axis만 둔다.

## Elevation & Depth

그림자는 기본적으로 사용하지 않는다. 계층은 흰 공간, 명도 대비, 1px rule, 타이포 크기로 만든다.

## Shapes

- radius는 0~4px 수준. 모든 박스를 roundRect로 만들지 않는다.
- 큰 배경 패널보다 얇은 rule과 alignment로 그룹을 만든다.
- pill은 상태·기간·조건처럼 실제 의미가 있을 때만 쓴다.

## Components

- `claim-title`: 결론을 말하는 28~34pt 제목
- `evidence-strip`: 핵심 숫자·근거·해석을 수평으로 연결
- `decision-band`: 경영진 승인·보류·확인 요청을 한 문장으로 표시
- `source-note`: 출처·기준일·데이터 공백
- `owner-row`: 실행항목·오너·기한·완료조건

## Do's and Don'ts

- Do: 실제 데이터와 해석을 같은 시각축에 놓는다.
- Do: 슬라이드마다 강조 대상 하나를 정한다.
- Do: 표와 chart를 PowerPoint native object로 유지한다.
- Don't: 3~4개 둥근 card를 매 페이지 반복한다.
- Don't: 장식용 gradient, glow, icon badge를 사용한다.
- Don't: 외부 기업의 로고·캐릭터·template을 skill bundle에 복제한다.
