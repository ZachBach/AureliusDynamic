// ikos-privacy.mjs: prove what IKOS contacts, in a real browser, at each step.
//
// Usage: node ikos-privacy.mjs <folder containing index.html, sw.js, vendor/ ...>
//
// Serves the folder at /ikos/ on localhost (the way the site mounts it), then:
//   1. page load              -> expect first-party only (React is embedded)
//   2. open Orbit             -> expect three.js from /ikos/vendor/, no CDN
//   3. planet with a YouTube  -> expect a consent card and no YouTube request
//   4. click "Load video"     -> expect YouTube, player on youtube-nocookie.com
//   5. load /ikos (no slash)  -> vendor/ must still resolve under /ikos/
// Temporary audit tool: fresh profile per run, nothing persisted.

import puppeteer from 'puppeteer-core';
import http from 'http';
import { readFileSync, existsSync, statSync, mkdtempSync, rmSync } from 'fs';
import { join, extname, resolve } from 'path';
import { tmpdir } from 'os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = resolve(process.argv[2] || '.');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json', '.md': 'text/plain' };

// Mount ROOT at /ikos/. Like Vercel, serve the folder's index.html at /ikos as well as /ikos/.
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith('/ikos')) { res.writeHead(404); return res.end(); }
  let f = join(ROOT, p.slice('/ikos'.length));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  | ' + detail : ''}`); };
const hostsOf = (list) => [...new Set(list.map((u) => { try { const x = new URL(u); return x.protocol === 'blob:' || x.protocol === 'data:' ? x.protocol : x.host; } catch { return '?'; } }))];
const third = (list) => list.filter((u) => { try { const x = new URL(u); return !['blob:', 'data:'].includes(x.protocol) && x.host !== new URL(base).host; } catch { return true; } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(startPath) {
  const profile = mkdtempSync(join(tmpdir(), 'ikos-privacy-'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', `--user-data-dir=${profile}`, '--enable-unsafe-webgpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  let reqs = [];
  const errors = [];
  page.on('request', (r) => reqs.push(r.url()));
  page.on('response', (r) => { if (r.status() === 404) console.log('      404 ' + r.url()); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const take = () => { const out = reqs; reqs = []; return out; };
  await page.goto(base + startPath, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(3000);
  // Reach the IKOS component through React's fiber pointer on any rendered element.
  // The DC runtime's React host keeps the component instance at `.logic`.
  const found = await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
      if (!key) continue;
      for (let f = el[key]; f; f = f.return) {
        const inst = f.stateNode && f.stateNode.logic;
        if (inst && typeof inst.openOrbitDetail === 'function') { window.__ikos = inst; return true; }
      }
    }
    return false;
  });
  return { browser, page, take, errors, found, profile };
}

// ---- run 1: /ikos/ ----
{
  const { browser, page, take, errors, found, profile } = await run('/ikos/');
  const load = take();
  check('app boots (component reachable)', found);
  check('page load: no third-party request', third(load).length === 0, 'hosts: ' + hostsOf(load).join(', ') + (third(load).length ? ' | 3P: ' + third(load).slice(0, 3).join(' ') : ''));
  check('page load: React not fetched from unpkg', !load.some((u) => u.includes('unpkg.com')));
  check('React present on window', await page.evaluate(() => !!(window.React && window.ReactDOM)));

  // A visitor passes the first-visit boot sequence and tour before reaching Orbit; do the same,
  // or their full-screen layer (z-index 70) sits over every button the test clicks.
  await page.evaluate(() => { const c = window.__ikos; try { c.finishBoot(); } catch (e) {} c.setState({ boot: { active: false }, onboard: { active: false, step: 0 } }); });
  await sleep(1500);
  await page.evaluate(() => { const c = window.__ikos; c.setState((s) => ({ installed: s.installed.includes('orbital_view') ? s.installed : [...s.installed, 'orbital_view'] }), () => c.setMode('orbit')); });
  await sleep(12000);
  const orbit = take();
  const engine = await page.evaluate(() => ({ backend: window.__ikos._orbBackend, mode: window.__ikos._threeMode, failed: !!window.__ikos._orbFailed, running: !!window.__ikos._orb }));
  const vendorHits = orbit.filter((u) => u.includes('/ikos/vendor/')).map((u) => u.split('/ikos/')[1]);
  check('Orbit: three.js loaded from /ikos/vendor/', vendorHits.length > 0, vendorHits.join(', '));
  check('Orbit: no third-party request', third(orbit).length === 0, third(orbit).slice(0, 3).join(' '));
  check('Orbit: renderer running', engine.running && !engine.failed, JSON.stringify(engine));

  const nid = await page.evaluate(() => {
    const c = window.__ikos; const id = Object.keys(c.state.nodes)[0];
    c.setState((s) => ({ nodeVideos: { ...s.nodeVideos, [id]: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' } }), () => c.openOrbitDetail(id));
    return id;
  });
  await sleep(4000);
  const before = take();
  const card = await page.$('[aria-label^="Load video from YouTube"]');
  check('video: consent card shown, naming YouTube', !!card);
  const caption = await page.evaluate(() => [...document.querySelectorAll('div')].some((d) => d.children.length === 0 && d.textContent.startsWith('⚡ auto sends the concept name') && d.getBoundingClientRect().height > 0));
  check('video: auto-find destination shown as visible text (not only a tooltip)', caption);
  check('video: nothing requested before the click', third(before).length === 0, third(before).slice(0, 3).join(' '));
  check('video: consent is not persisted', await page.evaluate(() => !JSON.stringify(localStorage).includes('mediaConsent')));

  if (card) {
    await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await sleep(500);
    const onTop = await card.evaluate((el) => { const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t === el || el.contains(t); });
    check('video: consent button is clickable (nothing covers it)', onTop);
    await card.click(); // a real pointer click at the button's position
  }
  await sleep(9000);
  const after = take();
  const iframe = await page.evaluate(() => { const f = document.querySelector('iframe'); return f ? f.src : null; });
  check('after click: YouTube API requested', after.some((u) => u.startsWith('https://www.youtube.com/iframe_api')), hostsOf(third(after)).join(', '));
  check('after click: player is privacy-enhanced (youtube-nocookie.com)', !!iframe && iframe.startsWith('https://www.youtube-nocookie.com/'), iframe ? iframe.slice(0, 80) : 'no iframe');

  await page.evaluate((id) => { const c = window.__ikos; c.closeOrbitDetail(); c.setState((s) => ({ nodeVideos: { ...s.nodeVideos, [id]: 'https://vimeo.com/76979871' } }), () => c.openOrbitDetail(id)); }, nid);
  await sleep(2500);
  const vimeo = await page.evaluate(() => { const f = [...document.querySelectorAll('iframe')].find((x) => x.src.includes('vimeo')); return f ? f.src : null; });
  check('Vimeo embed carries dnt=1', !!vimeo && vimeo.includes('dnt=1'), vimeo || 'no vimeo iframe');

  check('no page errors', errors.length === 0, errors.slice(0, 2).join(' || '));
  await browser.close(); try { rmSync(profile, { recursive: true, force: true }); } catch {}
}

// ---- run 2: /ikos without the trailing slash ----
{
  const { browser, page, take, found, profile } = await run('/ikos');
  take();
  if (found) {
    await page.evaluate(() => { const c = window.__ikos; c.setState((s) => ({ installed: [...s.installed, 'orbital_view'] }), () => c.setMode('orbit')); });
    await sleep(12000);
  }
  const reqs = take();
  const vend = reqs.filter((u) => u.includes('vendor/'));
  check('/ikos (no slash): vendor resolves under /ikos/', found && vend.length > 0 && vend.every((u) => u.includes('/ikos/vendor/')), vend.map((u) => new URL(u).pathname).join(', '));
  await browser.close(); try { rmSync(profile, { recursive: true, force: true }); } catch {}
}

server.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
