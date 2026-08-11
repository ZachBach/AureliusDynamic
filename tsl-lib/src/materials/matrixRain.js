/**
 * MATRIX RAIN — one falling head per column, each with its own rate and
 * phase from a per-column hash, trailing a tail built from fract() of the
 * distance behind the head so it wraps without a seam. Glyphs reroll on a
 * quantized clock, which is what makes them read as characters rather than
 * as noise.
 *
 * @cost    see REGISTRY materials/matrixRain
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';

export const name = 'MATRIX RAIN';

const COLS = 34;
const ROWS = 18;

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const { vec2, hash, floor, fract, smoothstep, step } = TSL;
  const uv = TSL.uv();
  const g = uv.mul(vec2(COLS, ROWS));
  const colId = floor(g.x);
  const rate = hash(colId.add(11.7));
  const phase = hash(colId.add(57.3));
  const head = fract(phase.add(clock.mul(rate.mul(0.5).add(0.12))));
  const d = fract(head.sub(uv.y));
  const tail = smoothstep(0.55, 1.0, d.oneMinus());
  const glyph = step(0.35, hash(floor(g).dot(vec2(1.0, 57.0)).add(floor(clock.mul(6)))));
  mat.colorNode = brand.void.mul(0.6)
    .add(brand.cyan.mul(tail.mul(glyph).mul(1.1)))
    .add(brand.ice.mul(smoothstep(0.97, 1.0, d.oneMinus()).mul(glyph).mul(1.8)));
  return { impl: 'native' };
};

export const source = () => `const colId = floor(uv().x.mul(34));
const head = fract(hash(colId.add(57.3))
  .add(clock.mul(rate)));      // per-column fall
const d = fract(head.sub(uv().y)); // seamless wrap
const tail = smoothstep(.55, 1, d.oneMinus());
const glyph = step(.35, hash(cell
  .add(floor(clock.mul(6)))));  // quantized reroll
colorNode = void.mul(.6)
  .add(cyan.mul(tail.mul(glyph).mul(1.1)))
  .add(ice.mul(headHot.mul(glyph).mul(1.8)));`;
