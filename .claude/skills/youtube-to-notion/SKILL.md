---
name: youtube-to-notion
description: 유튜브 영상 URL의 자막과 내용을 분석해 Notion에 저장한다. 유튜브 저장, 유튜브 정리, 영상 자막 정리 요청에 사용한다.
---

# youtube-to-notion

유튜브 URL을 받아 자막을 분석하고 Notion 데이터베이스에 자동 저장하는 스킬.

## 트리거 조건

다음 중 하나에 해당하면 자동 실행:
- 사용자가 `youtube.com` 또는 `youtu.be` URL을 제공할 때
- "유튜브 저장", "유튜브 정리", "노션에 저장", "자막 정리" 키워드와 함께 URL 제공 시

## 실행 절차

### Step 1: 영상 데이터 추출

```bash
# 워크스페이스 루트에서 실행 (사전에 `cd .../scripts && npm install` 필요)
node .claude/skills/youtube-to-notion/scripts/youtube-fetch.mjs "<YOUTUBE_URL>"
```

결과로 JSON 반환:
- `title`, `channel`, `durationMin`, `thumbnailUrl`, `url`, `transcript`, `hasTranscript`

### Step 2: 자막 분석 (Claude가 직접 수행)

transcript를 읽고 다음을 도출:

1. **요약** (3~5문장): 영상의 핵심 내용을 간결하게
2. **핵심 인사이트** (bullet 2~4개): 실무에서 바로 활용할 수 있는 포인트
3. **카테고리** (1개 선택): 마케팅/광고/데이터분석/헬스케어/자사몰/비즈니스/기타
4. **태그** (2~5개): 핵심 키워드 (예: 메타광고, ROAS, 퍼포먼스마케팅)
5. **중요도**: ★★★ 높음 / ★★ 보통 / ★ 낮음

### Step 3: 썸네일 로컬 저장

```bash
# 워크스페이스 루트 기준 상대경로
mkdir -p "50-resources/attachments/youtube-thumbnails"
curl -L "<thumbnailUrl>" -o "50-resources/attachments/youtube-thumbnails/<videoId>_<채널명요약>.jpg"
```

### Step 4: Notion DB 저장

```bash
node .claude/skills/youtube-to-notion/scripts/notion-save.mjs '<JSON>'
```

JSON 형식:
```json
{
  "title": "영상 제목",
  "channel": "채널명",
  "url": "https://...",
  "thumbnailUrl": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
  "durationMin": 12,
  "category": "마케팅",
  "tags": ["메타광고", "ROAS"],
  "summary": "요약 내용...",
  "insight": "• 인사이트1\n• 인사이트2",
  "importance": "★★★ 높음"
}
```

### Step 5: 결과 보고

사용자에게 다음을 보고:
- ✅ 저장 완료 메시지
- 영상 제목 및 채널
- 도출한 요약 및 핵심 인사이트
- Notion 페이지 링크

## Notion DB 정보

- **DB ID**: `<YOUR_NOTION_DB_ID>` (각자 자기 노션 DB ID로 교체 — 실제 ID는 사내 교육자료 참고)
- **위치**: 각자 노션에 "유튜브 콘텐츠 정리" 같은 DB를 만들어 사용
- **토큰**: `NOTION_TOKEN` 환경변수 (`.env` 또는 `settings.local.json`에 설정)

## 에러 처리

- 자막 없음: `transcript: "자막 없음"` → 요약/인사이트는 제목·채널 기반으로 최선 작성, 사용자에게 안내
- URL 파싱 실패: 사용자에게 올바른 YouTube URL 요청
- Notion 저장 실패: 에러 메시지 보고 후 JSON 데이터를 사용자에게 제공

## 스크립트 의존성

- `youtubei.js` (전역 npm): 영상 메타데이터
- `youtube-transcript-api` (전역 npm): 자막 추출
- Node.js v24+
- `NOTION_TOKEN` 환경변수
