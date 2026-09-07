/**
 * geo-lib bench driver.
 *
 *   node bench/render.mjs                 both backends, every case
 *   node bench/render.mjs webgl2          one backend
 *   node bench/render.mjs webgpu loft-arc one backend, one case
 *
 * Writes bench/out/<backend>/<case>-<angle>.png and gates on:
 *   1. no console errors or page errors
 *   2. the page reached a backend, and the one it reached is the one asked for
 *   3. every case has finite bounds — one NaN and a mesh silently disappears
 *   4. every case has triangles
 *
 * The pictures are the actual product. The four gates catch the failures a
 * picture cannot: a mesh that is not there looks exactly like a mesh that was
 * never added.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(HERE, 'out');
const VENDOR = join(HERE, 'vendor');
const PORT = 8712;
const CHROME = process.env.CHROME_PATH
  || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// puppeteer-core, borrowed from tsl-lib's bench rather than installed twice.
// NODE_PATH does not affect ESM resolution, so the borrow goes through a CJS
// require rooted at that package.
const BORROW = join(ROOT, '..', 'tsl-lib', 'bench', 'package.json');
let puppeteer;
try {
  puppeteer = createRequire(import.meta.url)('puppeteer-core');
} catch {
  try {
    puppeteer = createRequire(BORROW)('puppeteer-core');
  } catch {
    console.error('puppeteer-core not found. `npm i puppeteer-core` here, or in ../tsl-lib/bench.');
    process.exit(2);
  }
}

/* three.js for the bench, copied into bench/vendor/ (gitignored).
 *
 * geo-lib itself imports three from nowhere — that is the whole contract — so
 * the bench has to supply one, and which one is a real question rather than a
 * detail. The studio has three different three.js situations live at once, and
 * the library claims to work with all of them. Searching these in order means
 * the bench runs against whatever the machine actually has, and the reported
 * revision below says which. */
const SOURCES = [
  process.env.GEO_THREE,
  join(ROOT, '..', 'echoGalaxy', 'node_modules', 'three', 'build'),
  join(ROOT, '..', 'El-Sol', 'node_modules', 'three', 'build'),
  join(ROOT, 'node_modules', 'three', 'build'),
].filter(Boolean);

function vendorThree() {
  mkdirSync(VENDOR, { recursive: true });
  for (const dir of SOURCES) {
    const webgpu = join(dir, 'three.webgpu.js');
    const core = join(dir, 'three.core.js');
    if (!existsSync(webgpu) || !existsSync(core)) continue;
    copyFileSync(webgpu, join(VENDOR, 'three.webgpu.js'));
    copyFileSync(core, join(VENDOR, 'three.core.js'));
    let rev = 'unknown';
    try {
      rev = createRequire(import.meta.url)(join(dir, '..', 'package.json')).version;
    } catch { /* the build is what matters, not the manifest */ }
    return { dir, rev };
  }
  console.error('No three.js build found. Set GEO_THREE to a three/build directory.');
  console.error('Looked in:\n  ' + SOURCES.join('\n  '));
  process.exit(2);
}

const three = vendorThree();
console.log(`three.js ${three.rev} from ${three.dir}`);

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = spawn('python', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
await sleep(900);

const arg = process.argv.slice(2);
const backends = arg[0] ? [arg[0]] : ['webgpu', 'webgl2'];
const only = arg[1] || null;

// Front, three-quarter, side, and from behind. Three-quarter is the one that
// finds most problems — dead-on hides depth errors and pure profile hides
// width errors.
const ANGLES = [
  ['front', 0.0, 0.16],
  ['3q', 0.85, 0.22],
  ['side', 1.57, 0.10],
  ['back', 3.14, 0.20],
];

let failures = 0;
try {
  for (const backend of backends) {
    console.log(`\n=== ${backend} ===`);
    const args = [
      '--window-size=1000,1000', '--hide-scrollbars', '--no-first-run',
      `--user-data-dir=${join(OUT, 'profile-' + backend)}`,
    ];
    if (backend === 'webgpu') args.push('--enable-unsafe-webgpu');

    const browser = await puppeteer.launch({
      executablePath: CHROME, headless: 'new', args,
      defaultViewport: { width: 1000, height: 1000 },
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    if (backend === 'webgl2') {
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'gpu', { get: () => undefined, configurable: true });
      });
    }

    const errors = [];
    /* The console's own 404 message names no URL, so it cannot be judged on
     * its own — it is dropped here and the `response` handler below decides,
     * which it can do because it has the URL. favicon.ico is the browser
     * asking unprompted; a bench page has no favicon and does not need one. */
    page.on('console', (m) => {
      if (m.type() === 'error' && !/status of 404/.test(m.text())) {
        errors.push(m.text().slice(0, 300));
      }
    });
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
    page.on('response', (r) => {
      if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) {
        errors.push(`HTTP ${r.status()} ${r.url()}`);
      }
    });

    const dir = join(OUT, backend);
    mkdirSync(dir, { recursive: true });

    await page.goto(`http://localhost:${PORT}/bench/index.html`, { waitUntil: 'load', timeout: 40000 });
    await page.waitForFunction(() => window.__benchReady === true, { timeout: 45000 });

    const got = await page.evaluate(() => window.__bench.backend);
    const want = backend === 'webgpu' ? 'WebGPU' : 'WebGL2';
    if (got !== want) { console.log(`  FAIL: reached ${got}, expected ${want}`); failures++; }
    else console.log(`  backend: ${got}`);

    const names = await page.evaluate(() => window.__bench.names);
    for (const name of names) {
      if (only && name !== only) continue;
      const stat = await page.evaluate((n) => window.__bench.show(n), name);
      if (!stat.finite) { console.log(`  FAIL ${name}: bounding sphere is not finite`); failures++; }
      if (!stat.tris) { console.log(`  FAIL ${name}: no triangles`); failures++; }
      if (stat.failed) { console.log(`  FAIL ${name}: ${stat.failed}`); failures++; }
      for (const [label, az, el] of ANGLES) {
        await page.evaluate((a, e) => { window.__bench.look(a, e); window.__bench.draw(); }, az, el);
        await sleep(120);
        await page.screenshot({ path: join(dir, `${name}-${label}.png`) });
      }
      console.log(`  ${name.padEnd(18)} ${String(stat.tris | 0).padStart(6)} tris  ${stat.verts} verts`);
    }

    if (errors.length) {
      console.log(`  FAIL: ${errors.length} console/page error(s)`);
      errors.slice(0, 6).forEach((e) => console.log('    ' + e));
      failures += errors.length;
    } else {
      console.log('  clean');
    }
    await browser.close();
  }
} finally {
  server.kill();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
