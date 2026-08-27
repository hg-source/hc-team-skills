#!/usr/bin/env node
'use strict';
// Reads question/position/AI/PDF files in one workspace. No API dependencies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { clean, localPdfName, writePreserving } = require('./scripts/file-utils.cjs');

function parseQuestions(text) {
  const result = [];
  let cat = 'custom', group = '';
  for (const raw of clean(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bare = line.replace(/[\[\]#>*\s]/g, '');
    if (/^맞춤형?(질문)?$/.test(bare)) { cat = 'custom'; group = ''; continue; }
    if (/^(공통|직무공통)(질문)?$/.test(bare)) { cat = 'common'; group = ''; continue; }
    if (/^[\(\s]*의도\s*[:：]/.test(line)) {
      if (!result.length) throw new Error('의도 앞에 질문이 없습니다.');
      result[result.length - 1].intent = line.replace(/^[\(\s]*의도\s*[:：]\s*/, '').replace(/\)\s*$/, '').trim();
      continue;
    }
    if (/^(#{1,6}|[■▶●▪])\s*/.test(line)) {
      group = line.replace(/^(#{1,6}|[■▶●▪])\s*/, '').trim();
      continue;
    }
    const text = line.replace(/^\s*(\d+[\.\)]|[-•*])\s*/, '').replace(/^질문\s*[:：]\s*/, '').trim();
    if (text) result.push({ cat, group, intent: '', text });
  }
  if (!result.length || result.some(q => !q.intent)) throw new Error('질문 및 모든 질문의 의도가 필요합니다.');
  return result;
}

function build(directory) {
  const files = fs.readdirSync(directory).filter(f => fs.statSync(path.join(directory, f)).isFile()).sort();
  const questionFiles = files.filter(f => /^질문_.+\.txt$/.test(f));
  if (!questionFiles.length) throw new Error('질문_*.txt 파일이 없습니다.');
  const seed = questionFiles.map(file => {
    const name = file.slice(3, -4);
    const questions = parseQuestions(fs.readFileSync(path.join(directory, file), 'utf8'));
    const escaped = name.normalize('NFC').replace(/[.*+?^\$\{\}()|[\]\\]/g, '\\$&');
    const namePattern = new RegExp('(^|[^\\p{L}\\p{N}])' + escaped + '(?=$|[^\\p{L}\\p{N}])', 'u');
    const mapping = path.join(directory, '_pdfs_' + name + '.json');
    let pdfs = fs.existsSync(mapping)
      ? JSON.parse(clean(fs.readFileSync(mapping, 'utf8')))
      : files.filter(f => /\.pdf$/i.test(f) && namePattern.test(f.slice(0, -4).normalize('NFC')));
    if (!Array.isArray(pdfs) || !pdfs.length) throw new Error('연결할 PDF가 없습니다: ' + name + ' (_pdfs_<이름>.json으로 지정 가능)');
    pdfs = [...new Set(pdfs.map(pdf => localPdfName(pdf, directory)))];
    const posFile = path.join(directory, '_position_' + name + '.txt');
    if (!fs.existsSync(posFile)) throw new Error('지원 직무 파일이 필요합니다: ' + path.basename(posFile));
    const position = clean(fs.readFileSync(posFile, 'utf8')).trim();
    if (!position) throw new Error('지원 직무가 비어 있습니다: ' + name);
    const entry = { name, position, pdfs, questions };
    const aiFile = path.join(directory, '_ai_' + name + '.json');
    if (fs.existsSync(aiFile)) {
      const ai = JSON.parse(clean(fs.readFileSync(aiFile, 'utf8')));
      if (!ai || typeof ai !== 'object' || Array.isArray(ai)) throw new Error('AI 평가 형식 오류: ' + name);
      entry.ai = ai;
    }
    return entry;
  });
  const version = crypto.createHash('sha256').update(JSON.stringify(seed)).digest('hex').slice(0, 20);
  const body = '/* Generated locally by interview-prep. Do not publish candidate data. */\n'
    + 'window.INTERVIEW_SEED_VER=' + JSON.stringify(version) + ';\n'
    + 'window.INTERVIEW_SEED=' + JSON.stringify(seed, null, 1) + ';\n';
  const result = writePreserving(path.join(directory, '면접_시드.js'), body);
  return { seed, version, ...result };
}

if (require.main === module) {
  try {
    const result = build(path.resolve(process.argv[2] || process.cwd()));
    for (const c of result.seed) console.log(JSON.stringify({ name: c.name, position: c.position, questions: c.questions.length, pdfs: c.pdfs.length, ai: Boolean(c.ai) }));
    console.log(result.changed ? '면접_시드.js 갱신 완료' : '변경 없음: 기존 시드 보존');
    if (result.backup) console.log('Backup: ' + result.backup);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { parseQuestions, build };
