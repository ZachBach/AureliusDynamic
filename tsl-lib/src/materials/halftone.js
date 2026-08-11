/**
 * HALFTONE — print screen. The tone is sampled once per cell, at the cell
 * centre, so every dot has exactly one size; sampling per-fragment instead
 * would let the tone vary across a dot's own footprint and the dots would
 * come out lopsided.
 *
 * @cost    see REGISTRY materials/halftone
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { spriteDisc } from '../pattern/spriteDisc.js';

export const name = 'HALFTONE';

const CELLS = 26;

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const g = TSL.uv().mul(CELLS);
  const c = g.floor().add(0.5).div(CELLS);
  const tone = fbm(TSL, TSL.vec3(c.x.mul(4), c.y.mul(4), 0), { octaves: 4 }).mul(0.5).add(0.5);
  const dot = spriteDisc(TSL, g.fract(), { edge: 0.06 }).mul(tone.mul(1.6).add(0.1));
  mat.colorNode = TSL.mix(brand.ice.mul(0.92), brand.void, TSL.smoothstep(0.35, 0.55, dot));
  return { impl: 'native' };
};

export const source = () => `const g = uv().mul(26);
const c = g.floor().add(.5).div(26); // cell CENTRE
const tone = fbm(vec3(c.mul(4), 0))
  .mul(.5).add(.5);            // one sample per dot
const dot = spriteDisc(g.fract(), { edge: .06 })
  .mul(tone.mul(1.6).add(.1));
colorNode = mix(ice.mul(.92), void,
  smoothstep(.35, .55, dot));`;
