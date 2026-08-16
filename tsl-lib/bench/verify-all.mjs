// tsl-lib verification gate — the one command that decides "verified".
//
//   node verify-all.mjs                    # every node, full gate
//   node verify-all.mjs fbm-mx worley      # listed nodes only
//   node verify-all.mjs --cost-only        # cost pass only, merge into registry
//
// Full gate per node:
//   1. PARITY  — frozen-clock sweep grid on the node's parityGeo, rendered on
//                webgpu AND webgl2, pixel-diffed within per-node tolerance
//                (validity checks catch blank/constant frames first).
//   2. LIVE    — animated smoke on both backends: console-error gate + wall-ms.
//   3. MOBILE  — advisory: 390x844 @ DPR 2 on webgpu; flags nodes over budget.
//   4. COST    — docs/COST-METHOD.md protocol: vsync-disabled browser, fixed
//                800x600 stage, frozen clock, 30 warm + 150 measured frames;
//                GPU timestamps on webgpu (basis 'gpu'), wall dt otherwise.
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
const FREEZE = 2.5;           // parity + cost clock (seconds)
const MOBILE_BUDGET_MS = 20;  // advisory threshold
// cost-class thresholds (ms on the baseline device, 800x600 stage) —
// calibrated 2026-07-29 to the gen-9 iGPU baseline so the library's spread
// lands usefully across ①–⑤: ① ≤0.25 · ② ≤1 · ③ ≤3 · ④ ≤8 · ⑤ above
const CLASS_MS = [0.25, 1, 3, 8];
const classOf = (ms) => ms == null ? null : CLASS_MS.findIndex((t) => ms <= t) + 1 || 5;

const args = process.argv.slice(2);
const COST_ONLY = args.includes('--cost-only');
const named = args.filter((a) => !a.startsWith('--'));
const nodeNames = named.length ? named : Object.keys(nodes);
mkdirSync(join(BENCH, 'shots'), { recursive: true });

const server = spawn('python', ['-m', 'http.server', String(PORT)], { cwd: LIB, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(800);

const url = (params) => `http://localhost:${PORT}/bench/index.html?` + new URLSearchParams(params);

async function capture(browser, params, shotPath, { settle = 900, viewport = null, waitFor = 'ready' } = {}) {
  const page = await browser.newPage();
  // the per-profile disk cache survives between runs and python's http.server
  // sends no cache headers, so without this the gate can certify a stale
  // module as verified (observed 2026-08-16 on bench/nodes.mjs)
  await page.setCacheEnabled(false);
  if (viewport) await page.setViewport(viewport);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  try {
    await page.goto(url(params), { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(`window.__bench.${waitFor} || window.__bench.error`, { timeout: 90000 });
    const b = await page.evaluate(() => window.__bench);
    if (b.error) throw new Error(b.error);
    if (b.backend !== params.backend) throw new Error(`requested ${params.backend}, got ${b.backend}`);
    if (waitFor === 'ready') {
      await sleep(settle);
      b.frameMs = await page.evaluate(() => window.__bench.frameMs);
      if (shotPath) await page.screenshot({ path: shotPath });
    }
    return { ok: errors.length === 0, bench: b, errors };
  } catch (err) {
    errors.push(String(err.message || err).slice(0, 300));
    return { ok: false, bench: null, errors };
  } finally {
    await page.close();
  }
}

const launch = (profile, extraArgs = []) => puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--enable-unsafe-webgpu', '--window-size=900,900', '--hide-scrollbars',
         '--no-first-run', `--user-data-dir=${join(BENCH, 'chrome-profile-' + profile)}`,
         ...extraArgs],
  defaultViewport: { width: 900, height: 900 },
});

const results = {};
for (const name of nodeNames) results[name] = { parityShots: {}, live: {}, impl: {}, mobile: null, cost: {}, fails: [] };

try {
  if (!COST_ONLY) {
    for (const backend of ['webgpu', 'webgl2']) {
      const browser = await launch(backend);
      for (const name of nodeNames) {
        const R = results[name];
        const parityShot = join(BENCH, 'shots', `parity-${name}-${backend}.png`);
        const p = await capture(browser, { node: name, backend, sweep: '1', freeze: String(FREEZE) }, parityShot);
        if (p.ok) R.parityShots[backend] = parityShot;
        else R.fails.push(`parity/${backend}: ${p.errors.join(' | ')}`);
        R.impl[backend] = p.bench && p.bench.impl;

        const l = await capture(browser, { node: name, backend },
          join(BENCH, 'shots', `live-${name}-${backend}.png`), { settle: 2500 });
        if (l.ok) R.live[backend] = +l.bench.frameMs.toFixed(1);
        else R.fails.push(`live/${backend}: ${l.errors.join(' | ')}`);

        if (backend === 'webgpu') {
          const m = await capture(browser, { node: name, backend }, null,
            { settle: 2500, viewport: { width: 390, height: 844, deviceScaleFactor: 2 } });
          R.mobile = m.ok ? +m.bench.frameMs.toFixed(1) : null;
        }
      }
      await browser.close();
    }
  }

  // COST phase — its own browser: vsync off so wall dt is honest
  for (const backend of ['webgpu', 'webgl2']) {
    const browser = await launch('cost-' + backend, ['--disable-gpu-vsync', '--disable-frame-rate-limit']);
    for (const name of nodeNames) {
      const R = results[name];
      const c = await capture(browser,
        { node: name, backend, cost: '1', freeze: String(FREEZE) }, null,
        { viewport: { width: 800, height: 600 }, waitFor: 'costDone' });
      if (c.ok && c.bench.cost) R.cost[backend] = c.bench.cost;
      else R.fails.push(`cost/${backend}: ${c.errors.join(' | ')}`);
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
  const id = nodes[name].id || 'bench/' + name;
  const prev = registry[id] || {};

  const cw = R.cost.webgpu, cg = R.cost.webgl2;
  const gpuMs = cw && cw.gpu ? cw.gpu.median : null;
  const wallMs = {
    webgpu: cw && cw.wall ? cw.wall.median : null,
    webgl2: cg && cg.wall ? cg.wall.median : null,
  };
  const basisMs = gpuMs != null ? gpuMs : wallMs.webgpu;
  const cost = (cw || cg) ? {
    gpuMs, gpuP95: cw && cw.gpu ? cw.gpu.p95 : null,
    wallMs, wallP95: { webgpu: cw && cw.wall ? cw.wall.p95 : null, webgl2: cg && cg.wall ? cg.wall.p95 : null },
    mobileWallMs: COST_ONLY ? (prev.cost ? prev.cost.mobileWallMs ?? null : null) : R.mobile,
    costClass: classOf(basisMs),
    basis: gpuMs != null ? 'gpu' : 'wall',
  } : prev.cost || null;

  if (cw && cw.device) {
    registry._baseline = { gpu: cw.device.gpu, browser: (cw.device.ua.match(/Chrome\/[\d.]+/) || [null])[0],
                          os: 'Windows 10', three: 'r178', date: today };
  }

  if (COST_ONLY) {
    const ok = R.fails.length === 0;
    if (!ok) failed++;
    registry[id] = { ...prev, cost };
    console.log(`${ok ? 'COST' : 'FAIL'}  ${name.padEnd(22)} ` +
      `gpu ${gpuMs != null ? gpuMs.toFixed(2) : '--'} ms  ` +
      `wall ${wallMs.webgpu ?? '--'}/${wallMs.webgl2 ?? '--'} ms  ` +
      `class ${cost && cost.costClass ? '①②③④⑤'[cost.costClass - 1] : '--'}` +
      (R.fails.length ? `\n      ${R.fails.join('\n      ')}` : ''));
    continue;
  }

  let parity = { pass: false, error: 'missing parity shots' };
  if (R.parityShots.webgpu && R.parityShots.webgl2) {
    parity = diff(R.parityShots.webgpu, R.parityShots.webgl2,
      nodes[name].parityTolerance || {}, join(BENCH, 'shots', `parity-${name}-diff.png`));
    if (!parity.pass) R.fails.push(`parity diff: ${parity.error || parity.diffPct + '% > ' + parity.tolerance.maxDiffPct + '%'}`);
  }
  const ok = R.fails.length === 0;
  if (!ok) failed++;

  registry[id] = {
    status: ok ? 'verified' : 'failed',
    impl: R.impl,
    parity: parity.error ? { pass: false, error: parity.error }
      : { pass: parity.pass, diffPct: parity.diffPct, tolerance: parity.tolerance },
    cost,
    mobileOverBudget: R.mobile != null ? R.mobile > MOBILE_BUDGET_MS : null,
    three: 'r178',
    verified: today,
  };

  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(22)} ` +
    `parity ${parity.diffPct != null ? parity.diffPct + '%' : '--'}  ` +
    `impl ${R.impl.webgpu || '?'}/${R.impl.webgl2 || '?'}  ` +
    `gpu ${gpuMs != null ? gpuMs.toFixed(2) : '--'} ms  class ${cost && cost.costClass ? '①②③④⑤'[cost.costClass - 1] : '--'}` +
    (R.fails.length ? `\n      ${R.fails.join('\n      ')}` : ''));
}

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');
console.log(`\nregistry updated: ${REGISTRY}`);
process.exit(failed ? 1 : 0);
