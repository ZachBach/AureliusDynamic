// tsl-lib verification gate — the one command that decides "verified".
//
//   node verify-all.mjs           # every node
//   node verify-all.mjs fbm-mx    # one node
//
// Per node:
//   1. PARITY  — frozen-clock sweep grid on the node's parityGeo, rendered on
//                webgpu AND webgl2, pixel-diffed within per-node tolerance
//                (validity checks catch blank/constant frames first).
//   2. LIVE    — animated smoke on both backends: console-error gate + wall-ms.
//   3. MOBILE  — advisory: 390x844 @ DPR 2 on webgpu; flags nodes over budget.
// Results merge into ../docs/REGISTRY.json (the single source of truth).
// Exit 1 if anything failed. Screenshots + diff heat maps land in shots/.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { nodes } from './nodes.mjs';
import { diff } from './compare.mjs';

const BENCH = dirname(fileURLToPath(import.meta.url));
const LIB = dirname(BENCH);
const REGISTRY = join(LIB, 'docs', 'REGISTRY.json');
const PORT = 8632;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FREEZE = 2.5;           // parity clock (seconds)
const MOBILE_BUDGET_MS = 20;  // advisory threshold

const nodeNames = process.argv[2] ? [process.argv[2]] : Object.keys(nodes);
mkdirSync(join(BENCH, 'shots'), { recursive: true });

const server = spawn('python', ['-m', 'http.server', String(PORT)], { cwd: LIB, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(800);

const url = (params) => `http://localhost:${PORT}/bench/index.html?` + new URLSearchParams(params);

async function capture(browser, params, shotPath, { settle = 900, viewport = null } = {}) {
  const page = await browser.newPage();
  if (viewport) await page.setViewport(viewport);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  try {
    await page.goto(url(params), { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction('window.__bench.ready || window.__bench.error', { timeout: 30000 });
    const b = await page.evaluate(() => window.__bench);
    if (b.error) throw new Error(b.error);
    if (b.backend !== params.backend) throw new Error(`requested ${params.backend}, got ${b.backend}`);
    await sleep(settle);
    const frameMs = await page.evaluate(() => window.__bench.frameMs);
    if (shotPath) await page.screenshot({ path: shotPath });
    return { ok: errors.length === 0, impl: b.impl, frameMs, errors };
  } catch (err) {
    errors.push(String(err.message || err).slice(0, 300));
    return { ok: false, impl: null, frameMs: null, errors };
  } finally {
    await page.close();
  }
}

const launch = (backend) => puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--enable-unsafe-webgpu', '--window-size=900,900', '--hide-scrollbars',
         '--no-first-run', `--user-data-dir=${join(BENCH, 'chrome-profile-' + backend)}`],
  defaultViewport: { width: 900, height: 900 },
});

const results = {};
for (const name of nodeNames) results[name] = { parityShots: {}, live: {}, impl: {}, mobile: null, fails: [] };

try {
  for (const backend of ['webgpu', 'webgl2']) {
    const browser = await launch(backend);
    for (const name of nodeNames) {
      const R = results[name];
      const parityShot = join(BENCH, 'shots', `parity-${name}-${backend}.png`);
      const p = await capture(browser, { node: name, backend, sweep: '1', freeze: String(FREEZE) }, parityShot);
      if (p.ok) R.parityShots[backend] = parityShot;
      else R.fails.push(`parity/${backend}: ${p.errors.join(' | ')}`);
      R.impl[backend] = p.impl;

      const l = await capture(browser, { node: name, backend },
        join(BENCH, 'shots', `live-${name}-${backend}.png`), { settle: 2500 });
      if (l.ok) R.live[backend] = +l.frameMs.toFixed(1);
      else R.fails.push(`live/${backend}: ${l.errors.join(' | ')}`);

      if (backend === 'webgpu') {
        const m = await capture(browser, { node: name, backend }, null,
          { settle: 2500, viewport: { width: 390, height: 844, deviceScaleFactor: 2 } });
        R.mobile = m.ok ? +m.frameMs.toFixed(1) : null;
      }
    }
    await browser.close();
  }
} finally {
  server.kill();
}

// parity diff + registry merge
const registry = existsSync(REGISTRY) ? JSON.parse(readFileSync(REGISTRY, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
let failed = 0;

for (const name of nodeNames) {
  const R = results[name];
  let parity = { pass: false, error: 'missing parity shots' };
  if (R.parityShots.webgpu && R.parityShots.webgl2) {
    parity = diff(R.parityShots.webgpu, R.parityShots.webgl2,
      nodes[name].parityTolerance || {}, join(BENCH, 'shots', `parity-${name}-diff.png`));
    if (!parity.pass) R.fails.push(`parity diff: ${parity.error || parity.diffPct + '% > ' + parity.tolerance.maxDiffPct + '%'}`);
  }
  const ok = R.fails.length === 0;
  if (!ok) failed++;

  registry[nodes[name].id || 'bench/' + name] = {
    status: ok ? 'verified' : 'failed',
    impl: R.impl,
    parity: parity.error ? { pass: false, error: parity.error }
      : { pass: parity.pass, diffPct: parity.diffPct, tolerance: parity.tolerance },
    cost: { gpuMs: null, wallMs: R.live, mobileWallMs: R.mobile, costClass: null },
    mobileOverBudget: R.mobile != null ? R.mobile > MOBILE_BUDGET_MS : null,
    three: 'r178',
    verified: today,
  };

  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(12)} ` +
    `parity ${parity.diffPct != null ? parity.diffPct + '%' : '--'}  ` +
    `impl ${R.impl.webgpu || '?'}/${R.impl.webgl2 || '?'}  ` +
    `live ${R.live.webgpu ?? '--'}/${R.live.webgl2 ?? '--'} ms  ` +
    `mobile ${R.mobile ?? '--'} ms${R.mobile > MOBILE_BUDGET_MS ? ' ⚠ OVER BUDGET' : ''}` +
    (R.fails.length ? `\n      ${R.fails.join('\n      ')}` : ''));
}

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');
console.log(`\nregistry updated: ${REGISTRY}`);
process.exit(failed ? 1 : 0);
