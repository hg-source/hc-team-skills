# HC Team Workspace 가이드

> Claude Code + Johnny Decimal 기반 PKM 워크스페이스 (팀 공용 버전).
> 이 파일은 Claude Code가 매 세션 시작 시 자동으로 읽는 프로젝트 지침입니다.
> 본인 프로필·회사 컨텍스트는 각자 로컬에서 채우세요("워크스페이스 세팅해줘" → `setup-workspace`).

## 폴더 구조 (Johnny Decimal)

```
00-inbox/      # 임시 캡처 (20개 미만 유지, 주간 처리)
00-system/     # 시스템 설정, 템플릿, 가이드
10-projects/   # 활성 프로젝트 (시한부)
20-operations/ # 지속적 운영 (종료일 없음)
30-knowledge/  # 지식 (00-wiki + 도메인 아카이브)
40-personal/   # 개인 노트 (daily, weekly, ideas, reflections, todos)
50-resources/  # 외부 자료, 첨부파일
90-archive/    # 완료/중단 항목
```

### 주요 하위 폴더

| 번호 | 폴더 | 용도 |
|------|------|------|
| **00-wiki** | 30-knowledge/ | 지식 위키 (복리 축적). `wiki-ingest`/`wiki-lint` 스킬로 운영 |
| 41-daily | 40-personal/ | Daily Notes (월별: 41-daily/YYYY-MM/) |
| 42-weekly | 40-personal/ | Weekly Review |
| 43-ideas | 40-personal/ | 아이디어 캡처 |
| 46-todos | 40-personal/ | active-todos.md |
| 37-claude-code | 30-knowledge/ | Claude Code 관련 지식 |
| 01-templates | 00-system/ | Daily/Weekly 등 템플릿 |

## 파일 명명 규칙

| 유형 | 형식 | 예시 |
|------|------|------|
| Daily Note | `YYYY-MM-DD.md` | 2026-04-24.md |
| 주제 노트 | `주제명.md` | thinking-partner.md |
| JD 폴더 | `XX-name` 또는 `XX.YY-name` | 37-claude-code, 37.01-learning |
| 중복 파일명 | JD prefix 필수 | 18-progress-tracker.md |

## Inbox 관리 (00-inbox)

- **목적**: 임시 캡처, 영구 저장소 아님
- **규칙**: 20개 미만 유지
- **주기**: 주간 처리 (Capture → Process → Organize)

## 첨부파일 (50-resources/attachments/)

- 모든 비텍스트 파일 저장
- 명명: `[관련노트]_[설명].[ext]`

## Skills 사용

이 워크스페이스의 `.claude/skills/`에 팀 공용 스킬 25종이 있습니다.
스킬은 키워드 기반으로 **자동 트리거**됩니다(수동 슬래시 커맨드 아님).
전체 목록·트리거 키워드는 [README.md](README.md) 참고.

예: "오늘 daily note 만들어줘" → `daily-note` 자동 실행
예: "할 일 추가해줘" → `todo` 자동 실행

### 별도 설정이 필요한 스킬

- `web-crawler-ocr` — 별도 **Gemini API 키** 필요 (README 참고)
- `youtube-to-notion` — `npm install` + `NOTION_TOKEN` 필요
- Notion 연동 스킬 — DB ID는 플레이스홀더. 각자 자기 DB ID로 교체 (실제 사내 DB ID는 사내 교육자료 참고)

## 시작하기

처음 쓰는 워크스페이스라면 **"워크스페이스 세팅해줘"** 라고 말해 `setup-workspace`를 실행하세요.
프로필 작성 + 폴더 구조 + 템플릿 + 첫 daily note 생성을 한 번에 안내합니다.

## 보안 규칙 (공유 저장소)

- 사내 데이터(매출·지표·고객·계정 정보)와 개인정보는 이 저장소에 커밋하지 않습니다.
- API 키·토큰·`.env`는 절대 커밋 금지 (`.gitignore`가 1차 방어).
- 개인 프로필·회사 컨텍스트는 로컬 전용으로만 관리합니다.

---

_이 파일은 팀 공용 버전입니다. 개인·회사 고유 정보는 포함하지 않습니다._
