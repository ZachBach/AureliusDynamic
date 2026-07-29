// verify-site — smoke the real landing bundle: hero boots on both backends,
// Shader Lab initializes, all four materials render (clip screenshots per
// chip), zero console errors (Open-Meteo rate-limit noise tolerated).
//
//   node tools/verify-site.mjs before     # label the shot set
//   node tools/verify-site.mjs after webgpu
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const LIB = dirname(TOOLS);
const ROOT = dirname(LIB);
const SHOTS = join(LIB, 'bench', 'shots');
const PORT = 8641;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const label = process.argv[2] || 'site';
const backends = process.argv[3] ? [process.argv[3]] : ['webgpu', 'webgl2'];
// --root=<dir> serves an alternate site root (e.g. a pre-swap bundle copy)
const rootArg = process.argv.find((a) => a.startsWith('--root='));
const SITE_ROOT = rootArg ? rootArg.slice(7) : ROOT;
mkdirSync(SHOTS, { recursive: true });

const server = spawn('python', ['-m', 'http.server', String(PORT)], { cwd: SITE_ROOT, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(800);

let failed = 0;
try {
  for (const backend of backends) {
    const browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--enable-unsafe-webgpu', '--window-size=1600,900', '--hide-scrollbars',
             '--no-first-run', `--user-data-dir=${join(LIB, 'bench', 'chrome-profile-site-' + backend)}`],
      defaultViewport: { width: 1600, height: 900 },
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(false); // profiles persist across before/after runs
    const errors = [];
    page.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error' && !/open-meteo|429/i.test(t)) errors.push(t.slice(0, 200));
    });
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    if (backend === 'webgl2') {
      await page.evaluateOnNewDocument(() =>
        Object.defineProperty(navigator, 'gpu', { get: () => undefined }));
    }

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
    await sleep(5000); // hero boot
    const hero = await page.evaluate(() => {
      const cv = document.querySelector('canvas[data-fx="helix"][data-particles]');
      const lbl = [...document.querySelectorAll('[data-hudlabel]')]
        .map((n) => n.textContent).find((t) => t.includes('RENDER')) || null;
      return { particles: cv ? cv.dataset.particles : null, label: lbl };
    });
    const heroOk = hero.particles && hero.label &&
      hero.label.toLowerCase().includes(backend === 'webgpu' ? 'webgpu' : 'webgl2');
    console.log(`[${backend}] hero: ${hero.particles || 'NO CANVAS'} particles · ${hero.label || 'NO HUD'}${heroOk ? '' : '  ✗'}`);
    if (!heroOk) failed++;

    // lab: scroll near, wait for lazy init
    await page.evaluate(() => {
      const s = document.querySelector('[data-shaderlab]');
      if (s) s.scrollIntoView({ block: 'center' });
    });
    await page.waitForFunction(() => {
      const c = document.querySelector('canvas[data-fx="shaderlab"]');
      return c && c.width > 10;
    }, { timeout: 20000 }).catch(() => null);
    await sleep(2500);

    const labState = await page.evaluate(() => {
      const root = document.querySelector('[data-shaderlab]');
      const btns = root ? [...root.querySelectorAll('button:not([data-galchip])')] : [];
      const tag = root ? [...root.querySelectorAll('div')].map((d) => d.textContent)
        .find((t) => t && t.startsWith('LIVE')) : null;
      return { buttons: btns.length, tag };
    });
    console.log(`[${backend}] lab: ${labState.buttons} chips · ${labState.tag || 'NO LIVE TAG'}`);
    if (labState.buttons < 4) { failed++; } // at least the original four

    for (let i = 0; i < labState.buttons; i++) {
      await page.evaluate((idx) => {
        document.querySelectorAll('[data-shaderlab] button:not([data-galchip])')[idx].click();
      }, i);
      await sleep(1500);
      const info = await page.evaluate(() => {
        const root = document.querySelector('[data-shaderlab]');
        const pre = root.querySelector('pre');
        const badge = [...root.querySelectorAll('div')].map((d) => d.textContent)
          .find((t) => t && /VERIFIED|·.*MS/.test(t)) || '';
        return { firstLine: pre ? pre.textContent.split('\n')[0] : '', badge };
      });
      // clip needs absolute page coords; boundingBox is viewport-relative
      const box = await page.evaluate(() => {
        const c = document.querySelector('canvas[data-fx="shaderlab"]');
        if (!c) return null;
        const r = c.getBoundingClientRect();
        return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
      });
      if (box) {
        await page.screenshot({ path: join(SHOTS, `site-${label}-mat${i}-${backend}.png`),
          clip: { x: box.x, y: box.y, width: Math.min(box.width, 900), height: Math.min(box.height, 500) } });
      }
      console.log(`[${backend}] mat${i}: "${info.firstLine.slice(0, 46)}"  ${info.badge.slice(0, 60)}`);
    }

    // node-gallery drawer (if this bundle has it)
    const hasDrawer = await page.$('[data-galtoggle]');
    if (hasDrawer) {
      await page.click('[data-galtoggle]');
      await sleep(400);
      const galCount = (await page.$$('[data-galchip]')).length;
      for (const idx of [0, galCount - 1]) {
        await page.evaluate((i) => document.querySelectorAll('[data-galchip]')[i].click(), idx);
        await sleep(1800); // lazy shader build
        const info = await page.evaluate(() => {
          const root = document.querySelector('[data-shaderlab]');
          const pre = root.querySelector('pre');
          return { badge: pre.previousElementSibling.textContent,
                   firstLine: pre.textContent.split('\n')[0] };
        });
        console.log(`[${backend}] gallery[${idx}]: "${info.firstLine.slice(0, 40)}"  ${info.badge.slice(0, 64)}`);
      }
      console.log(`[${backend}] drawer: ${galCount} node chips`);
      if (galCount < 20) failed++;
    }

    console.log(`[${backend}] console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    if (errors.length) failed++;
    await browser.close();
  }
} finally {
  server.kill();
}
console.log(failed ? `\nFAILED (${failed})` : '\nOK');
process.exit(failed ? 1 : 0);
