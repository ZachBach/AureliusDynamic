/**
 * STARFIELD — hash-cell stars (worley machinery pointed at points of light):
 * each lattice cell rolls for a star, rare golds among the ice, twinkle via
 * per-cell flicker, over a faint nebula wisp.
 *
 * @cost    see REGISTRY materials/starfield
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { flicker } from '../pattern/flicker.js';

export const name = 'STARFIELD';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, nebula } = palette(TSL);
  const { vec3, hash, step, smoothstep } = TSL;
  const g = TSL.positionLocal.mul(7);
  const id = g.floor().add(vec3(101.3, 211.7, 313.1));
  const f = g.fract();
  const h1 = hash(id.dot(vec3(1.0, 57.0, 113.0)));
  const h2 = hash(id.dot(vec3(57.0, 113.0, 1.0)));
  const h3 = hash(id.dot(vec3(113.0, 1.0, 57.0)));
  const sp = vec3(h1, h2, h3).mul(0.7).add(0.15);
  const d = f.sub(sp).length();
  const lit = step(0.82, h3);
  const tw = flicker(TSL, clock, { rate: h1.mul(3).add(1), phase: h2.mul(40), depth: 0.7 });
  const star = smoothstep(0.16, 0.02, d).mul(lit).mul(tw);
  const gold = step(0.93, h2);
  const wisp = fbm(TSL, TSL.positionLocal.mul(1.3).add(vec3(0, 0, clock.mul(0.02))), { octaves: 3 })
    .mul(0.5).add(0.5);
  mat.colorNode = nebula.deep.mul(wisp.mul(0.5))
    .add(brand.blue.mul(smoothstep(0.6, 0.95, wisp).mul(0.3)))
    .add(TSL.mix(brand.ice, brand.gold, gold).mul(star.mul(2.2)));
  return { impl: 'native' };
};

export const source = () => `const id = posL.mul(7).floor();
const sp = hash3(id).mul(.7).add(.15); // star seat
const star = smoothstep(.16, .02,
  fract.sub(sp).length())
  .mul(step(.82, h3)).mul(twinkle);
colorNode = deep.mul(wisp.mul(.5))
  .add(mix(ice, gold, rare).mul(star.mul(2.2)));`;
