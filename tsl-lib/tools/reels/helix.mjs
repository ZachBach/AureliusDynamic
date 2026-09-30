/**
 * The Electromagnetic Helix Reactor reel — the deployed copy at /helix/.
 *
 *   node tsl-lib/tools/reel.mjs tsl-lib/tools/reels/helix.mjs [format ...]
 *
 * EHR is a React app whose simulation steps by the animation-frame timestamp
 * (`_tick(ts)`: dt = ts - last), and that timestamp comes from the engine's
 * gated clock, so one captured frame is exactly one 33 ms step of the Boris
 * pusher. The 3D view's camera is a private orbit object driven by pointer
 * drags on its canvas, so the reel orbits it the way a hand would: a slow
 * drag across the chamber, one button-down per shot.
 *
 * Presets are the app's own one-click operating points, and each jumps to
 * the screen it is about, so the cut follows them: matched, helicon lock,
 * plasma crystal (the dusty-plasma module), then the diagnostics and plots
 * tabs, then the etch window. The phone layout has the same controls behind
 * a menu; `.click()` on a hidden button still fires React's handler.
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerp, ease, sleep } from '../reel-util.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..', '..', '..');

const click = (sel) => async (page) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) throw new Error('no element ' + s);
  el.click();
}, sel);

/** The simulation canvas: the largest one on the page. */
const canvasBox = (page) => page.evaluate(() => {
  const c = [...document.querySelectorAll('canvas')].map((el) => el.getBoundingClientRect())
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  return c ? { x: c.x, y: c.y, w: c.width, h: c.height } : null;
});

/** A shot that drags across the chamber from `from` to `to` (fractions of the canvas). */
function orbit(secs, note, from, to, at = []) {
  let box = null;
  return {
    page: 'app', secs, note,
    at: [
      ...at,
      [0, async (page) => {
        box = await canvasBox(page);
        if (!box) return;
        await page.mouse.move(box.x + box.w * from[0], box.y + box.h * from[1]);
        await page.mouse.down();
      }],
    ],
    each: async (page, t) => {
      if (!box) return;
      const e = ease(t);
      await page.mouse.move(box.x + box.w * lerp(from[0], to[0], e), box.y + box.h * lerp(from[1], to[1], e));
    },
    after: async (page) => { if (box) await page.mouse.up(); },
  };
}

const wide = [
  orbit(7, 'matched · orbit', [0.55, 0.55], [0.38, 0.48], [[0, click('[data-preset="matched"]')]]),
  // Helicon lock jumps to the plots screen, which has no sweep data to show;
  // the reel wants the chamber, so the tab follows the preset.
  orbit(6, 'helicon lock', [0.4, 0.5], [0.58, 0.44], [[0, click('[data-preset="helicon"]')], [0.4, click('[data-tab="sim"]')]]),
  orbit(7, 'plasma crystal', [0.5, 0.45], [0.36, 0.55], [[0, click('[data-preset="crystal"]')]]),
  { page: 'app', secs: 6, note: 'diagnostics', at: [[0, click('[data-tab="diag"]')]] },
  { page: 'app', secs: 5, note: 'plots', at: [[0, click('[data-tab="plots"]')]] },
  // The preset jumps to its own screen (diagnostics), so the tab comes after it.
  orbit(5, 'etch window', [0.5, 0.5], [0.62, 0.42], [[0, click('[data-preset="etch"]')], [0.4, click('[data-tab="sim"]')]]),
];

const tall = [
  orbit(6, 'matched · orbit', [0.55, 0.55], [0.38, 0.48], [[0, click('[data-preset="matched"]')]]),
  orbit(5, 'helicon lock', [0.4, 0.5], [0.58, 0.44], [[0, click('[data-preset="helicon"]')], [0.4, click('[data-tab="sim"]')]]),
  orbit(6, 'plasma crystal', [0.5, 0.45], [0.36, 0.55], [[0, click('[data-preset="crystal"]')]]),
  { page: 'app', secs: 5, note: 'diagnostics', at: [[0, click('[data-tab="diag"]')]] },
  { page: 'app', secs: 4, note: 'plots', at: [[0, click('[data-tab="plots"]')]] },
  orbit(4, 'etch window', [0.5, 0.5], [0.62, 0.42], [[0, click('[data-preset="etch"]')], [0.4, click('[data-tab="sim"]')]]),
];

export default {
  name: 'helix',
  root: SITE,
  out: join(HERE, 'video'),
  port: 8771,
  pages: { app: 'helix/' },
  async setup(page) {
    // Boot: React mounts, the engine and the three.js view load, then the
    // presets appear. Wait for those and let the plasma fill for a moment on
    // the real clock before the gate closes.
    await page.waitForSelector('[data-preset="matched"]', { timeout: 60000 });
    await sleep(3500);
  },
  boards: { wide, tall },
};
