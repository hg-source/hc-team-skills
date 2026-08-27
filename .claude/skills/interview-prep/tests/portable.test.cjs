'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { build, parseQuestions } = require('../build_seed.js');
const { verify } = require('../scripts/verify-seed.cjs');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-prep-tests-'));
console.log('Isolated fixtures retained at: ' + temp);
function workspace(label) { const dir = path.join(temp, label); fs.mkdirSync(dir); return dir; }
function write(dir, name, text) { fs.writeFileSync(path.join(dir, name), text); }
function fixture(dir, name = '가상지원자', pdf = name + ' 이력서.pdf') {
  write(dir, pdf, '%PDF-1.4\n% Synthetic test fixture only\n%%EOF\n');
  write(dir, '질문_' + name + '.txt', '[맞춤형]\n# 핵심성과\n1. 기준선은 무엇입니까?\n의도: 성과 검증\n[공통]\n# 협업\n1. 갈등을 해결한 사례는?\n의도: 협업 검증\n');
  write(dir, '_position_' + name + '.txt', '상품기획 팀장');
  return name;
}
function run(script, args, options = {}) { return spawnSync(process.execPath, [path.join(root, script), ...args], { encoding: 'utf8', ...options }); }

test('parser preserves category, group and intent; rejects incomplete questions', () => {
  const qs = parseQuestions('\uFEFF[공통]\n# 그룹\n1. 질문?\n(의도: 검증)\n');
  assert.deepEqual(qs, [{ cat: 'common', group: '그룹', intent: '검증', text: '질문?' }]);
  assert.throws(() => parseQuestions('1. 의도 없는 질문'), /의도/);
});

test('setup creates empty tool in Korean path; reruns preserve seed and backup changed HTML', async () => {
  const { setup } = await import(pathToFileURL(path.join(root, 'scripts/setup-interview-tool.mjs')).href);
  const dir = workspace('한글 공백 작업 폴더');
  setup(dir);
  assert.ok(fs.readFileSync(path.join(dir, '면접_시드.js'), 'utf8').includes('INTERVIEW_SEED=[]'));
  write(dir, '면접_시드.js', 'custom existing seed');
  write(dir, '면접툴.html', 'previous custom tool');
  setup(dir);
  assert.equal(fs.readFileSync(path.join(dir, '면접_시드.js'), 'utf8'), 'custom existing seed');
  const backups = fs.readdirSync(dir).filter(f => f.startsWith('면접툴.html_backup_'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(dir, backups[0]), 'utf8'), 'previous custom tool');
  setup(dir);
  assert.equal(fs.readdirSync(dir).filter(f => f.includes('_backup_')).length, 1);
  assert.throws(() => setup(root), /outside/);
});

test('default setup respects an isolated Windows user profile and explicit workspace environment', () => {
  const dir = workspace('environment');
  const result = run('scripts/setup-interview-tool.mjs', [], { env: { ...process.env, EGNIS_INTERVIEW_DIR: dir } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), dir);
});

test('multiple candidates, optional AI and normal PDF names build and verify; unchanged data is idempotent', () => {
  const dir = workspace('multiple');
  fixture(dir, '가상지원자');
  fixture(dir, '테스트후보', '직무_테스트후보_이력서.pdf');
  write(dir, '_ai_가상지원자.json', JSON.stringify({ score: '보류', verdict: '보류' }));
  const first = build(dir);
  assert.equal(first.seed.length, 2);
  assert.equal(verify(path.join(dir, '면접_시드.js'), ['가상지원자', '테스트후보']).length, 2);
  assert.equal(first.seed.find(x => x.name === '가상지원자').ai.verdict, '보류');
  assert.equal(build(dir).changed, false);
  assert.equal(fs.readdirSync(dir).filter(f => f.includes('_backup_')).length, 0);
});

test('changed seed preserves previous bytes in dated backup', () => {
  const dir = workspace('seed-backup'); fixture(dir); build(dir);
  const previous = fs.readFileSync(path.join(dir, '면접_시드.js'));
  write(dir, '_position_가상지원자.txt', '연구 팀장');
  const result = build(dir);
  assert.equal(result.changed, true);
  assert.deepEqual(fs.readFileSync(result.backup), previous);
});

test('invalid AI JSON cannot replace a good seed', () => {
  const dir = workspace('invalid-ai'); fixture(dir); build(dir);
  const before = fs.readFileSync(path.join(dir, '면접_시드.js'));
  write(dir, '_ai_가상지원자.json', '{invalid');
  assert.throws(() => build(dir));
  assert.deepEqual(fs.readFileSync(path.join(dir, '면접_시드.js')), before);
});

test('missing PDF and position fail before a seed is written', () => {
  const dir = workspace('missing');
  write(dir, '질문_가상지원자.txt', '1. 질문?\n의도: 검증');
  assert.throws(() => build(dir), /PDF/);
  write(dir, '가상지원자.pdf', '%PDF synthetic');
  assert.throws(() => build(dir), /직무/);
  assert.equal(fs.existsSync(path.join(dir, '면접_시드.js')), false);
});

test('PDF matching avoids partial names and supports Unicode-normalized macOS filenames', () => {
  const dir = workspace('unicode');
  const pdf = '가상지원자 이력서.pdf'.normalize('NFD');
  fixture(dir, '가상지원자', pdf);
  write(dir, '가상지원자다른사람.pdf', '%PDF synthetic');
  assert.deepEqual(build(dir).seed[0].pdfs, [pdf]);
});

test('explicit PDF mapping supports arbitrary filenames and blocks paths or URLs', () => {
  const dir = workspace('mapping'); fixture(dir, '가상지원자', 'resume.pdf');
  write(dir, '_pdfs_가상지원자.json', '["resume.pdf"]');
  assert.deepEqual(build(dir).seed[0].pdfs, ['resume.pdf']);
  for (const pdf of ['../resume.pdf', 'https://example.com/resume.pdf', 'C:\\resume.pdf']) {
    write(dir, '_pdfs_가상지원자.json', JSON.stringify([pdf]));
    assert.throws(() => build(dir), /filename/);
  }
});

test('career duration includes both endpoint months', () => {
  const result = run('scripts/career-duration.js', ['2021.04', '2023.12']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '2021.04~2023.12 (2년9개월)');
});

test('JD cache is local and works offline; malformed ID is rejected', () => {
  const dir = workspace('jd');
  write(dir, '123.json', JSON.stringify({ openingId: 123, title: '가상 직무', detailText: '가상 JD', fetchedAt: '2026-01-01' }));
  const result = run('fetch-jd.mjs', ['--id', '123', '--cache-dir', dir, '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).source, 'cache');
  assert.notEqual(run('fetch-jd.mjs', ['--id', '../bad', '--cache-dir', dir]).status, 0);
});

const html = fs.readFileSync(path.join(root, 'assets/면접툴.html'), 'utf8');
const inline = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
function uiContext(saved) {
  const context = { window: {}, structuredClone, localStorage: { getItem: () => JSON.stringify(saved), setItem: () => {} } };
  vm.createContext(context);
  vm.runInContext(inline.slice(inline.indexOf('const LS ='), inline.indexOf('\napplySeed();')) + '\nglobalThis.testing={state,applySeed,mergeQuestions,AI_EVAL,normalizeAI};', context);
  return context;
}
test('HTML scripts compile and no bundled candidate evaluations or remote resources exist', () => {
  new vm.Script(inline);
  const ctx = uiContext(null);
  assert.equal(Object.keys(ctx.testing.AI_EVAL).length, 0);
  assert.equal(ctx.testing.state.candidates[0].name, '후보자 1');
  assert.equal(/(?:src|href)\s*=\s*["']https?:/i.test(html), false);
  assert.equal(/\b(?:fetch\s*\(|XMLHttpRequest|sendBeacon)/.test(inline), false);
});

test('incomplete or numeric AI is safe for rendering', () => {
  const ctx = uiContext(null);
  vm.runInContext(inline.match(/function esc\(s\)\{[^\n]+/)[0] + '\nglobalThis.escapeValue=esc;', ctx);
  const ai = ctx.testing.normalizeAI({ score: 82, career: [null, 3, { co: '가상회사' }] });
  assert.equal(Object.keys(ai.info).length, 0);
  assert.equal(ai.career.length, 1);
  assert.equal(ctx.escapeValue(ai.score), '82');
  assert.equal(ctx.escapeValue('<script>'), '&lt;script&gt;');
  assert.equal(ctx.testing.normalizeAI(null), null);
});

test('JSON export includes recorded history, scores and AI without removing anything', () => {
  const recorded = { compVer: 2, competencies: [], candidates: [{ id: 'x', name: '가상지원자', answers: { old: '이전 답변' }, questionHistory: [{ answers: { old: '보존 답변' } }], scores: { c1: 5 } }], competencyHistory: [{ version: 1 }] };
  const ctx = uiContext(recorded);
  vm.runInContext(inline.match(/function exportSnapshot\(\)\{[\s\S]*?\n\}/)[0] + '\nglobalThis.snapshot=exportSnapshot;', ctx);
  const backup = ctx.snapshot();
  assert.equal(backup.format, 'interview-prep-backup');
  assert.equal(backup.state.candidates[0].questionHistory[0].answers.old, '보존 답변');
  assert.equal(backup.state.candidates[0].scores.c1, 5);
  assert.equal(backup.state.competencyHistory.length, 1);
  assert.equal(backup.state.candidates[0].answers.old, '이전 답변');
  assert.ok(html.includes('id="jsonExportBtn"'));
  assert.ok(inline.includes('JSON.stringify(exportSnapshot(),null,2)'));
});

test('seed refresh preserves answers, checked items, scores, notes and recorded placeholder candidates', () => {
  const c = { id: 'x', name: '가상지원자', position: '직무', pdfs: [], questions: [{ id: 'q1', cat: 'custom', text: '기존 질문', intent: '검증' }], answers: { q1: '면접 답변' }, checked: { q1: true }, scores: { c1: 4 }, compMemos: { c1: '메모' }, overall: '총평', decision: '보류', done: true };
  const placeholder = { ...structuredClone(c), id: 'placeholder', name: '후보자 1', questions: [{ id: 'p1', cat: 'common', text: '질문' }], answers: { p1: '보존할 답변' } };
  const ctx = uiContext({ compVer: 1, competencies: [], candidates: [c, placeholder], seedVer: 'old' });
  ctx.window.INTERVIEW_SEED_VER = 'new';
  ctx.window.INTERVIEW_SEED = [{ name: c.name, position: '직무', pdfs: ['가상지원자.pdf'], questions: [{ cat: 'custom', text: '기존 질문', intent: '변경된 의도' }, { cat: 'common', text: '새 질문', intent: '검증' }] }];
  ctx.testing.applySeed();
  const kept = ctx.testing.state.candidates.find(x => x.name === c.name);
  assert.equal(kept.questions[0].id, 'q1');
  assert.equal(kept.answers.q1, '면접 답변');
  assert.equal(kept.checked.q1, true);
  assert.equal(kept.scores.c1, 4);
  assert.equal(kept.compMemos.c1, '메모');
  assert.equal(kept.overall, '총평');
  assert.equal(kept.decision, '보류');
  assert.equal(kept.done, true);
  assert.ok(ctx.testing.state.candidates.some(x => x.id === 'placeholder'));
  ctx.testing.mergeQuestions(kept, [{ cat: 'common', text: '완전히 다른 질문', intent: '검증' }]);
  assert.equal(kept.answers.q1, '면접 답변');
  assert.ok(kept.questionHistory.some(h => h.answers.q1 === '면접 답변'));
});
