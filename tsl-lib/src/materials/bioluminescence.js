/**
 * BIOLUMINESCENCE — a dinoflagellate bloom. Each cell carries its own
 * luciferin and fires only when SHEARED, which is why the sea lights up along
 * a bow wave and nowhere else. So the flash is not a texture that pulses: it
 * is a population of independent cells, each with its own phase, gated by a
 * moving strain field. Worley cells give the population, `flash` gives one
 * cell's spike-and-decay, and a drifting turbulence field decides which
 * patch is being strained right now — the three together are why the glow
 * travels instead of blinking in place.
 *
 * @cost    see REGISTRY materials/bioluminescence
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { turbulence } from '../noise/turbulence.js';
import { flash } from '../pattern/flicker.js';

export const name = 'BIOLUMINESCENCE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const p = TSL.positionLocal.mul(6.5);
  const cells = worleyF1F2(TSL, p, { impl: 'fallback' });
  const body = TSL.smoothstep(0.55, 0.05, cells.x); // the cell interior
  const phase = cells.y.sub(cells.x).mul(9.0); // per-cell phase from its own wall distance
  // the shear that triggers them, drifting across the population
  const strain = turbulence(TSL, TSL.positionLocal.mul(1.7)
    .add(TSL.vec3(clock.mul(0.22), 0, clock.mul(-0.14))), { octaves: 3 });
  const gate = TSL.smoothstep(0.22, 0.52, strain);
  const spike = flash(TSL, clock, { rate: 1.9, phase, sharpness: 22, envRate: 0.31, floor: 0.0 });
  const lit = body.mul(spike).mul(gate);
  // the water it sits in: dark, faintly blue, never black
  const water = TSL.mix(brand.void, brand.blue, 0.18);
  mat.colorNode = brand.void.mul(0.85)
    .add(water.mul(0.35))
    .add(terra.swarmCool.mul(lit.mul(1.9)))
    .add(brand.ice.mul(lit.pow(3).mul(1.1)));
  return { impl: 'fallback' };
};

export const source = () => `const cells = worleyF1F2(posL.mul(6.5));
const body = smoothstep(.55, .05, cells.x);
const phase = cells.y.sub(cells.x).mul(9);  // per-cell
// they fire on SHEAR, not on a clock — a drifting
// strain field decides which patch lights now
const strain = turbulence(posL.mul(1.7)
  .add(vec3(t.mul(.22), 0, t.mul(-.14))));
const gate = smoothstep(.22, .52, strain);
const lit = body.mul(flash(t, { phase })).mul(gate);
colorNode = void.mul(.85)
  .add(swarmCool.mul(lit.mul(1.9)))
  .add(ice.mul(lit.pow(3).mul(1.1)));`;
