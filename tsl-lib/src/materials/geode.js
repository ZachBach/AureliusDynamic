/**
 * GEODE — a cavity lined inward with crystal. The structure has a strict
 * order that a plain noise texture never gets right: banded agate grows FIRST
 * against the rock wall, layer by layer, and only when the solution slows do
 * euhedral quartz terminations grow last, into the empty middle. So the
 * radial coordinate is the geological clock — bands outside, druzy points
 * inside, and a sharp interface between them. Worley cells supply the
 * terminations because crystal faces are exactly a nearest-seed partition.
 *
 * @cost    see REGISTRY materials/geode
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { warp } from '../noise/warp.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'GEODE';

export const apply = (TSL, mat) => {
  const { brand, terra } = palette(TSL);
  const p = TSL.positionLocal;
  // the cavity wall is not a sphere — warp the radius before reading it
  const r = warp(TSL, p.mul(1.3), { amp: 0.22, octaves: 2 }).length().mul(0.9);
  // OUTSIDE: agate bands, deposited oldest-first against the rock
  const bands = ramp(TSL, r.mul(7.5).fract(), [
    [0.0, brand.slate], [0.3, brand.mist.mul(0.5)],
    [0.6, terra.atmo.mul(0.35)], [1.0, brand.slate.mul(1.4)],
  ]);
  // INSIDE: druzy terminations, a nearest-seed partition because crystal
  // faces are precisely that
  const cell = worleyF1F2(TSL, p.mul(9.0), { impl: 'fallback' });
  const facet = TSL.smoothstep(0.30, 0.0, cell.x);
  const edge = TSL.smoothstep(0.10, 0.0, cell.y.sub(cell.x));
  const druzy = terra.atmo.mul(facet.mul(0.9))
    .add(brand.ice.mul(facet.pow(4).mul(1.5)))
    .add(brand.cyan.mul(edge.mul(0.5)));
  // the interface: bands stop, crystals start
  const inCavity = TSL.smoothstep(0.74, 0.60, r);
  mat.colorNode = TSL.mix(bands.mul(0.8), druzy, inCavity);
  return { impl: 'fallback' };
};

export const source = () => `const r = warp(posL.mul(1.3), { amp: .22 }).length();
// the radius IS the geological clock:
// bands grew first against the wall...
const bands = ramp(r.mul(7.5).fract(),
  [[0, slate], [.3, mist.mul(.5)], [.6, atmo.mul(.35)]]);
// ...crystals grew last, into the empty middle
const cell = worleyF1F2(posL.mul(9));
const facet = smoothstep(.30, 0, cell.x);
const druzy = atmo.mul(facet.mul(.9))
  .add(ice.mul(facet.pow(4).mul(1.5)));
colorNode = mix(bands.mul(.8), druzy,
  smoothstep(.74, .60, r));`;
