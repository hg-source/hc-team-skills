#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { clean, localPdfName } = require('./file-utils.cjs');

function verify(seedPath, expectedNames = []) {
  const sandbox = { window: {} };
  vm.runInNewContext(clean(fs.readFileSync(seedPath, 'utf8')), sandbox, { filename: seedPath, timeout: 1000 });
  const seed = sandbox.window.INTERVIEW_SEED;
  if (!Array.isArray(seed)) throw new Error('window.INTERVIEW_SEED must be an array.');
  const seen = new Set();
  for (const entry of seed) {
    if (!entry.name || !entry.position || seen.has(entry.name)) throw new Error('Candidate name/position missing or duplicated.');
    seen.add(entry.name);
    if (!Array.isArray(entry.questions) || !entry.questions.length || entry.questions.some(q => !q.text?.trim() || !q.intent?.trim() || !['custom', 'common'].includes(q.cat))) {
      throw new Error(`Invalid questions/intents: ${entry.name}`);
    }
    if (!Array.isArray(entry.pdfs) || !entry.pdfs.length) throw new Error(`PDF missing: ${entry.name}`);
    for (const pdf of entry.pdfs) localPdfName(pdf, path.dirname(seedPath));
    if (entry.ai !== undefined && (!entry.ai || typeof entry.ai !== 'object' || Array.isArray(entry.ai))) throw new Error(`Invalid AI evaluation: ${entry.name}`);
  }
  for (const name of expectedNames) if (!seen.has(name)) throw new Error(`Expected candidate missing: ${name}`);
  return seed.map(entry => ({ name: entry.name, position: entry.position, questions: entry.questions.length, pdfs: entry.pdfs.length, ai: Boolean(entry.ai) }));
}

if (require.main === module) {
  try {
    const filename = path.resolve(process.argv[2] || '면접_시드.js');
    for (const row of verify(filename, process.argv.slice(3))) console.log(JSON.stringify(row));
    console.log('Seed validation passed.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { verify };
