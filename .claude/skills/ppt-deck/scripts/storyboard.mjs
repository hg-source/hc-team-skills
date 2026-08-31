#!/usr/bin/env node
/**
 * storyboard.mjs — PPT덱 스토리보드 (Google Sheets)
 *
 * ppt-deck 스킬 1단계(스토리보드 설계)의 시트 조작 전용 헬퍼.
 * 시트 조작은 이 스크립트로만 한다(직접 gws 호출 금지 — 결정적·비파괴).
 * gws CLI(Google Workspace) 경유 → gws 인증만 되어 있으면 별도 의존성 없음.
 *
 * 사용법:
 *   node storyboard.mjs create --title "덱 제목"        # 스토리보드 시트 생성 → {spreadsheetId,url} 출력
 *   node storyboard.mjs read --sheet <id|url>           # 스토리보드 행 전체를 JSON으로 출력
 *   node storyboard.mjs propose --sheet <id|url> --rows <file.json> [--force]
 *       # 레이아웃유형·제안근거 열 기입. file.json = [{row, layout, rationale}, ...]
 *       #   row = 시트 행번호(데이터는 2부터). 기본은 레이아웃유형이 이미 채워진 행은 건너뜀(--force로 덮어씀).
 *   node storyboard.mjs layouts                          # 레이아웃유형 옵션 목록 출력
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TAB = '스토리보드';
const GUIDE_TAB = '레이아웃 안내';

// 컬럼 순서 = 시트 열 순서 (A열부터).
const COLUMNS = [
  { key: 'no',        header: '순번',              width: 42,  align: 'CENTER' },
  { key: 'section',   header: '목차구분',          width: 92,  align: 'LEFT' },
  { key: 'title',     header: '슬라이드 제목',     width: 170, align: 'LEFT' },
  { key: 'headline',  header: '헤드라인(핵심 내용)', width: 300, align: 'LEFT' },
  { key: 'layout',    header: '레이아웃유형',      width: 104, align: 'CENTER' },
  { key: 'ev1',       header: '근거1',             width: 190, align: 'LEFT' },
  { key: 'ev2',       header: '근거2',             width: 190, align: 'LEFT' },
  { key: 'ev3',       header: '근거3',             width: 190, align: 'LEFT' },
  { key: 'ev4',       header: '근거4',             width: 190, align: 'LEFT' },
  { key: 'source',    header: '데이터소스/비고',   width: 150, align: 'LEFT' },
  { key: 'rationale', header: '레이아웃 제안근거', width: 210, align: 'LEFT' },
];
const LAST_COL = colLetter(COLUMNS.length);
const LAYOUT_COL_IDX = COLUMNS.findIndex((c) => c.key === 'layout'); // 0-base

// 레이아웃유형 옵션 (시트 드롭다운 값 = code). assets/layout-library.html의 data-layout과 1:1.
// 변형 흡수 규칙: 빅넘버→KPI(1개 크게), 대시보드→KPI, 퍼널→프로세스, 워터폴→차트+해설, 하비볼 스코어카드→비교표.
const LAYOUTS = [
  { code: '표지',         id: 'cover',      use: '제목·부제·날짜·보고자' },
  { code: '목차',         id: 'toc',        use: '목차구분 열에서 자동 생성' },
  { code: '요약',         id: 'summary',    use: 'Executive Summary — 상황·발견·권고 3단, 덱 2페이지' },
  { code: '섹션브릿지',   id: 'bridge',     use: '장 전환 + 핵심 메시지 1줄' },
  { code: '불릿',         id: 'bullets',    use: '기본형. 주장 1줄 + 근거 나열' },
  { code: '2단카드',      id: 'cards-2',    use: '대등한 항목 2개 병렬' },
  { code: '3단카드',      id: 'cards-3',    use: '대등한 항목 3개 병렬' },
  { code: '4단카드',      id: 'cards-4',    use: '대등한 항목 4개 병렬' },
  { code: '2단대비',      id: 'contrast',   use: 'Before/After · A안 vs B안 (대립 구도)' },
  { code: '비교표',       id: 'matrix',     use: '다항목×다기준 매트릭스 (하비볼 스코어카드 포함)' },
  { code: '2x2',          id: 'quad',       use: '2축 4분면 — 우선순위·포지셔닝 맵' },
  { code: 'KPI',          id: 'kpi',        use: '핵심 숫자 1~4개 강조 (빅넘버·대시보드 포함)' },
  { code: '차트+해설',    id: 'chart',      use: '좌측 차트 + 우측 시사점 (워터폴 포함)' },
  { code: '이미지+텍스트', id: 'media',      use: '제품·현장 이미지 + 설명 병치' },
  { code: '인용/VOC',     id: 'quote',      use: '고객·이해관계자 인용 + 뒷받침 데이터' },
  { code: '타임라인',     id: 'timeline',   use: '시점 기반 일정·로드맵' },
  { code: '프로세스',     id: 'process',    use: '화살표 단계 흐름 — 절차·전환·퍼널' },
  { code: '도식',         id: 'diagram',    use: '정적 구조 — 조직도·시스템 구성·관계도' },
  { code: '결론/권고',    id: 'conclusion', use: '의사결정 요청 + 다음 단계' },
];

function colLetter(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
  return s;
}
function q(tab) { return `'${String(tab).replace(/'/g, "''")}'`; }

// ---- gws 호출 (resume-review/roster.mjs와 동일 패턴) ---------------------
function resolveGwsRunJs() {
  if (process.env.GWS_RUNJS && existsSync(process.env.GWS_RUNJS)) return process.env.GWS_RUNJS;
  const candidates = [];
  if (process.env.APPDATA) candidates.push(join(process.env.APPDATA, 'npm', 'node_modules', '@googleworkspace', 'cli', 'run.js'));
  if (process.env.HOME) candidates.push(join(process.env.HOME, 'AppData', 'Roaming', 'npm', 'node_modules', '@googleworkspace', 'cli', 'run.js'));
  return candidates.find((p) => existsSync(p)) || null;
}
const GWS_RUNJS = resolveGwsRunJs();

function gws(args) {
  let out;
  try {
    if (GWS_RUNJS) {
      out = execFileSync(process.execPath, [GWS_RUNJS, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } else {
      out = execFileSync('gws', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true });
    }
  } catch (e) {
    const msg = (e.stderr || '') + (e.stdout || '') || e.message;
    throw new Error(`gws 실패: gws ${args.join(' ')}\n${msg}`);
  }
  const i = out.search(/[{[]/);
  if (i < 0) return {};
  try { return JSON.parse(out.slice(i)); }
  catch { return {}; }
}
const sheetsGet = (id, params = {}) => gws(['sheets', 'spreadsheets', 'get', '--params', JSON.stringify({ spreadsheetId: id, ...params })]);
const valuesGet = (id, range) => gws(['sheets', 'spreadsheets', 'values', 'get', '--params', JSON.stringify({ spreadsheetId: id, range })]);
const valuesUpdate = (id, range, values) => gws(['sheets', 'spreadsheets', 'values', 'update',
  '--params', JSON.stringify({ spreadsheetId: id, range, valueInputOption: 'USER_ENTERED' }),
  '--json', JSON.stringify({ values })]);
const batchUpdate = (id, requests) => gws(['sheets', 'spreadsheets', 'batchUpdate',
  '--params', JSON.stringify({ spreadsheetId: id }),
  '--json', JSON.stringify({ requests })]);

// ---- 인자 파싱 -----------------------------------------------------------
function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) { opts[key] = argv[++i]; }
      else opts[key] = true;
    } else opts._.push(a);
  }
  return opts;
}
function sheetIdFrom(input) {
  if (!input) throw new Error('--sheet <spreadsheetId 또는 URL> 이 필요합니다.');
  const m = String(input).match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : String(input).trim();
}

// ---- 서식 -----------------------------------------------------------------
function formatRequests(sheetId) {
  const reqs = [];
  COLUMNS.forEach((c, i) => {
    reqs.push({ updateDimensionProperties: {
      range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
      properties: { pixelSize: c.width }, fields: 'pixelSize' } });
  });
  reqs.push({ repeatCell: {
    range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
    cell: { userEnteredFormat: {
      textFormat: { bold: true }, backgroundColor: { red: 0.93, green: 0.93, blue: 0.93 },
      horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', wrapStrategy: 'CLIP' } },
    fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy)' } });
  COLUMNS.forEach((c, i) => {
    reqs.push({ repeatCell: {
      range: { sheetId, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
      cell: { userEnteredFormat: { wrapStrategy: 'WRAP', verticalAlignment: 'TOP', horizontalAlignment: c.align } },
      fields: 'userEnteredFormat(wrapStrategy,verticalAlignment,horizontalAlignment)' } });
  });
  // 레이아웃유형 열 드롭다운 (데이터 행 전체)
  reqs.push({ setDataValidation: {
    range: { sheetId, startRowIndex: 1, startColumnIndex: LAYOUT_COL_IDX, endColumnIndex: LAYOUT_COL_IDX + 1 },
    rule: {
      condition: { type: 'ONE_OF_LIST', values: LAYOUTS.map((l) => ({ userEnteredValue: l.code })) },
      showCustomUi: true, strict: false,
    } } });
  // 1행 + 순번·목차구분·제목(3열) 고정
  reqs.push({ updateSheetProperties: {
    properties: { sheetId, gridProperties: { frozenRowCount: 1, frozenColumnCount: 3 } },
    fields: 'gridProperties(frozenRowCount,frozenColumnCount)' } });
  reqs.push({ setBasicFilter: {
    filter: { range: { sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: COLUMNS.length } } } });
  return reqs;
}

// ---- 명령 ------------------------------------------------------------------
function cmdCreate(opts) {
  const title = opts.title;
  if (!title) throw new Error('--title "덱 제목" 이 필요합니다.');
  const res = gws(['sheets', 'spreadsheets', 'create', '--json', JSON.stringify({
    properties: { title: `[PPT덱] ${title} 스토리보드`, locale: 'ko_KR' },
    sheets: [{ properties: { title: TAB } }, { properties: { title: GUIDE_TAB } }],
  })]);
  if (!res.spreadsheetId) throw new Error('시트 생성 실패: ' + JSON.stringify(res));
  const id = res.spreadsheetId;
  const meta = sheetsGet(id, { fields: 'sheets.properties(title,sheetId)' });
  const tabId = (t) => (meta.sheets || []).find((s) => s.properties.title === t)?.properties.sheetId;

  valuesUpdate(id, `${q(TAB)}!A1:${LAST_COL}1`, [COLUMNS.map((c) => c.header)]);
  batchUpdate(id, formatRequests(tabId(TAB)));

  // 레이아웃 안내 탭
  valuesUpdate(id, `${q(GUIDE_TAB)}!A1:C1`, [['레이아웃유형', '용도', 'data-layout']]);
  valuesUpdate(id, `${q(GUIDE_TAB)}!A2:C${LAYOUTS.length + 1}`,
    LAYOUTS.map((l) => [l.code, l.use, l.id]));
  const gid = tabId(GUIDE_TAB);
  if (gid != null) {
    batchUpdate(id, [
      { updateDimensionProperties: { range: { sheetId: gid, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: gid, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 320 }, fields: 'pixelSize' } },
      { repeatCell: { range: { sheetId: gid, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.93, green: 0.93, blue: 0.93 } } },
        fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
    ]);
  }
  const url = res.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}`;
  console.log(JSON.stringify({ spreadsheetId: id, url }, null, 2));
}

function cmdRead(opts) {
  const id = sheetIdFrom(opts.sheet);
  const res = valuesGet(id, `${q(TAB)}!A2:${LAST_COL}`);
  const rows = (res.values || []).map((r, i) => {
    const obj = { _row: i + 2 };
    COLUMNS.forEach((c, j) => { obj[c.key] = r[j] != null ? String(r[j]).trim() : ''; });
    return obj;
  }).filter((o) => o.title || o.headline || o.section);
  console.log(JSON.stringify(rows, null, 2));
}

function cmdPropose(opts) {
  const id = sheetIdFrom(opts.sheet);
  if (!opts.rows) throw new Error('--rows <file.json> 이 필요합니다.');
  const proposals = JSON.parse(readFileSync(opts.rows, 'utf8'));
  if (!Array.isArray(proposals)) throw new Error('rows 파일은 [{row, layout, rationale}] 배열이어야 합니다.');
  const codes = new Set(LAYOUTS.map((l) => l.code));
  const bad = proposals.filter((p) => p.layout && !codes.has(p.layout));
  if (bad.length) throw new Error('알 수 없는 레이아웃유형: ' + bad.map((b) => `행${b.row}=${b.layout}`).join(', '));

  // 기존 레이아웃 값 확인 (기본: 채워진 행은 건너뜀)
  const layoutColLetter = colLetter(LAYOUT_COL_IDX + 1);
  const existing = valuesGet(id, `${q(TAB)}!${layoutColLetter}2:${layoutColLetter}`);
  const filled = new Set();
  (existing.values || []).forEach((r, i) => { if ((r[0] || '').trim()) filled.add(i + 2); });

  const rationaleColLetter = colLetter(COLUMNS.length);
  let written = 0, skipped = 0;
  for (const p of proposals) {
    const row = Number(p.row);
    if (!Number.isInteger(row) || row < 2) throw new Error(`잘못된 행번호: ${p.row}`);
    if (filled.has(row) && !opts.force) { skipped++; continue; }
    valuesUpdate(id, `${q(TAB)}!${layoutColLetter}${row}`, [[p.layout || '']]);
    valuesUpdate(id, `${q(TAB)}!${rationaleColLetter}${row}`, [[p.rationale || '']]);
    written++;
  }
  console.log(JSON.stringify({ written, skipped: skipped ? `${skipped} (이미 채워진 행 — --force로 덮어쓰기)` : 0 }));
}

function cmdLayouts() {
  console.log(JSON.stringify(LAYOUTS, null, 2));
}

// ---- main ------------------------------------------------------------------
const [cmd, ...rest] = process.argv.slice(2);
const opts = parseArgs(rest);
try {
  if (cmd === 'create') cmdCreate(opts);
  else if (cmd === 'read') cmdRead(opts);
  else if (cmd === 'propose') cmdPropose(opts);
  else if (cmd === 'layouts') cmdLayouts();
  else {
    console.error('사용법: node storyboard.mjs <create|read|propose|layouts> [옵션]');
    process.exit(2);
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
