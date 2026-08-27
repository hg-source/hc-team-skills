#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import utils from './file-utils.cjs';

const skillRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function setup(destination) {
  destination = path.resolve(destination || process.env.EGNIS_INTERVIEW_DIR || path.join(os.homedir(), 'Documents', 'EGNIS 면접도구'));
  // Runtime data must not be written into the installed/distributed skill.
  const relative = path.relative(skillRoot, destination);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new Error('Choose a workspace outside the installed skill directory.');
  }
  const html = fs.readFileSync(path.join(skillRoot, 'assets', '면접툴.html'));
  fs.mkdirSync(destination, { recursive: true });
  const result = utils.writePreserving(path.join(destination, '면접툴.html'), html);
  if (result.backup) console.error(`HTML backup: ${result.backup}`);
  const seed = path.join(destination, '면접_시드.js');
  if (!fs.existsSync(seed)) {
    fs.writeFileSync(seed, "window.INTERVIEW_SEED_VER='initial';\nwindow.INTERVIEW_SEED=[];\n", { encoding: 'utf8', flag: 'wx' });
  }
  return destination;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(setup(process.argv[2])); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
