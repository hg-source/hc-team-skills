---
name: notion-handler
description: Notion 데이터베이스/페이지 관리 (공식 Notion MCP 기반). "노션", "Notion", "노션에 저장", "결과물 저장", "DB 만들어", "데이터베이스", "페이지 추가", "노션 조회", "노션 검색", "설문 DB", "대시보드" 등을 언급하면 자동 실행.
---

# Notion Handler Skill (MCP 기반)

> **v2 — 공식 Notion MCP(`mcp__claude_ai_Notion__*`)를 직접 호출합니다.**
> 더 이상 자체 Python 스크립트(`NOTION_TOKEN`)를 쓰지 않습니다. (구버전은 §부록 참조)

이 스킬은 **결과물 저장**과 **DB 조회·쿼리**를 가장 자주 쓰는 두 흐름으로 보고 최적화했습니다.

## MCP 도구 호출 준비

Notion MCP 도구는 `mcp__claude_ai_Notion__*` 이름을 가집니다. 세션에서 deferred 상태일 수 있으니, 호출 전 한 번 스키마를 로드하세요:

```
ToolSearch query: "select:mcp__claude_ai_Notion__notion-create-pages,mcp__claude_ai_Notion__notion-fetch,mcp__claude_ai_Notion__notion-search,mcp__claude_ai_Notion__notion-update-page"
```

> **포크 금지**: 결과물 저장 흐름은 본문 콘텐츠가 현재 대화에 있으므로, 서브에이전트로 포크하지 말고 **메인 컨텍스트에서 직접** 실행합니다.

---

## 0. 저장 대상 DB 결정 (저장 시 가장 먼저)

| 조건 | DB | data_source_id |
|------|-----|----------------|
| **기본값** ("개인 노션" 언급 없음) | 클로드 결과물DB (팀) | `<YOUR_TEAM_DATA_SOURCE_ID>` |
| "개인 노션" 키워드 포함 | 개인 클로드결과물DB | `<YOUR_PERSONAL_DATA_SOURCE_ID>` |

기본은 팀 DB, "개인 노션" 키워드가 있을 때만 개인 DB. 키워드 없으면 **무조건 팀 DB**. (실제 DB ID는 사내 교육자료 참고 — 각자 자기 노션 DB ID로 플레이스홀더를 교체해 사용)

---

## 1. 결과물 저장 ⭐ (최우선 흐름)

분석/문서 결과를 기본 팀 DB에 한 항목으로 저장하는 흐름.

### 1-1. 팀 DB 스키마 (클로드 결과물DB)

| 속성 | 타입 | 저장 시 처리 |
|------|------|------|
| `이름` | title | Claude가 결과물 제목 작성 (필수) |
| `항목구분` | multi_select | 내용 보고 자동 분류 — 아래 옵션 중 택1~2 |
| `작업도구` | multi_select | **자동 — 항상 `클로드` 포함** (아래 규칙 참조) |
| `유관부서(팀)` | multi_select | 내용 보고 자동 분류 — `영업`·`마케팅`·`기획`·`운영` 중 |
| `사람` | person | **비워둠** (생성 시 생략) |
| `생성 일시` | created_time | 자동 — 건드리지 않음 |

**`항목구분` 옵션 (2026-06-14 검증)**: `분석` · `정리` · `문서` · `보고` · `자사몰` · `퍼포먼스` · `교육`

**`작업도구` 옵션 (2026-06-20 추가)**: `클로드` · `코덱스` · `제미나이` · `기타`

> ⭐ **`작업도구` 자동 태깅 규칙**: 이 스킬은 Claude Code에서 실행되므로, 결과물 저장 시 `작업도구`에 **항상 `클로드`를 자동 포함**합니다 (사용자가 별도 지시 안 해도 매번). 다른 도구(코덱스/제미나이 등)도 함께 쓴 경우에만 추가로 붙입니다. 개인 노션 DB(§1-3)에는 이 속성이 없으므로 적용하지 않습니다.

> 스키마는 변할 수 있으므로, 분류 옵션이 의심되면 저장 전 `notion-fetch`로 `collection://<YOUR_TEAM_DATA_SOURCE_ID>`를 한 번 확인.

### 1-2. 저장 호출 (`notion-create-pages`)

`properties`는 **속성명 → SQLite 값** JSON 맵입니다. multi_select는 **JSON 배열 문자열**로 전달합니다.

```jsonc
mcp__claude_ai_Notion__notion-create-pages({
  "parent": { "type": "data_source_id", "data_source_id": "<YOUR_TEAM_DATA_SOURCE_ID>" },
  "pages": [{
    "properties": {
      "이름": "6월 캠페인 성과 분석",
      "항목구분": "[\"분석\", \"퍼포먼스\"]",
      "작업도구": "[\"클로드\"]",
      "유관부서(팀)": "[\"마케팅\"]"
    },
    "content": "## 핵심 요약\n- 핵심 지표 개선 요약\n\n## 상세\n본문은 Notion-flavored Markdown으로 작성..."
  }]
})
```

**주의사항**
- `content`에는 **페이지 제목을 넣지 않음** (제목은 `이름` 속성으로만).
- multi_select 값: `"[\"분석\"]"` 처럼 JSON 배열을 문자열로. 단일 값도 배열.
- **`작업도구`는 매번 `클로드`를 기본 포함** (생략 금지). 다른 AI 도구를 같이 썼다면 `"[\"클로드\", \"코덱스\"]"`처럼 추가.
- `사람`·`생성 일시`는 생략 (person 비움, created_time 자동).
- 저장 후 반환되는 **페이지 URL을 사용자에게 보고**.

### 1-3. 개인 노션 저장

`data_source_id`를 `<YOUR_PERSONAL_DATA_SOURCE_ID>`로 바꾸고, 속성은 `이름`(title)만 채움. `구분`(select)은 비워둬 사용자가 UI에서 직접 선택, `만든날짜`는 자동. (개인 DB에는 `작업도구` 속성이 없으므로 자동 태깅 미적용.)

```jsonc
{ "parent": { "type": "data_source_id", "data_source_id": "<YOUR_PERSONAL_DATA_SOURCE_ID>" },
  "pages": [{ "properties": { "이름": "제목" }, "content": "..." }] }
```

---

## 2. DB 조회·쿼리 ⭐ (최우선 흐름)

이 MCP에는 별도 `query` 도구가 없습니다. 다음 조합으로 조회합니다.

### 2-1. 스키마/구조 확인 — `notion-fetch`
```jsonc
mcp__claude_ai_Notion__notion-fetch({ "id": "collection://<YOUR_TEAM_DATA_SOURCE_ID>" })
```
→ 속성 목록, 옵션, SQLite 테이블 정의 반환. DB URL을 받으면 먼저 이걸로 `collection://` data_source_id를 알아낸다.

### 2-2. DB 내 항목 검색 — `notion-search` (data_source 스코프)
```jsonc
mcp__claude_ai_Notion__notion-search({
  "query": "메타광고 분석",
  "query_type": "internal",
  "data_source_url": "collection://<YOUR_TEAM_DATA_SOURCE_ID>",
  "filters": { "created_date_range": { "start_date": "2026-06-01" } },
  "page_size": 10
})
```
- **시맨틱 검색**임 (정확한 속성값 필터가 아님). 지원 필터는 `created_date_range`, `created_by_user_ids`뿐.
- 특정 `항목구분`/`유관부서` 값으로 정확히 추리려면: 넓게 검색 → 각 결과를 `notion-fetch`로 열어 속성 확인, 또는 사용자에게 Notion UI 필터 뷰를 제안.

### 2-3. 특정 페이지 전문 읽기 — `notion-fetch`
```jsonc
mcp__claude_ai_Notion__notion-fetch({ "id": "<page_id 또는 URL>" })
```
검색 결과의 `id`를 그대로 넘기면 본문(Notion Markdown)을 받음.

---

## 3. 페이지 본문 작성·수정

### 본문 형식 — Notion-flavored Markdown
헤딩(`#`/`##`/`###`), 목록(`-`, `1.`), 체크박스(`- [ ]`), 인용(`>`), 코드펜스, 표, 콜아웃, 토글 등 지원.
**모호한 고급 문법은 추측하지 말 것** — MCP 리소스 `notion://docs/enhanced-markdown-spec`를 ReadMcpResource로 읽어 확인. (이 URI를 fetch/WebFetch에 넘기지 말 것)

### 기존 페이지에 본문 추가·수정 — `notion-update-page`
| command | 용도 |
|---------|------|
| `insert_content` | 본문 앞/뒤에 추가 (`position: {type:"start"|"end"}`, 생략 시 끝에 append) |
| `update_content` | `content_updates`의 old_str→new_str 검색·치환 (먼저 `fetch`로 old_str 확보) |
| `replace_content` | 전체 본문 교체 (`new_str`). 하위 페이지/DB 있으면 `allow_deleting_content` 필요 |
| `update_properties` | 속성값 변경 |

> 날짜 속성: `"date:{속성}:start"`, `"date:{속성}:end"`, `"date:{속성}:is_datetime"`. 체크박스: `"__YES__"`/`"__NO__"`. 숫자: JS number. 이름이 `id`/`url`인 속성: `"userDefined:"` 접두사.

---

## 4. DB·페이지 신규 생성

### DB 생성 — `notion-create-database` (SQL DDL)
```jsonc
mcp__claude_ai_Notion__notion-create-database({
  "parent": { "type": "page_id", "page_id": "<부모페이지ID>" },
  "title": "AI Workshop 사전 설문",
  "schema": "CREATE TABLE (\"이름\" TITLE, \"회사\" RICH_TEXT, \"연차\" NUMBER, \"AI 도구\" MULTI_SELECT('ChatGPT':blue,'Claude':green,'기타':gray), \"수준\" SELECT('입문':gray,'중급':blue,'고급':red), \"노트북 지참\" CHECKBOX, \"제출일\" DATE)"
})
```
타입: `TITLE`,`RICH_TEXT`,`NUMBER`,`SELECT(...)`,`MULTI_SELECT(...)`,`DATE`,`CHECKBOX`,`URL`,`EMAIL`,`PHONE_NUMBER`,`STATUS`,`FILES`,`PEOPLE`,`RELATION(...)`,`ROLLUP(...)`,`FORMULA(...)`,`UNIQUE_ID`,`CREATED_TIME`,`LAST_EDITED_TIME`. 컬럼명은 큰따옴표, 옵션은 작은따옴표.

### 스키마 변경 — `notion-update-data-source`
`ADD COLUMN` / `DROP COLUMN` / `RENAME COLUMN "A" TO "B"` / `ALTER COLUMN "A" SET <type>` (세미콜론 구분).

### 뷰 생성 — `notion-create-view`
table/board/list/calendar/timeline/gallery/form/chart/map/dashboard. `configure` DSL로 FILTER/SORT/GROUP 등 지정.

### 일반 페이지 생성 (DB 아님)
`notion-create-pages`에서 `parent`를 `{type:"page_id", page_id:...}`로, properties는 `이름`(title)만.

---

## 5. 검색 (워크스페이스 전역) — `notion-search`

```jsonc
{ "query": "프로젝트 회고", "query_type": "internal", "page_size": 10 }
```
- 사용자 검색: `query_type: "user"`, query에 이름/이메일.
- `page_size`(기본10·최대25), `max_highlight_length`는 가능한 작게.
- 결과 `id`를 `notion-fetch`에 넘겨 전문 조회.

---

## MCP 도구 빠른 참조

| 도구 | 용도 |
|------|------|
| `notion-create-pages` | 페이지/DB항목 생성 (+본문) |
| `notion-fetch` | 페이지·DB·data_source 조회 (스키마/본문) |
| `notion-search` | 시맨틱 검색 (전역 또는 data_source 스코프) |
| `notion-update-page` | 본문/속성 수정 |
| `notion-create-database` | DB 생성 (SQL DDL) |
| `notion-update-data-source` | DB 스키마 변경 |
| `notion-create-view` | 뷰 생성 |
| `notion-move-pages` | 페이지 이동 |
| `notion-duplicate-page` | 페이지 복제 |
| `notion-create-comment` / `notion-get-comments` | 댓글 |
| `notion-get-users` / `notion-get-teams` | 사용자·팀스페이스 조회 |

---

## Query 환류 (위키 연동)

조회·분석 결과가 가치 있으면 위키(`30-knowledge/00-wiki`)에도 남길지 사용자에게 제안 — 노션은 공유·산출물, 위키는 복리 지식 축적.

---

## 부록: 구버전 (deprecated)

`scripts/notion_api.py`는 `NOTION_TOKEN` 직접 REST API 방식의 구버전입니다. MCP를 쓸 수 없는 환경(MCP 미연결)일 때만 폴백으로 사용하세요. 신규 작업은 위 MCP 흐름을 우선합니다.

---

## Version History

- **v2.1.0 (2026-06-20)**: 팀 DB에 `작업도구` multi_select 속성 추가(`클로드`·`코덱스`·`제미나이`·`기타`). 결과물 저장 시 `클로드` 자동 태깅 규칙 명문화.
- **v2.0.0 (2026-06-14)**: 공식 Notion MCP 기반으로 전면 전환. 결과물 저장·DB 조회 흐름 우선 설계, 검증된 팀 DB 스키마(항목구분 7옵션) 반영, 자체 Python 스크립트는 폴백으로 강등.
- **v1.1.0 (2026-01-03)**: 블록 타입/관리 기능 확장 (자체 스크립트).
- **v1.0.0 (2025-11-30)**: 초기 작성 (자체 스크립트).
