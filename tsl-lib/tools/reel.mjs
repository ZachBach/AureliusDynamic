/**
 * reel.mjs — render a studio app's reel headless, from a storyboard module.
 *
 *   node tsl-lib/tools/reel.mjs tsl-lib/tools/reels/helix.mjs             # every format
 *   node tsl-lib/tools/reel.mjs tsl-lib/tools/reels/ikos.mjs youtube      # one format
 *   node tsl-lib/tools/reel.mjs <board> [format ...] [--test] [--keep]
 *
 * The engine behind the IKOS, Helix Reactor and Project Phoenix reels. It
 * grew out of helixPulse/tools/video.mjs, which renders PulseMask the same
 * way and keeps its own storyboard; this one takes the storyboard as a module
 * so the app-specific part lives next to the app.
 *
 * ── How a frame is made ──────────────────────────────────────────────────────
 *
 * The page runs in headless Chrome on a real WebGPU adapter with its clock
 * gated: `performance.now` (and `Date.now`, which some engines step by) only
 * advance when the capture loop advances them, one thirtieth of a second per
 * frame. requestAnimationFrame stays real, because Chrome's screenshot waits
 * on a compositor frame and a page with no real animation frame registered
 * never produces one; every real frame simply sees the same instant until
 * the loop moves it. A storyboard decides WHEN the gate closes: an app that
 * benchmarks its GPU at boot (Phoenix) has to run that on the real clock, so
 * `api.gate()` is called from the storyboard's `setup` once the app is live,
 * and the frozen clock continues from wherever real time was.
 *
 * Several pages may be open; Chrome delivers animation frames only to the
 * foreground tab, so every shot brings its page to the front first.
 *
 * ── The storyboard module ────────────────────────────────────────────────────
 *
 *   export default {
 *     name: 'helix',                         // output file prefix
 *     root: '/abs/dir/to/serve',             // static root
 *     out: '/abs/dir/for/output',            // mp4s land here
 *     pages: { app: 'helix/index.html' },    // key → path under root
 *     formats: { ... },                      // optional; default below
 *     setup: async (page, key, fmt, api) => {},   // after load; call api.gate()
 *     boards: {
 *       wide: [ { page: 'app', secs: 6, note: 'orbit',
 *                 at: [[0, async (page, api) => {}]],        // at seconds
 *                 each: async (page, t, api, fmt) => {},     // every frame
 *                 after: async (page, api, fmt) => {} } ],   // once, at the end
 *       tall: [ ... ],
 *     },
 *   }
 *
 * `api` is { tick, settle, gate, sleep, evaluate: page.evaluate }. Output is
 * `<out>/<name>-<format>-<w>x<h>.mp4`, H.264 with a silent AAC track.
 */
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, mkdirSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

let puppeteer;
try {
  puppeteer = createRequire(join(HERE, '..', 'bench', 'package.json'))('puppeteer-core');
} catch {
  console.error('puppeteer-core not found — `npm install` in tsl-lib/bench first.');
  process.exit(2);
}

export const FORMATS = {
  youtube:   { w: 1920, h: 1080, css: [1920, 1080], dpr: 1, board: 'wide', zoom: 1.0 },
  linkedin:  { w: 1080, h: 1080, css: [540, 540],   dpr: 2, board: 'tall', zoom: 0.8 },
  facebook:  { w: 1080, h: 1350, css: [540, 675],   dpr: 2, board: 'tall', zoom: 0.74 },
  instagram: { w: 1080, h: 1920, css: [540, 960],   dpr: 2, board: 'tall', zoom: 0.68 },
};

// Storyboards import these from reel-util.mjs, never from here — see that
// file for why. Re-exported for callers that import the engine directly.
import { lerp, ease, sleep } from './reel-util.mjs';
export { lerp, ease, sleep };

const FREEZE = `(() => {
  const realNow = performance.now.bind(performance);
  const realDate = Date.now.bind(Date);
  const raf = window.requestAnimationFrame.bind(window);
  let gated = false, frozen = 0, d0 = 0, p0 = 0;
  performance.now = () => (gated ? frozen : realNow());
  Date.now = () => (gated ? d0 + (frozen - p0) : realDate());
  window.requestAnimationFrame = (cb) => raf(() => cb(performance.now()));
  window.__gate = () => { if (gated) return; frozen = realNow(); p0 = frozen; d0 = realDate(); gated = true; };
  window.__tick = (ms) => { window.__gate(); frozen += ms; return frozen; };
  window.__settle = () => new Promise((r) => raf(() => raf(() => r(performance.now()))));
})();`;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm', '.ico': 'image/x-icon',
};
function serve(root, port) {
  return new Promise((ok) => {
    const s = createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(root, p));
      if (!file.startsWith(normalize(root))) { res.writeHead(403); return res.end(); }
      let st;
      try { st = statSync(file); } catch { res.writeHead(404); return res.end(); }
      if (st.isDirectory()) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-store' });
      const rs = createReadStream(file);
      rs.on('error', () => { try { res.destroy(); } catch { /* gone */ } });
      res.on('close', () => rs.destroy());
      rs.pipe(res);
    });
    s.on('clientError', (_, sock) => { try { sock.destroy(); } catch { /* gone */ } });
    s.listen(port, '127.0.0.1', () => ok(s));
  });
}

function apiFor(page) {
  return {
    tick: (ms = 1000 / FPS) => page.evaluate((m) => { window.__tick(m); return window.__settle(); }, ms),
    settle: () => page.evaluate(() => window.__settle()),
    gate: () => page.evaluate(() => window.__gate()),
    sleep,
    evaluate: (...a) => page.evaluate(...a),
    FPS,
  };
}

export async function renderReel(board, { formats = null, test = false, keep = false } = {}) {
  const fmts = board.formats || FORMATS;
  const names = formats && formats.length ? formats : Object.keys(fmts);
  for (const nm of names) if (!fmts[nm]) throw new Error(`unknown format "${nm}" — one of ${Object.keys(fmts).join(', ')}`);
  const port = board.port || 8770;
  mkdirSync(board.out, { recursive: true });
  const server = await serve(board.root, port);
  let failed = 0;
  try {
    for (const nm of names) {
      const fmt = fmts[nm];
      const shots = board.boards[fmt.board];
      console.log(`\n== ${board.name} · ${nm}  ${fmt.w}x${fmt.h}  (${fmt.css.join('x')} css @${fmt.dpr}x, ${fmt.board} board)`);
      const frames = join(board.out, 'frames', `${board.name}-${nm}`);
      rmSync(frames, { recursive: true, force: true });
      mkdirSync(frames, { recursive: true });
      const errors = [];
      const offsite = [];
      // A fresh profile every render. An app that persists its state — IKOS
      // keeps its voice, layout and whether the tour was seen in localStorage
      // — would otherwise open the reel wherever the previous run left it.
      const profile = join(HERE, `chrome-profile-reel-${board.name}`);
      rmSync(profile, { recursive: true, force: true });
      const browser = await puppeteer.launch({
        executablePath: CHROME,
        headless: 'new',
        protocolTimeout: 90000,
        // One profile per storyboard, so two reels can render at once.
        args: ['--enable-unsafe-webgpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`],
      });
      const pages = {};
      let n = 0;
      try {
        for (const key of new Set(shots.map((s) => s.page))) {
          const page = await browser.newPage();
          await page.setViewport({ width: fmt.css[0], height: fmt.css[1], deviceScaleFactor: fmt.dpr });
          await page.evaluateOnNewDocument(FREEZE);
          page.on('console', (m) => {
            if (m.type() !== 'error') return;
            // "Failed to load resource" names nothing; the location does.
            const loc = m.location && m.location();
            // Chrome asks every origin for /favicon.ico unbidden. An app with
            // no icon link 404s it in production too; it is the app's note to
            // fix, not a reason to fail a render.
            if (loc && /\/favicon\.ico$/.test(loc.url || '')) { console.warn(`  note  ${key}: the page has no icon link, so Chrome's /favicon.ico request 404s`); return; }
            errors.push(`${key}: ${m.text().slice(0, 200)}${loc && loc.url ? ` — ${loc.url.slice(0, 120)}` : ''}`);
          });
          page.on('pageerror', (e) => errors.push(`${key}: ${String(e).slice(0, 200)}`));
          page.on('requestfailed', (r) => errors.push(`${key}: request failed ${r.url().slice(0, 120)}`));
          page.on('request', (r) => {
            const u = r.url();
            if (!u.startsWith(`http://127.0.0.1:${port}`) && !u.startsWith('data:') && !u.startsWith('blob:')) offsite.push(u.slice(0, 120));
          });
          await page.goto(`http://127.0.0.1:${port}/${board.pages[key]}`, { waitUntil: 'load', timeout: 90000 });
          if (board.setup) await board.setup(page, key, fmt, apiFor(page));
          await page.evaluate(() => window.__gate());
          pages[key] = page;
        }
        const total = shots.reduce((s, sh) => s + (test ? Math.min(45, Math.round(sh.secs * FPS)) : Math.round(sh.secs * FPS)), 0);
        console.log(`  ${shots.length} shots, ${total} frames, ${(total / FPS).toFixed(1)}s`);
        for (const shot of shots) {
          const page = pages[shot.page];
          const api = apiFor(page);
          await page.bringToFront();
          await api.settle();
          const count = test ? Math.min(45, Math.round(shot.secs * FPS)) : Math.round(shot.secs * FPS);
          const pending = (shot.at || []).map(([s, fn]) => [Math.round(s * FPS), fn]);
          process.stdout.write(`  ${shot.note.padEnd(22)} ${String(count).padStart(4)} frames `);
          for (let f = 0; f < count; f++) {
            const t = count > 1 ? f / (count - 1) : 0;
            for (const [at, fn] of pending) if (at === f) await fn(page, api, fmt);
            if (shot.each) await shot.each(page, t, api, fmt);
            await api.tick();
            // optimizeForSpeed: Chrome's fast PNG encoder. The frames go
            // straight into x264, so the extra bytes cost nothing.
            await page.screenshot({ path: join(frames, `${String(n++).padStart(5, '0')}.png`), type: 'png', optimizeForSpeed: true });
            if (f % 30 === 0) process.stdout.write('.');
          }
          // `after` runs once the last frame is captured — where a drag
          // started in `at` releases the button.
          if (shot.after) await shot.after(page, api, fmt);
          process.stdout.write('\n');
        }
      } finally {
        await browser.close();
      }
      if (offsite.length) errors.push(`${offsite.length} off-site request(s): ${[...new Set(offsite)].slice(0, 5).join(', ')}`);
      if (errors.length) {
        failed++;
        console.error(`  ${errors.length} error(s) during the render:`);
        for (const e of [...new Set(errors)].slice(0, 10)) console.error('    ' + e);
      }
      const out = join(board.out, `${board.name}-${nm}-${fmt.w}x${fmt.h}${test ? '-test' : ''}.mp4`);
      const tmp = out + '.tmp.mp4';
      execFileSync('ffmpeg', [
        '-y', '-hide_banner', '-loglevel', 'warning', '-stats',
        '-framerate', String(FPS), '-i', join(frames, '%05d.png'),
        '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
        '-map', '0:v', '-map', '1:a', '-shortest',
        '-vf', `scale=${fmt.w}:${fmt.h}:flags=lanczos,format=yuv420p`,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-r', String(FPS),
        '-c:a', 'aac', '-b:a', '32k', '-movflags', '+faststart',
        tmp,
      ], { stdio: 'inherit' });
      rmSync(out, { force: true });
      execFileSync(process.platform === 'win32' ? 'cmd' : 'mv', process.platform === 'win32' ? ['/c', 'move', '/y', tmp, out] : [tmp, out], { stdio: 'ignore' });
      if (!keep) rmSync(frames, { recursive: true, force: true });
      console.log(`  wrote ${out}  (${n} frames, ${(statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
    }
  } finally {
    server.close();
  }
  console.log(failed ? `\n${failed} format(s) rendered with page errors — read them above before sharing.` : '\nAll formats rendered console-clean. Now watch them — the numbers cannot see a cut that lands wrong.');
  return failed;
}

// CLI
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const boardPath = args.find((a) => !a.startsWith('--'));
  if (!boardPath) { console.error('usage: node reel.mjs <storyboard.mjs> [format ...] [--test] [--keep]'); process.exit(1); }
  const board = (await import(pathToFileURL(resolve(boardPath)).href)).default;
  const formats = args.filter((a) => !a.startsWith('--')).slice(1);
  const failed = await renderReel(board, { formats, test: args.includes('--test'), keep: args.includes('--keep') });
  process.exit(failed ? 1 : 0);
}
