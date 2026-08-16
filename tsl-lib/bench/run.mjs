// tsl-lib bench runner — puppeteer matrix {webgpu, webgl2} × node list.
//
//   node run.mjs                 # full matrix
//   node run.mjs fbm-mx          # one node, both backends
//   node run.mjs fbm-mx webgpu   # one combo
//
// Serves the tsl-lib dir itself (so ./vendor resolves), screenshots each combo
// to shots/, hard-fails on any console error or backend mismatch, and dumps
// the runtime TSL export surface to ../docs/tsl-exports.json.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { nodes } from './nodes.mjs';

const BENCH = dirname(fileURLToPath(import.meta.url));
const LIB = dirname(BENCH);
const PORT = 8631;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const argNode = process.argv[2];
const argBackend = process.argv[3];
const nodeNames = argNode ? [argNode] : Object.keys(nodes);
const backends = argBackend ? [argBackend] : ['webgpu', 'webgl2'];

mkdirSync(join(BENCH, 'shots'), { recursive: true });

const server = spawn('python', ['-m', 'http.server', String(PORT)], { cwd: LIB, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(800);

const results = [];
let tslDumped = false;

try {
  for (const backend of backends) {
    const browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--enable-unsafe-webgpu', '--window-size=900,900', '--hide-scrollbars',
             '--no-first-run', `--user-data-dir=${join(BENCH, 'chrome-profile-' + backend)}`],
      defaultViewport: { width: 900, height: 900 },
    });

    for (const name of nodeNames) {
      const page = await browser.newPage();
      // the profile dir persists between runs, and python's http.server offers
      // no cache headers — without this Chrome happily re-serves a stale
      // nodes.mjs and the runner reports PASS on code that never ran
      await page.setCacheEnabled(false);
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
      page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));

      const res = { name, backend, ok: false, actualBackend: null, frameMs: null, errors: consoleErrors };
      results.push(res);
      try {
        await page.goto(`http://localhost:${PORT}/bench/index.html?node=${name}&backend=${backend}`,
                        { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction('window.__bench.ready || window.__bench.error', { timeout: 30000 });
        const b = await page.evaluate(() => window.__bench);
        if (b.error) throw new Error(b.error);
        if (b.backend !== backend) throw new Error(`requested ${backend}, got ${b.backend}`);
        await sleep(2500); // warm
        res.frameMs = await page.evaluate(() => window.__bench.frameMs);
        res.actualBackend = b.backend;
        await page.screenshot({ path: join(BENCH, 'shots', `${name}-${backend}.png`) });

        if (!tslDumped) {
          tslDumped = true;
          const mx = b.tslKeys.filter((k) => k.startsWith('mx_'));
          writeFileSync(join(LIB, 'docs', 'tsl-exports.json'), JSON.stringify({
            revision: b.revision,
            generated: new Date().toISOString().slice(0, 10),
            count: b.tslKeys.length,
            mx,
            keys: b.tslKeys,
          }, null, 2) + '\n');
          console.log(`tsl-exports.json: r${b.revision}, ${b.tslKeys.length} symbols, ${mx.length} mx_*`);
        }
        res.ok = consoleErrors.length === 0;
        if (!res.ok) res.errors = consoleErrors;
      } catch (err) {
        res.errors.push(String(err.message || err).slice(0, 300));
      }
      await page.close();
    }
    await browser.close();
  }
} finally {
  server.kill();
}

let failed = 0;
for (const r of results) {
  const status = r.ok ? 'PASS' : 'FAIL';
  if (!r.ok) failed++;
  console.log(`${status}  ${r.name.padEnd(12)} ${r.backend.padEnd(7)} ` +
    (r.frameMs != null ? `${r.frameMs.toFixed(1)} ms` : '--') +
    (r.errors.length && !r.ok ? `  ${r.errors.join(' | ')}` : ''));
}
process.exit(failed ? 1 : 0);
