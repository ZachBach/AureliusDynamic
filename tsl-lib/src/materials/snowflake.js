/**
 * SNOWFLAKE — twelve mirror sectors, which is six-fold rotation plus a
 * reflection: exactly the point group of ice Ih, and exactly why a real
 * crystal's six arms match each other rather than merely repeating. The
 * dendrites themselves are one ridged-fbm field; the symmetry is not drawn
 * six times, it is the same field read through `polarFold`, so no arm can
 * disagree with another.
 *
 * Growth is radial: the threshold rises with distance from the centre, so
 * branches thin toward the tips the way diffusion-limited growth starves.
 *
 * @cost    see REGISTRY materials/snowflake
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { polarFold } from '../pattern/polarFold.js';
import { ridgedFbm } from '../noise/ridgedFbm.js';
import { thinFilm } from '../fresnel/thinFilm.js';

export const name = 'SNOWFLAKE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const { p: q, radius: r } = polarFold(TSL, TSL.positionLocal.xy, {
    sectors: 12, spin: clock.mul(0.05),
  });
  const dendrite = ridgedFbm(TSL, TSL.vec3(q.x.mul(3.6), q.y.mul(3.6), 0.3), { octaves: 4 });
  const spine = TSL.smoothstep(0.05, 0.0, q.y.abs()); // the arm's main axis
  // diffusion-limited growth: the threshold RISES outward, so branches thin
  // toward the tips instead of being cropped by an envelope. ridgedFbm sits
  // high by construction ((1−|n|)² per octave), so the cut has to sit high too
  const thr = r.mul(0.13).add(0.66);
  const crystal = TSL.smoothstep(thr, thr.add(0.09), dendrite.add(spine.mul(0.16)))
    .mul(TSL.smoothstep(1.5, 1.25, r));
  const facet = thinFilm(TSL, { cycles: 3.0, shift: r.mul(1.6) });
  mat.colorNode = brand.void.mul(0.8)
    .add(terra.atmo.mul(crystal.mul(0.55)))
    .add(brand.ice.mul(crystal.pow(2).mul(0.95)))
    .add(facet.mul(crystal.mul(0.35)))
    .add(brand.cyan.mul(TSL.smoothstep(thr.sub(0.08), thr, dendrite).mul(0.14)));
  return { impl: 'native' };
};

export const source = () => `const { p: q, radius: r } =
  polarFold(posL.xy, { sectors: 12,
    spin: clock.mul(.05) });
// 12 mirror sectors = 6-fold + reflection: the
// point group of ice. ONE field, read six times,
// so no arm can disagree with another
const dendrite = ridgedFbm(vec3(q.mul(3.6), .3));
const thr = r.mul(.13).add(.66); // growth threshold
// RISES outward — tips thin, they aren't cropped
const crystal = smoothstep(thr, thr.add(.09),
  dendrite.add(spine.mul(.16)));
colorNode = void.mul(.8)
  .add(atmo.mul(crystal.mul(.55)))
  .add(ice.mul(crystal.pow(2).mul(.95)))
  .add(thinFilm({ cycles: 3 }).mul(crystal.mul(.35)));`;
