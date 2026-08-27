#!/usr/bin/env node
const now = new Date();

function parseMonth(value, label) {
  const match = String(value || '').trim().match(/^(\d{4})[.\/-](\d{1,2})$/);
  if (!match) throw new Error(`${label}은 YYYY.MM 형식이어야 합니다: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error(`${label} 월이 올바르지 않습니다: ${value}`);
  return { year, month, text: `${year}.${String(month).padStart(2, '0')}` };
}

const startArg = process.argv[2];
const endArg = process.argv[3];
const asOfArg = process.argv[4];
if (!startArg || !endArg) {
  console.error('사용법: node career-duration.js <시작 YYYY.MM> <종료 YYYY.MM|재직> [기준 YYYY.MM]');
  process.exit(1);
}

try {
  const start = parseMonth(startArg, '시작월');
  const ongoing = /^(재직|현재|present)$/i.test(endArg.trim());
  const end = ongoing
    ? parseMonth(asOfArg || `${now.getFullYear()}.${now.getMonth() + 1}`, '기준월')
    : parseMonth(endArg, '종료월');
  const months = (end.year - start.year) * 12 + (end.month - start.month) + 1;
  if (months <= 0) throw new Error('종료월은 시작월보다 빠를 수 없습니다.');
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const duration = `${years ? `${years}년` : ''}${remainder ? `${remainder}개월` : ''}` || '0개월';
  const endText = ongoing ? '재직' : end.text;
  const asOfText = ongoing ? `, ${end.text} 기준` : '';
  console.log(`${start.text}~${endText} (${duration}${asOfText})`);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
