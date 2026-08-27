#!/usr/bin/env node
/**
 * fetch-jd.mjs — 이그니스 채용 공고(JD) 조회기
 *
 * career.egnis.kr(그리팅/GreetingHR 기반, workspace 7398)에서 현재 채용 중인
 * 공고 목록과 각 공고의 JD 전문을 가져온다. 브라우저 User-Agent가 없으면 403이므로 필수.
 *
 * 캐시 우선(cache-first): 직무별 JD는 처음 조회할 때만 웹에서 읽어 로컬에 저장하고,
 * 같은 직무를 다시 조회하면 저장본을 사용한다(웹 접속 없음). 저장본이 없을 때만 웹 조회 후 저장.
 * 공고는 한 번 올라가면 거의 바뀌지 않으므로 기본 동작이 캐시 우선이다. 최신 재조회는 --refresh.
 *
 * 사용법:
 *   node fetch-jd.mjs "상품기획 팀장"             # 캐시에 있으면 저장본, 없으면 웹→저장 후 출력
 *   node fetch-jd.mjs "상품기획" --division 헬스케어
 *   node fetch-jd.mjs --id 222821                # openingId로 JD (캐시 우선)
 *   node fetch-jd.mjs "상품기획 팀장" --json       # 기계 파싱용 JSON
 *   node fetch-jd.mjs "상품기획 팀장" --refresh    # 캐시 무시하고 웹에서 새로 읽어 저장본 갱신
 *   node fetch-jd.mjs --list                     # 현재 웹 공고 목록(항상 라이브, discovery용)
 *   node fetch-jd.mjs --list --division 헬스케어
 *   node fetch-jd.mjs --cached                   # 저장된 JD 목록만(웹 접속 없음)
 *   node fetch-jd.mjs --cache-dir <경로>          # 캐시 위치 지정(기본은 아래 DEFAULT_CACHE_DIR)
 *
 * 매칭이 여러 건이면 후보 목록만 출력하고 종료(사용자가 좁히도록).
 * 아무 것도 못 찾으면 exit code 3, 네트워크/파싱 실패는 exit code 2.
 * 출력에는 [cache]/[web] 표시를 stderr로 남겨 어디서 왔는지 알 수 있다.
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import utils from './scripts/file-utils.cjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const BASE = 'https://career.egnis.kr';

// 캐시는 설치 폴더 밖의 사용자 작업 폴더에 저장한다.
// 환경변수 JD_CACHE_DIR 또는 --cache-dir 로 덮어쓸 수 있다.
const DEFAULT_CACHE_DIR =
  path.join(process.env.EGNIS_INTERVIEW_DIR || path.join(os.homedir(), 'Documents', 'EGNIS 면접도구'), 'jd-cache');

function get(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'text/html,application/json' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // follow redirect
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : BASE + res.headers.location;
          res.resume();
          return get(next, redirects + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
  });
}

function extractNextData(html) {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!m) throw new Error('__NEXT_DATA__ not found');
  return JSON.parse(m[1]);
}

// dehydratedState.queries 안에서 원하는 데이터를 형태로 찾는다(그리팅이 쿼리 순서를 바꿔도 견디도록).
function findInQueries(nextData, predicate) {
  const roots = [];
  const props = nextData?.props || {};
  for (const key of ['pageProps', 'props']) {
    const q = props?.[key]?.dehydratedState?.queries;
    if (Array.isArray(q)) roots.push(...q);
  }
  for (const q of roots) {
    const data = q?.state?.data;
    const hit = predicate(data);
    if (hit) return hit;
  }
  return null;
}

async function listOpenings() {
  const html = await get(`${BASE}/ko/apply`);
  const nd = extractNextData(html);
  // 공고 배열: 각 원소가 openingId + title 을 가진 배열
  const arr = findInQueries(nd, (data) => {
    if (Array.isArray(data) && data.length && data[0] && data[0].openingId && data[0].title)
      return data;
    return null;
  });
  if (!arr) throw new Error('openings array not found on /ko/apply');
  return arr.map((o) => {
    const p = (o.openingJobPosition?.openingJobPositions || [])[0] || {};
    const c = p.jobPositionCareer;
    const careerStr = c
      ? `${c.careerFrom ?? ''}~${c.careerTo ?? ''}년(${c.careerType || ''})`
      : '';
    return {
      openingId: o.openingId,
      title: o.title,
      division: o.workspaceDivision?.division || o.workspaceDivision?.name || '',
      occupation: p.workspaceOccupation?.occupation || '',
      career: careerStr,
      openDate: o.openDate || '',
      dueDate: o.dueDate || '',
      url: `${BASE}/ko/o/${o.openingId}`,
    };
  });
}

function htmlToText(html) {
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr|br|ul|ol)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchJDFromWeb(openingId, meta = {}) {
  const html = await get(`${BASE}/ko/o/${openingId}`);
  const nd = extractNextData(html);
  const info = findInQueries(nd, (data) => data?.data?.openingsInfo || null);
  if (!info) throw new Error(`openingsInfo not found for ${openingId}`);
  return {
    openingId: Number(openingId) || openingId,
    title: meta.title || info.title || info.name || '',
    division: meta.division || '',
    occupation: meta.occupation || '',
    career: meta.career || '',
    url: `${BASE}/ko/o/${openingId}`,
    detailHtml: info.detail || '',
    detailText: htmlToText(info.detail || ''),
    fetchedAt: new Date().toISOString(),
    source: 'web',
  };
}

// ---- 캐시 ----
function cacheDir(args) {
  return args.cacheDir || process.env.JD_CACHE_DIR || DEFAULT_CACHE_DIR;
}
function cachePathFor(dir, openingId) {
  return path.join(dir, `${openingId}.json`);
}
function readCacheById(dir, openingId) {
  try {
    const p = cachePathFor(dir, openingId);
    if (!fs.existsSync(p)) return null;
    const obj = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
    obj.source = 'cache';
    return obj;
  } catch {
    return null;
  }
}
function listCached(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          const obj = JSON.parse(
            fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, '')
          );
          obj.source = 'cache';
          return obj;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
function writeCache(dir, jd) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    utils.writePreserving(
      cachePathFor(dir, jd.openingId),
      JSON.stringify(jd, null, 2)
    );
    return true;
  } catch (e) {
    console.error('[cache] 저장 실패:', e.message);
    return false;
  }
}

// 키워드/부문으로 목록(웹 또는 캐시)에서 매칭
function matchOpenings(list, kw, division) {
  let arr = list;
  if (division)
    arr = arr.filter(
      (o) =>
        (o.division || '').includes(division) ||
        (o.title || '').includes(division)
    );
  if (!kw) return arr;
  const toks = kw.split(/\s+/).map((t) => t.replace(/\s/g, ''));
  return arr.filter((o) => {
    const t = (o.title || '').replace(/\s/g, '');
    return toks.every((tok) => t.includes(tok));
  });
}

function printJD(jd, asJson) {
  if (asJson) console.log(JSON.stringify(jd, null, 2));
  else console.log(`# ${jd.title}\n${jd.url}\n\n${jd.detailText}`);
}

function parseArgs(argv) {
  const out = {
    _: [],
    list: false,
    cached: false,
    json: false,
    refresh: false,
    id: null,
    division: null,
    cacheDir: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') out.list = true;
    else if (a === '--cached') out.cached = true;
    else if (a === '--json') out.json = true;
    else if (a === '--refresh' || a === '--force-web') out.refresh = true;
    else if (a === '--id') out.id = argv[++i];
    else if (a === '--division') out.division = argv[++i];
    else if (a === '--cache-dir') out.cacheDir = argv[++i];
    else out._.push(a);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.id !== null && !/^\d+$/.test(args.id || '')) throw new Error('--id must be a numeric opening ID');
  const dir = cacheDir(args);

  // --list: 항상 라이브 웹 목록(현재 열린 공고 discovery용)
  if (args.list) {
    const openings = await listOpenings();
    const filtered = args.division
      ? openings.filter(
          (o) =>
            (o.division || '').includes(args.division) ||
            (o.title || '').includes(args.division)
        )
      : openings;
    if (args.json) console.log(JSON.stringify(filtered, null, 2));
    else
      for (const o of filtered)
        console.log(
          `${o.openingId} | ${o.title} | ${o.occupation} | ${o.career}${o.dueDate ? ' | 마감 ' + o.dueDate : ''}`
        );
    return;
  }

  // --cached: 저장된 JD 목록만(웹 접속 없음)
  if (args.cached) {
    const cached = matchOpenings(listCached(dir), args._.join(' ').trim(), args.division);
    if (args.json) console.log(JSON.stringify(cached, null, 2));
    else if (cached.length === 0) console.log(`(캐시 비어있음: ${dir})`);
    else
      for (const o of cached)
        console.log(`${o.openingId} | ${o.title} | ${o.occupation || ''} | 저장 ${o.fetchedAt || '?'}`);
    return;
  }

  // --id: 캐시 우선 → 없으면 웹 조회 후 저장
  if (args.id) {
    if (!args.refresh) {
      const hit = readCacheById(dir, args.id);
      if (hit) {
        console.error(`[cache] ${args.id} 저장본 사용`);
        return printJD(hit, args.json);
      }
    }
    console.error(`[web] ${args.id} 웹 조회 중…`);
    // 메타데이터 보강 위해 목록 시도(실패해도 상세는 가져옴)
    let meta = {};
    try {
      const found = (await listOpenings()).find((o) => String(o.openingId) === String(args.id));
      if (found) meta = found;
    } catch {}
    const jd = await fetchJDFromWeb(args.id, meta);
    if (writeCache(dir, jd)) console.error(`[cache] ${args.id} 저장 완료`);
    return printJD(jd, args.json);
  }

  const kw = args._.join(' ').trim();
  if (!kw) {
    console.error('키워드나 --id / --list / --cached 를 지정하세요.');
    process.exit(1);
  }

  // 키워드: 캐시 우선(--refresh면 건너뜀)
  if (!args.refresh) {
    const cachedMatches = matchOpenings(listCached(dir), kw, args.division);
    if (cachedMatches.length === 1) {
      const full = readCacheById(dir, cachedMatches[0].openingId);
      console.error(`[cache] "${kw}" → ${cachedMatches[0].openingId} 저장본 사용`);
      return printJD(full || cachedMatches[0], args.json);
    }
    if (cachedMatches.length > 1) {
      console.error(`캐시에 여러 건 매칭(--id로 좁히거나 --refresh):`);
      for (const o of cachedMatches) console.error(`  ${o.openingId} | ${o.title}`);
      process.exit(3);
    }
    // 캐시 미스 → 웹으로
  }

  console.error(`[web] "${kw}" 웹 조회 중…`);
  const openings = await listOpenings();
  const matches = matchOpenings(openings, kw, args.division);
  if (matches.length === 0) {
    console.error(`매칭 공고 없음: "${kw}"${args.division ? ' (부문:' + args.division + ')' : ''}`);
    console.error('현재 공고 목록:');
    for (const o of matchOpenings(openings, '', args.division))
      console.error(`  ${o.openingId} | ${o.title}`);
    process.exit(3);
  }
  if (matches.length > 1) {
    console.error(`여러 공고가 매칭됨(하나로 좁히거나 --id 사용):`);
    for (const o of matches) console.error(`  ${o.openingId} | ${o.title}`);
    process.exit(3);
  }
  const jd = await fetchJDFromWeb(matches[0].openingId, matches[0]);
  if (writeCache(dir, jd)) console.error(`[cache] ${jd.openingId} 저장 완료`);
  printJD(jd, args.json);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(2);
});
