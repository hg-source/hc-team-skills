---
name: daily-review
description: 특정 날짜(기본=어제)의 작업을 종합한 데일리 리포트를 생성. git 변경 + 세션 트랜스크립트(.jsonl) 마이닝으로 주요 작업 요약·결과물 링크·그날 내가 한 주요 질문을 정리하고, 일자별 1페이지로 개인 노션 DB에 "데일리포트" 태그로 적재. "데일리 리포트", "일일 리뷰", "오늘 뭐 했지", "어제 작업 정리", "daily review", "daily report" 등을 언급하면 자동 실행.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
  - Task
  - mcp__claude_ai_Notion__notion-search
  - mcp__claude_ai_Notion__notion-fetch
  - mcp__claude_ai_Notion__notion-create-pages
  - mcp__claude_ai_Notion__notion-update-page
  - ReadMcpResourceTool
---

# daily-review (데일리 리포트)

특정 날짜의 작업을 종합한 **데일리 리포트**를 만든다.
일자별로 (1) 주요 작업 요약 + 결과물 링크, (2) 그날 내가 한 주요 질문/지시를 별도 정리하고,
**일자당 1개 노션 페이지**로 개인 DB에 "데일리포트" 태그를 달아 계속 적재한다.

> 핵심 원칙: git 커밋만 보지 말 것. 이 워크스페이스 작업의 상당수는 **커밋 없이 대화(세션)로** 진행된다.
> 반드시 해당 날짜의 **세션 트랜스크립트(.jsonl)도 파싱**해서 대화로 진행한 작업까지 포함한다.

## 0. 대상 날짜 결정

- 인자로 날짜(`YYYY-MM-DD`)가 오면 그 날짜. 없으면 **기본=어제**.
- "오늘"이라고 명시하면 오늘.

```bash
# 기본: 어제 (인자 있으면 그 값 사용)
TARGET="${1:-$(date -d 'yesterday' +%Y-%m-%d)}"   # 예: 2026-06-16
MONTH="${TARGET:0:7}"                              # 예: 2026-06
NEXT=$(date -d "$TARGET +1 day" +%Y-%m-%d)
DOW=(일 월 화 수 목 금 토); WD=${DOW[$(date -d "$TARGET" +%w)]}  # 한글 요일 (예: 화)
```

## 1. 데이터 수집

### 1-a. Git 변경사항

```bash
git log --since="$TARGET 00:00" --until="$TARGET 23:59" \
  --pretty=format:"%h %ad %s" --date=format:"%H:%M"
git log --since="$TARGET 00:00" --until="$TARGET 23:59" \
  --name-only --pretty=format: | sort -u | grep -v '^$'
```
변경 파일을 최상위 카테고리별(`10-projects/`, `20-operations/`, `30-knowledge/`, `40-personal/`, `.claude/`)로 그룹화.
**커밋이 없어도 정상** — 대화로만 진행한 날이 많다. 다음 단계(트랜스크립트)가 본체다.

### 1-b. 세션 트랜스크립트 마이닝 (필수)

해당 날짜에 활동한 세션 `.jsonl`을 찾는다. Claude 프로젝트 디렉토리에 워크스페이스별로 저장된다.

```bash
# 이 워크스페이스의 Claude 프로젝트 디렉토리들 (메인 + 워크트리)
PROJ="$HOME/.claude/projects"
# 대상 날짜에 수정된 루트 세션 jsonl (subagents/ 하위는 제외 — 본 세션만)
find "$PROJ" -path '*HC*' -name '*.jsonl' -not -path '*/subagents/*' \
  -newermt "$TARGET 00:00" ! -newermt "$NEXT 00:00" 2>/dev/null
```

찾은 각 세션에 대해 추출:
- **사용자 메시지** (role=user, tool_result 제외) = 그날의 실제 질문/지시 (시간순, 원문에 가깝게)
- **결과물**: 생성/수정한 파일, PPT/엑셀, 노션 페이지(ID·URL), 대시보드 배포, 커밋 해시
- 2~3문장 요약

> **대용량 주의**: 세션 파일은 흔히 1~5MB다. 파일이 크거나 여러 개면 **세션 1~2개씩 서브에이전트(general-purpose)에 병렬로 위임**해 파싱하고 요약만 받는다. 메인 컨텍스트에 원문을 통째로 올리지 말 것.
> 각 줄은 JSON 객체이며 `message` 안에 role/content가 있다. (환경에 따라 python 인터프리터가 스텁일 수 있으니 grep 또는 PowerShell `ConvertFrom-Json` 병용.)

### 1-c. Daily note + todos (있으면)

```bash
cat "./40-personal/41-daily/$MONTH/$TARGET.md" 2>/dev/null
cat "./40-personal/46-todos/active-todos.md" 2>/dev/null
```

### 1-d. Claude 토큰 사용량 (대상 날짜가 오늘이거나 어제일 때)

```bash
# node 스크립트로 JSONL 파싱 → 오늘 사용량 + 주간 트렌드
TOKEN_REPORT=$(node "./00-system/scripts/claude-token-usage.js" 2>/dev/null || echo "(토큰 데이터 없음)")
echo "$TOKEN_REPORT"
```

- 결과를 리포트의 `## Claude 토큰 사용량` 섹션으로 포함한다.
- 스크립트가 없거나 실패하면 섹션 생략 (에러 메시지 표시 안 함).

## 2. 리포트 구성 (출력 형식)

```markdown
# 데일리 리포트 {TARGET} ({요일})

> 작성: {작성일}. git 변경 + 세션 트랜스크립트 {N}건 마이닝 기반.

## 한눈에 보기
{그날을 2~4문장으로. 어떤 축의 일을 했는지.}

## 주요 작업
### 1. {작업 스트림명} — `{세션ID 앞 8자}`
- {무엇을 / 왜 / 결과}
- **결과물**: [{이름}]({링크}) — 노션 URL·파일경로·대시보드 URL·커밋 해시
### 2. ...

## 내가 한 주요 질문 / 지시   ← 별도 정리 (사용자 프롬프트)
- {원문에 가까운 핵심 질문·지시. 작업 스트림별로 묶어도 됨}
- ...

## 인사이트 / 이어갈 작업
- {패턴, 미완료, 머지 필요 산출물, 다음 액션}

## Claude 토큰 사용량
{1-d에서 수집한 TOKEN_REPORT 삽입. 없으면 섹션 생략.}
---
Sources: 세션 `{id1}`, `{id2}`, ... ({TARGET})
```

**규칙**
- **결과물 링크 필수**: 노션 페이지는 URL(`https://www.notion.so/{id}`), 로컬 파일은 경로, 대시보드는 배포 URL, 코드 변경은 커밋 해시로 연결. 없으면 생략.
- **"내가 한 주요 질문"은 반드시 별도 섹션**. 작업 요약에 녹이지 말고 사용자 프롬프트를 따로 모은다.
- 하드코딩된 프로젝트명 금지. 실제 그날 움직인 것으로 구성.

## 3. 로컬 저장 (비파괴)

데일리 노트 경로: `./40-personal/41-daily/{MONTH}/{TARGET}.md`
- **파일이 없으면**: 새로 생성.
- **파일이 이미 있으면** (daily-note 스킬의 아침 일정·계획 등이 들어있을 수 있음): **기존 내용을 덮지 말 것.** 파일 끝에 `## Daily Report` 섹션으로 리포트를 추가/갱신한다. (이미 `## Daily Report` 섹션이 있으면 그 섹션만 교체.)
- 배경/격리 세션에서 쓰기가 막히면 워크트리에 쓰고 머지 안내.

## 4. 노션 업로드 (개인 DB, "데일리포트" 태그)

**일자당 1페이지**로 개인 DB에 적재한다. (참조: [[reference_personal-notion]], [[notion-handler 스킬 v2]])

- **DB(data_source_id)**: `<YOUR_PERSONAL_DATA_SOURCE_ID>` (개인 DB)
- **도구**: `mcp__claude_ai_Notion__notion-create-pages` (parent = 위 data_source_id)
- **페이지 속성**:
  - `이름`(title): `데일리 리포트 {TARGET} ({요일})` (예: `데일리 리포트 2026-06-16 (화)`)
  - 페이지 아이콘(icon): `🗓️`
  - `구분`(select): **`데일리포트`** ← 태그
  - 나머지 필드(유관부서/항목구분/마감날짜/비고/사람)는 비워둠 (사용자가 노션 UI에서 직접)
- **본문은 토글 구조**: 큰 제목(`## 주요 작업`, `## 내가 한 주요 질문 / 지시`, `## 인사이트 / 이어갈 작업`)은 그대로 두고, 그 아래 각 항목을 `<details><summary>제목</summary>` 토글로 묶는다(children은 탭 들여쓰기). "한눈에 보기"는 토글 없이 요약 문단 그대로.
- **본문**: 위 2번 리포트 마크다운 전체 (결과물 링크 포함, 토글 구조). 단, **본문 맨 위 `# 데일리 리포트 ...` H1은 빼고** 올린다(제목은 `이름` 속성에 이미 있어 중복됨). 토글 문법(`<details>`)이 헷갈리면 MCP 리소스 `notion://docs/enhanced-markdown-spec`를 `ReadMcpResourceTool`로 확인.
- **업서트 (같은 날짜 = 같은 페이지, 필수)**: 업로드 전에 **반드시 해당 날짜 페이지를 먼저 검색**한다.
  - 검색: `notion-search` 또는 개인 DB 조회로 제목 `데일리 리포트 {TARGET}` (예: `데일리 리포트 2026-06-16`) 매칭.
  - **있으면** → 그 페이지를 `notion-update-page`(`replace_content`)로 **갱신**한다. 새 페이지를 만들지 않는다.
  - **없으면** → `notion-create-pages`로 새로 생성한다.
  - 결과: 같은 날짜를 오후에 1차 정리하고 다음 날 다시 업데이트해도 **항상 동일한 1개 페이지가 갱신**된다. (일자당 1페이지 불변)

업로드 후 생성/갱신된 노션 페이지 URL을 사용자에게 알려준다.

## 원칙

- git만 보지 않는다 — **세션 트랜스크립트 마이닝이 본체**.
- 대용량 트랜스크립트는 서브에이전트 병렬 위임.
- 결과물은 항상 링크로 연결.
- 사용자 질문/지시는 별도 섹션으로.
- 개인 DB 적재는 일자당 1페이지, `구분=데일리포트` 태그.
