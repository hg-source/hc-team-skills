/**
 * YouTube 영상 정보를 Notion DB에 저장
 * Usage: node notion-save.mjs '<json>'
 * JSON 스키마: { title, channel, url, thumbnailUrl, durationMin, category, tags[], summary, insight, importance }
 */

const token = process.env.NOTION_TOKEN;
// 각자 자기 노션 DB ID로 교체하거나 NOTION_DB_ID 환경변수로 주입 (실제 ID는 사내 교육자료 참고)
const DB_ID = process.env.NOTION_DB_ID || '<YOUR_NOTION_DB_ID>';

if (!token) {
  console.error('NOTION_TOKEN 환경변수가 없습니다');
  process.exit(1);
}

const raw = process.argv[2];
if (!raw) {
  console.error('JSON 데이터를 인자로 전달하세요');
  process.exit(1);
}

const data = JSON.parse(raw);

const body = {
  parent: { database_id: DB_ID },
  properties: {
    '제목': {
      title: [{ text: { content: data.title ?? '' } }]
    },
    '채널명': {
      rich_text: [{ text: { content: data.channel ?? '' } }]
    },
    'URL': {
      url: data.url ?? null
    },
    '썸네일 URL': {
      url: data.thumbnailUrl ?? null
    },
    '카테고리': {
      select: data.category ? { name: data.category } : null
    },
    '태그': {
      multi_select: (data.tags ?? []).map(t => ({ name: t }))
    },
    '시청 상태': {
      select: { name: '미시청' }
    },
    '중요도': {
      select: { name: data.importance ?? '★★ 보통' }
    },
    '요약': {
      rich_text: [{ text: { content: (data.summary ?? '').slice(0, 2000) } }]
    },
    '핵심 인사이트': {
      rich_text: [{ text: { content: (data.insight ?? '').slice(0, 2000) } }]
    },
    '영상 길이(분)': {
      number: data.durationMin ?? null
    },
  }
};

// null select 제거
for (const [key, val] of Object.entries(body.properties)) {
  if (val.select === null) delete body.properties[key];
}

const res = await fetch('https://api.notion.com/v1/pages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  },
  body: JSON.stringify(body),
});

const result = await res.json();
if (result.object === 'error') {
  console.error('Notion 저장 실패:', result.message);
  process.exit(1);
}

console.log(JSON.stringify({ success: true, pageId: result.id, url: result.url }));
