/**
 * pptx-deck-builder.js — 다크미니멀 16:9 발표덱 재사용 생성기 (자가 검증 내장)
 * ----------------------------------------------------------------------------
 * 목적: PPT 덱을 매번 새 스크립트로 짜다 발생한 표 깨짐(2026-06-15) 재발 방지.
 *
 * 과거 버그: 표 헬퍼가 colW(열 너비 배열)를 위치 인자로 받았는데 호출부는
 *           opts 객체에 넣어 전달 → colW가 무시되고 pptxgenjs가 열을 초협소
 *           자동너비로 잡아 글자가 한 자씩 세로로 줄바꿈됨.
 *
 * 방지책 2겹:
 *   1) table()은 colW를 반드시 '배열'로 받고, 길이가 열 개수와 다르면 즉시 throw.
 *   2) writeAndVerify()가 생성된 .pptx를 다시 열어 모든 표의 <a:gridCol> 실제
 *      너비를 요청 colW(EMU)와 대조 → 하나라도 어긋나면 throw (깨진 PPT 차단).
 *
 * 사용 예:
 *   const D = require('.../pptx-deck-builder.js');
 *   const { p, ctx } = D.createDeck({ title:'...', author:'...', company:'...' });
 *   let s = p.addSlide(); D.head(s, p, 'SECTION 01', '제목');
 *   D.table(ctx, s, rows, { x:0.9, y:1.95, w:11.5, colW:[3,3,3,2.5], rowH:0.5, fs:11 });
 *   await D.writeAndVerify(p, ctx, 'out.pptx');   // 검증 실패 시 throw
 *
 * 설치: 실행 폴더에 pptxgenjs 필요 (npm i pptxgenjs). jszip은 pptxgenjs 의존성.
 */
const pptxgen = require("pptxgenjs");
const fs = require("fs");

const THEME = {
  DARK:"111111", WHITE:"FFFFFF", MUTED:"666666", LIGHT:"F5F5F5", BORDER:"E0E0E0", MID:"888888",
  F:"Pretendard", FM:"Consolas",
  W:13.333, H:7.5, MX:0.9, EMU:914400,
};

function createDeck(meta = {}) {
  const p = new pptxgen();
  p.defineLayout({ name: "W16x9", width: THEME.W, height: THEME.H });
  p.layout = "W16x9";
  if (meta.author)  p.author  = meta.author;
  if (meta.company) p.company = meta.company;
  if (meta.title)   p.title   = meta.title;
  const ctx = { tableReg: [] };   // 검증용: 표마다 요청 colW 기록
  return { p, ctx, THEME };
}

function footer(s, p, label, pageNo) {
  const T = THEME;
  s.addText(label,  { x:T.MX, y:T.H-0.45, w:7, h:0.3, fontFace:T.FM, fontSize:7, color:T.MUTED });
  s.addText(pageNo, { x:T.W-T.MX-2, y:T.H-0.45, w:2, h:0.3, align:"right", fontFace:T.FM, fontSize:7, color:T.MUTED });
}

function head(s, p, sec, title) {
  const T = THEME;
  s.background = { color:T.WHITE };
  s.addText(sec,   { x:T.MX, y:0.55, w:8, h:0.3, fontFace:T.FM, fontSize:9, color:T.MUTED, charSpacing:3 });
  s.addText(title, { x:T.MX, y:0.85, w:T.W-2*T.MX, h:0.7, fontFace:T.F, fontSize:26, bold:true, color:T.DARK });
  s.addShape(p.ShapeType.line, { x:T.MX, y:1.62, w:T.W-2*T.MX, h:0, line:{ color:T.BORDER, width:1 } });
}

function divider(p, num, kr, en) {
  const T = THEME;
  const d = p.addSlide(); d.background = { color:T.DARK };
  d.addText(num, { x:T.MX, y:3.0, w:6, h:0.4, fontFace:T.FM, fontSize:12, color:T.WHITE, transparency:55, charSpacing:4 });
  d.addText(kr,  { x:T.MX, y:3.45, w:11, h:1.0, fontFace:T.F, fontSize:34, bold:true, color:T.WHITE });
  d.addText(en,  { x:T.MX, y:4.5, w:11, h:0.5, fontFace:T.FM, fontSize:13, color:T.WHITE, transparency:45 });
  return d;
}

/**
 * 표 추가 (안전판). colW는 반드시 배열. 길이가 열 개수와 다르면 throw.
 * opts: { x, y, w, colW:[...], rowH=0.42, fs=12, valign='middle' }
 */
function table(ctx, s, rows, opts = {}) {
  const T = THEME;
  if (!Array.isArray(opts.colW))
    throw new Error("table(): opts.colW 는 열 너비 배열이어야 합니다 (인치). 예: colW:[3,3,2]");
  const nCols = rows[0].length;
  if (opts.colW.length !== nCols)
    throw new Error(`table(): colW 길이(${opts.colW.length}) != 열 개수(${nCols})`);
  s.addTable(rows, {
    x: opts.x, y: opts.y, w: opts.w, colW: opts.colW,
    fontFace: T.F, fontSize: opts.fs || 12, color: T.MUTED, valign: opts.valign || "middle",
    border: { type:"solid", color:T.BORDER, pt:0.5 }, autoPage:false, rowH: opts.rowH || 0.42,
  });
  ctx.tableReg.push({ colW: opts.colW.slice() });   // 검증용 기록
}

// 셀 헬퍼
const TH  = (t) => ({ text:t, options:{ fill:{ color:THEME.DARK }, color:THEME.WHITE, bold:true, fontSize:10 } });
const TD  = (t, o={}) => ({ text:t, options:Object.assign({ fontSize:11 }, o) });
const STR = (t, o={}) => ({ text:t, options:Object.assign({ bold:true, color:THEME.DARK, fontSize:11 }, o) });

/**
 * 파일로 쓰고 즉시 재검증. 표 열 너비가 요청값과 어긋나면 throw.
 * → 과거의 "colW 무시되어 깨진 PPT"가 조용히 생성되는 것을 차단.
 */
async function writeAndVerify(p, ctx, fileName) {
  await p.writeFile({ fileName });

  let JSZip;
  try { JSZip = require("jszip"); }
  catch (e) { console.warn("[warn] jszip 미존재 → 표 검증 생략 (생성은 완료)."); return fileName; }

  const buf = fs.readFileSync(fileName);
  const zip = await JSZip.loadAsync(buf);
  const num = (n) => parseInt((n.match(/slide(\d+)\.xml/) || [])[1] || "0", 10);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => num(a) - num(b));

  const docTables = [];
  for (const n of slideNames) {
    const xml = await zip.files[n].async("string");
    const grids = xml.match(/<a:tblGrid>[\s\S]*?<\/a:tblGrid>/g) || [];
    for (const g of grids) {
      const widths = [...g.matchAll(/<a:gridCol w="(\d+)"/g)].map((m) => parseInt(m[1], 10));
      docTables.push(widths);
    }
  }

  const reg = ctx.tableReg || [];
  if (docTables.length !== reg.length)
    throw new Error(`[verify] 표 개수 불일치: 문서 ${docTables.length} vs 기대 ${reg.length}`);

  const TOL = 3000; // EMU (~0.003in) 반올림 허용
  reg.forEach((r, i) => {
    const got = docTables[i];
    const want = r.colW.map((v) => Math.round(v * THEME.EMU));
    if (got.length !== want.length)
      throw new Error(`[verify] 표 ${i + 1} 열 개수 ${got.length} != 기대 ${want.length}`);
    got.forEach((w, j) => {
      if (Math.abs(w - want[j]) > TOL)
        throw new Error(`[verify] 표 ${i + 1} 열 ${j + 1} 너비 ${w}EMU != 기대 ${want[j]}EMU (colW 무시 의심)`);
    });
  });
  console.log(`OK: ${docTables.length}개 표의 열 너비 검증 통과.`);
  return fileName;
}

module.exports = { createDeck, head, divider, footer, table, writeAndVerify, TH, TD, STR, THEME };
