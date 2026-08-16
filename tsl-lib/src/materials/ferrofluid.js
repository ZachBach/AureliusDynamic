/**
 * FERROFLUID — the Rosensweig instability. Magnetised fluid wants to follow
 * the field; gravity and surface tension want it flat. Above a threshold the
 * field wins, but only where the surface already faces along it — which is
 * why the spikes crowd the poles of the magnet and the equator stays a
 * mirror. Gating a worley spike lattice by the normal's alignment with the
 * field axis reproduces that selectivity, and squashing the lattice along the
 * same axis is what makes the spikes columns rather than blobs.
 *
 * @cost    see REGISTRY materials/ferrofluid
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1 } from '../noise/worley.js';
import { fresnel } from '../fresnel/fresnel.js';
import { posterize } from '../ramp/posterize.js';

export const name = 'FERROFLUID';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const field = TSL.vec3(0, 1, 0); // the magnet's axis
  const align = TSL.normalWorld.dot(field).abs();
  // squashed along the field: cells become columns, not blobs
  const q = TSL.positionLocal.mul(TSL.vec3(5.2, 1.05, 5.2))
    .add(TSL.vec3(0, TSL.sin(clock.mul(0.35)).mul(0.12), 0));
  const cellDist = worleyF1(TSL, q, { impl: 'fallback' });
  const spike = TSL.smoothstep(0.58, 0.08, cellDist).mul(align.pow(1.1));
  const rim = fresnel(TSL, { power: 1.6 });
  // hard-quantised specular: ferrofluid is a mirror, so its highlights have edges
  const chrome = posterize(TSL, rim.oneMinus().pow(3), { steps: 5 });
  mat.colorNode = brand.void.mul(0.9)
    .add(brand.slate.mul(spike.mul(0.85)))
    .add(brand.silver.mul(chrome.mul(spike.mul(0.8).add(0.1)).mul(0.95)))
    .add(brand.cyan.mul(rim.pow(2.5).mul(0.5)))
    .add(brand.ice.mul(spike.pow(3).mul(0.8)));
  return { impl: 'fallback' };
};

export const source = () => `const align = normalWorld.dot(field).abs();
const q = posL.mul(vec3(5.2, 1.05, 5.2));  // squashed
const spike = smoothstep(.58, .08, worleyF1(q))
  .mul(align.pow(1.1));   // spikes only where the
// surface already faces along the field
const chrome = posterize(fres.oneMinus().pow(3),
  { steps: 5 });          // a mirror has hard edges
colorNode = void.mul(.9)
  .add(slate.mul(spike.mul(1.15)))
  .add(silver.mul(chrome.mul(.5)))
  .add(cyan.mul(fres.pow(2.5).mul(.5)))
  .add(ice.mul(spike.pow(3).mul(.8)));`;