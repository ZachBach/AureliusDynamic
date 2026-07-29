/**
 * GLITCH — row-hashed uv tears over posterized noise bands, scanlines, and
 * rare white slice flashes. The clock quantizes so the corruption rerolls in
 * stutters instead of flowing.
 *
 * @cost    see REGISTRY materials/glitch
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { posterize } from '../ramp/posterize.js';
import { scanlines } from '../pattern/scanlines.js';
import { flash } from '../pattern/flicker.js';

export const name = 'GLITCH';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const row = TSL.positionLocal.y.mul(22).floor();
  const reroll = clock.mul(2.5).floor().mul(91);
  const h = TSL.hash(row.add(reroll));
  const tear = h.sub(0.5).mul(TSL.step(0.72, TSL.hash(row.add(reroll).add(37)))).mul(0.9);
  const p = TSL.positionLocal.add(TSL.vec3(tear, 0, 0));
  const bands = posterize(TSL, fbm(TSL, p.mul(1.9), { octaves: 3 }).mul(0.5).add(0.5), { steps: 5 });
  const scan = scanlines(TSL, TSL.positionLocal.y, { freq: 60, speed: 2, sharpness: 1, clock });
  const slice = flash(TSL, clock, { rate: 7, phase: row.mul(0.7), sharpness: 24, floor: 0.15 });
  mat.colorNode = TSL.mix(brand.void, brand.cyan, bands.mul(0.8))
    .add(brand.blue.mul(scan.mul(0.3)))
    .add(TSL.color(0xFFFFFF).mul(slice.mul(0.8)))
    .add(brand.gold.mul(TSL.step(0.9, TSL.hash(row.add(reroll).add(73))).mul(bands).mul(0.5)));
  return { impl: 'native' };
};

export const source = () => `const row = posL.y.mul(22).floor();
const reroll = t.mul(2.5).floor().mul(91);
const tear = hash(row.add(reroll)).sub(.5)
  .mul(step(.72, hash(row.add(reroll).add(37))));
const bands = posterize(
  fbm(posL.add(vec3(tear, 0, 0))), { steps: 5 });
colorNode = mix(void_, cyan, bands.mul(.8))
  .add(white.mul(flash(t, { rate: 7,
    phase: row, sharpness: 24 })));`;
