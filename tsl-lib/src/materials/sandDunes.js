/**
 * SAND DUNES — a transverse dune train: one sine ridge system warped so the
 * crests wander instead of ruling straight lines. The pow() skews the profile
 * so the slip face is steep and the windward slope is long, which is the
 * asymmetry that makes a dune read as a dune.
 *
 * @cost    see REGISTRY materials/sandDunes
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { warp } from '../noise/warp.js';
import { fbm } from '../noise/fbm.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'SAND DUNES';

export const apply = (TSL, mat) => {
  const { brand, solar } = palette(TSL);
  const q = warp(TSL, TSL.positionLocal.mul(1.3), { amp: 0.5, octaves: 2 });
  const crest = TSL.sin(q.x.mul(7).add(q.z.mul(1.6))).mul(0.5).add(0.5);
  const dune = crest.pow(1.6);
  const grain = fbm(TSL, TSL.positionLocal.mul(30), { octaves: 2 }).mul(0.06);
  mat.colorNode = ramp(TSL, dune.add(grain), [
    [0.0, brand.slate.mul(0.7)],
    [0.3, solar.limb.mul(0.5)],
    [0.62, solar.swarmWarm],
    [1.0, solar.hot],
  ]).mul(0.9);
  return { impl: 'native' };
};

export const source = () => `const q = warp(posL.mul(1.3), { amp: .5 });
const crest = sin(q.x.mul(7).add(q.z.mul(1.6)))
  .mul(.5).add(.5);
const dune = crest.pow(1.6);   // steep slip face
const grain = fbm(posL.mul(30), { octaves: 2 })
  .mul(.06);
colorNode = ramp(dune.add(grain),
  [[0, slate.mul(.7)], [.3, limb.mul(.5)],
   [.62, swarmWarm], [1, hot]]).mul(.9);`;
