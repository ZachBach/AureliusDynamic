/**
 * The IKOS reel — the deployed copy at /ikos/.
 *
 *   node tsl-lib/tools/reel.mjs tsl-lib/tools/reels/ikos.mjs [format ...]
 *
 * One living state rendered four ways, so the reel is that loop: the Book,
 * the Graph (free, then radial), Split, the Orbit (the graph as bodies in a
 * WebGPU · TSL orbital renderer), the Terminal, and back to the Book in a
 * different voice. The guided tour that opens on first visit is skipped in
 * setup; the tour is the app explaining itself and the reel is the app
 * doing it.
 *
 * The Orbit view is reached through the phone nav's entry, which exists in
 * the desktop DOM too, hidden — `.click()` on it works at any width. The
 * desktop mode switches are `[data-mode]` elements; the phone layout puts
 * the same modes in a bottom bar under `[data-mobile-view]`.
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sleep } from '../reel-util.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..', '..', '..');

const click = (sel) => async (page) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) throw new Error('no element ' + s);
  el.click();
}, sel);
/** Click the first small element whose trimmed text is exactly `text`. */
const clickText = (text) => async (page) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('div, button, span, a')]
    .find((e) => e.children.length < 3 && (e.textContent || '').trim() === t);
  if (!el) throw new Error('no element with text ' + t);
  el.click();
}, text);
/** Click the first element whose text contains `text` (the REPL button carries an icon). */
const clickHas = (text) => async (page) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('div, button')]
    .find((e) => e.children.length < 4 && (e.textContent || '').includes(t) && (e.textContent || '').trim().length < 24);
  if (!el) throw new Error('no element containing ' + t);
  el.click();
}, text);

const mode = (m) => click(`[data-mode="${m}"]`);
const view = (v) => click(`[data-mobile-view="${v}"]`);

const wide = [
  { page: 'app', secs: 6, note: 'book · stoic', at: [[0, mode('book')]] },
  // The layout chips carry a glyph ("◈ Radial"), so match by containment.
  { page: 'app', secs: 8, note: 'graph · free → radial', at: [[0, mode('graph')], [4, clickHas('Radial')]] },
  { page: 'app', secs: 6, note: 'split', at: [[0, mode('split')]] },
  { page: 'app', secs: 9, note: 'orbit', at: [[0, view('orbit')], [1.2, clickText('tilt')]] },
  { page: 'app', secs: 5, note: 'terminal', at: [[0, clickHas('REPL')]] },
  { page: 'app', secs: 4, note: 'book · technical', at: [[0, mode('book')], [0.4, clickText('technical')]] },
];

const tall = [
  { page: 'app', secs: 5, note: 'book · stoic', at: [[0, view('book')]] },
  { page: 'app', secs: 7, note: 'graph · free → radial', at: [[0, view('graph')], [3.5, clickHas('Radial')]] },
  { page: 'app', secs: 8, note: 'orbit', at: [[0, view('orbit')], [1.2, clickText('tilt')]] },
  { page: 'app', secs: 5, note: 'terminal', at: [[0, view('terminal')]] },
  { page: 'app', secs: 4, note: 'book · technical', at: [[0, view('book')], [0.4, clickText('technical')]] },
];

export default {
  name: 'ikos',
  root: SITE,
  out: join(HERE, 'video'),
  port: 8772,
  pages: { app: 'ikos/' },
  async setup(page) {
    await sleep(4000);
    // The guided tour opens on a fresh profile. Skip it; the reel is the app.
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('div, button, span')].find((e) => e.children.length < 2 && (e.textContent || '').trim() === 'skip');
      if (el) el.click();
    });
    await sleep(800);
  },
  boards: { wide, tall },
};
