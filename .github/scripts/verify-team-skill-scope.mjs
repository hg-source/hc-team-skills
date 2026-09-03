import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'TEAM_SKILLS.json'), 'utf8'));
const allowlist = JSON.parse(fs.readFileSync(path.join(repo, 'TEAM_SKILL_FILES.json'), 'utf8'));
const skillRoot = path.join(repo, manifest.skill_root);
const expected = [...manifest.skills].sort();
const actual = fs.readdirSync(skillRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();
const failures = [];

function listFiles(root, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const full = path.join(root, entry.name);
    if (fs.lstatSync(full).isSymbolicLink()) failures.push(`Linked path: ${rel}`);
    else if (entry.isDirectory()) files.push(...listFiles(full, rel));
    else if (entry.isFile()) files.push(rel);
    else failures.push(`Non-regular path: ${rel}`);
  }
  return files.sort();
}

if (manifest.profile !== 'team-25' || manifest.expected_count !== 25 || expected.length !== 25 || new Set(expected).size !== 25) {
  failures.push('TEAM_SKILLS.json must define exactly 25 unique skills.');
}
const extras = actual.filter(name => !expected.includes(name));
const missing = expected.filter(name => !actual.includes(name));
if (extras.length) failures.push(`Extra skill directories: ${extras.join(', ')}`);
if (missing.length) failures.push(`Missing skill directories: ${missing.join(', ')}`);
for (const name of expected) {
  const entry = path.join(skillRoot, name, 'SKILL.md');
  if (!fs.existsSync(entry)) failures.push(`Missing entrypoint: ${name}/SKILL.md`);
  else if (fs.lstatSync(path.join(skillRoot, name)).isSymbolicLink()) failures.push(`Linked skill directory: ${name}`);
  else {
    const actualFiles = listFiles(path.join(skillRoot, name));
    const allowedFiles = [...(allowlist.skills?.[name] || [])].sort();
    if (JSON.stringify(actualFiles) !== JSON.stringify(allowedFiles)) failures.push(`File allowlist mismatch: ${name}`);
    const skillText = fs.readFileSync(entry, 'utf8').replace(/^\uFEFF/, '');
    if (!/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(skillText)) failures.push(`Missing YAML frontmatter: ${name}`);
  }
}
if (fs.existsSync(path.join(repo, 'bundles'))) failures.push('bundles/ is forbidden in the team-25 repository.');

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`team-25 scope verified: ${expected.length} skills, no bundles\n`);
