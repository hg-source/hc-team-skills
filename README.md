# HC Team Skills

헬스케어부문 팀 교육·공유용 **Claude Code 스킬 모음**입니다.
개인 워크스페이스에서 검증된 스킬 25종을 공개 안전화하여 정리했습니다.

스킬은 키워드 기반으로 **자동 트리거**됩니다(수동 슬래시 커맨드가 아님).
예: "오늘 daily note 만들어줘" → `daily-note` 자동 실행.

---

## 시작하기

1. 이 저장소를 clone 하거나, `.claude/skills/` 폴더를 각자 워크스페이스의 `.claude/skills/`로 복사합니다.
2. 처음 쓰는 워크스페이스라면 Claude Code에서 **"워크스페이스 세팅해줘"** 라고 말해 `setup-workspace`를 먼저 실행하세요. (프로필·폴더 구조·템플릿을 만들어 줍니다.)
3. 일부 스킬은 API 키·의존성 설치가 필요합니다 → [별도 설정 필요 스킬](#별도-설정이-필요한-스킬) 참고.

> **폴더 구조**: 이 저장소의 최상위 폴더(`00-inbox`, `10-projects`, `30-knowledge/00-wiki` 등)는 스킬이 참조하는 **빈 뼈대**입니다(`.gitkeep`만 존재). 실제 내용은 각자 워크스페이스에서 채웁니다.

---

## 스킬 카탈로그 (25종)

### 📄 문서·데이터 변환
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `excel-to-csv` | Excel → CSV 변환 (분석 가능하게) | "엑셀 변환", "Excel CSV", "xlsx 변환" / `.xlsx`·`.xls` 경로 |
| `csv-clean` | CSV 품질 정리 (소계 제거·숫자·날짜·unpivot) | "데이터 정리", "CSV 정리", "소계 제거", "unpivot" |
| `pdf-to-md` | PDF → 구조화 Markdown (표·헤딩 보존) | "PDF 변환", "PDF를 마크다운으로", "PDF 텍스트 추출" |
| `md-to-pdf` | Markdown → A4 인쇄용 PDF 핸드아웃 | "핸드아웃", "handout", "PDF 만들어", "A4 변환", "인쇄용" |
| `transcript-organizer` | 긴 녹음/강의/미팅 텍스트 구조화 분석 | "녹음 정리", "강의 정리", "미팅록", "인터뷰 정리", "트랜스크립트" |

### 📝 기획 문서 (PRD)
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `dashboard-prd` | 대시보드 PRD 대화형 생성 | "대시보드 PRD", "대시보드 기획", "대시보드 설계" |
| `webapp-prd` | 웹앱 PRD 대화형 생성 | "웹앱 PRD", "웹앱 기획", "앱 설계" |

### 🗂️ 개인 노트 (PKM)
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `daily-note` | 오늘 날짜 Daily Note 생성/열기 | "오늘 daily note", "일일 노트", "하루 기록" |
| `daily-review` | 하루 작업 종합 데일리 리포트 | "데일리 리포트", "일일 리뷰", "어제 작업 정리" |
| `weekly-synthesis` | 한 주 종합 Weekly 리뷰 | "주간 정리", "이번 주 회고", "weekly review" |
| `idea` | 아이디어/인사이트 추출·저장 | "아이디어 저장", "이거 기록", "인사이트 정리", "메모해줘" |
| `todo` | Todo 빠른 추가 (우선순위·태그) | "할 일 추가", "todo 추가", "이거 해야해" |
| `todos` | Todo 조회·관리 (오늘/오버듀/통계) | "할 일 보기", "todos", "오늘 할 일", "오버듀" |

### 📚 지식 위키
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `wiki-ingest` | 소스를 위키에 통합(복리 축적) | "wiki-ingest", "위키 업데이트", "위키에 반영", "지식 축적" |
| `wiki-lint` | 위키 헬스체크(모순·고아·오래된 페이지) | "wiki-lint", "위키 점검", "위키 헬스체크" |

### 🔗 노션·웹·미디어 연동
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `notion-handler` | Notion DB/페이지 관리(공식 MCP 기반) | "노션", "노션에 저장", "결과물 저장", "DB 만들어", "노션 조회" |
| `web-crawler-ocr` ⚠️ | 웹 크롤링 + 이미지 OCR (**별도 Gemini API 키 필요**) | "이 URL 분석해줘", "크롤링해줘", "웹사이트 분석", "경쟁사 분석" |
| `youtube-to-notion` ⚙️ | 유튜브 자막 분석 → Notion 저장 (**npm install + NOTION_TOKEN 필요**) | "유튜브 저장", "유튜브 정리", "자막 정리" / youtube URL |

### 🧩 사고·작업 분해 프레임워크
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `decompose` | 미션을 병렬 작업으로 분해 | "작업 분해", "태스크 나누기", "병렬로 처리", "분해해줘" |
| `execute` | 분해된 병렬 작업을 워커로 실행 | "작업 실행", "워커 실행", "병렬 처리 시작" (`/decompose` 후) |
| `integrate` | 병렬 작업 결과를 통합 | "결과 통합", "병렬 작업 합치기", "통합해줘" (`/execute` 후) |
| `sensemaking` | 낯선 콘텐츠(논문·플러그인 등) 함께 해석 | "같이 읽자", "이거 이해시켜줘", "함께 해석", "개념 정리" |
| `thinking-partner` | 질문으로 사고를 촉진하는 사고 파트너 | "같이 생각해보자", "고민이 있어", "브레인스토밍", "생각 정리 도와줘" |

### 🛠️ 워크스페이스 운영
| 스킬 | 하는 일 | 트리거 키워드 |
|------|---------|----------------|
| `setup-workspace` | 첫 워크스페이스 초기 세팅 | "워크스페이스 세팅", "초기 설정", "setup" |
| `doc-updater` | Claude Code 공식 문서 동기화 | "문서 업데이트", "CHANGELOG 확인", "공식문서 업데이트" |

> ⚠️ = 외부 API 키 필요 · ⚙️ = 의존성 설치/환경변수 필요 → 아래 참고.

---

## 별도 설정이 필요한 스킬

### `web-crawler-ocr` — 별도 Gemini API 키 필요
이미지 OCR에 Google **Gemini API 키**가 필요합니다(크롤링 자체는 로컬).

1. 키 발급: https://aistudio.google.com/apikey
2. `.claude/skills/web-crawler-ocr/scripts/.env` 파일 생성 (`.env.example` 참고):
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
`.env`는 `.gitignore`로 제외되어 커밋되지 않습니다.

### `youtube-to-notion` — npm install + Notion 토큰 필요
1. 의존성 설치:
   ```bash
   cd .claude/skills/youtube-to-notion/scripts && npm install
   ```
2. 환경변수 설정: `NOTION_TOKEN`(필수), `NOTION_DB_ID`(선택 — 각자 DB ID).

---

## Notion DB ID 안내

`notion-handler`·`daily-review`·`youtube-to-notion` 스킬의 노션 DB ID는 공개 저장소이므로
`<YOUR_TEAM_DATA_SOURCE_ID>` / `<YOUR_PERSONAL_DATA_SOURCE_ID>` / `<YOUR_NOTION_DB_ID>`
**플레이스홀더**로 비워 두었습니다.

- 각자 **자기 노션 DB ID**로 교체해 사용하세요.
- **실제 사내 공용 DB ID는 사내 교육자료를 참고**하세요.

---

## 라이선스·주의

- 이 저장소는 팀 교육·공유용입니다. 사내 데이터(매출·지표·고객·계정)는 커밋하지 마세요.
- API 키·토큰·`.env`는 절대 커밋하지 마세요(`.gitignore`가 1차 방어).
