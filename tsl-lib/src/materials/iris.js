/**
 * IRIS — the human eye, which is a muscle with a pattern nobody chose. The
 * radial trabeculae are collagen strands running from the pupil to the
 * ciliary edge; the collarette is the ridge about a third of the way out
 * where the two muscle systems meet. And the colour is a trick: there is no
 * blue pigment in a blue eye, only melanin at the back and Tyndall scattering
 * in the stroma in front of it, which is why blue eyes are structural and
 * brown ones are not. So the model puts the brown UNDER and the scatter OVER.
 *
 * @cost    see REGISTRY materials/iris
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { streaks } from '../pattern/streaks.js';
import { fbm } from '../noise/fbm.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'IRIS';

export const apply = (TSL, mat) => {
  const { brand, terra, solar } = palette(TSL);
  const q = TSL.positionLocal.xy;
  const r = q.length();
  const ang = TSL.atan(q.y, q.x);
  // trabeculae: collagen strands running pupil -> ciliary edge
  const fibers = streaks(TSL, ang, { lobes: 46, sharpness: 1.4, floor: 0.35 })
    .mul(streaks(TSL, ang.mul(2.7), { lobes: 17, sharpness: 2.2, floor: 0.5 }));
  const crypts = fbm(TSL, TSL.vec3(ang.mul(2.2), r.mul(5.5), 0.0), { octaves: 3 }).mul(0.5).add(0.5);
  // the collarette — where the sphincter and dilator meet, ~1/3 out
  const collarette = TSL.smoothstep(0.07, 0.0, r.sub(0.38).abs());
  const depth = TSL.mix(0.45, 1.0, TSL.smoothstep(0.22, 0.85, r)).mul(TSL.mix(0.6, 1.0, fibers));
  // melanin BEHIND...
  const stroma = ramp(TSL, crypts.mul(depth), [
    [0.0, brand.void], [0.35, solar.limb.mul(0.30)],
    [0.7, solar.swarmWarm.mul(0.42)], [1.0, solar.mid.mul(0.35)],
  ]);
  // ...Tyndall scatter IN FRONT: this is why blue eyes have no blue pigment
  const scatter = TSL.smoothstep(0.25, 0.95, r).mul(TSL.mix(0.35, 1.0, crypts));
  const pupil = TSL.smoothstep(0.24, 0.19, r);
  const limbal = TSL.smoothstep(0.86, 1.02, r); // the dark ring at the edge
  mat.colorNode = stroma
    .add(terra.atmo.mul(scatter.mul(0.75)))
    .add(brand.ice.mul(scatter.mul(fibers).mul(0.28)))
    .add(brand.mist.mul(collarette.mul(0.22)))
    .mul(pupil.oneMinus())
    .mul(limbal.oneMinus().mul(0.85).add(0.15));
  return { impl: 'native' };
};

export const source = () => `const r = posL.xy.length(), ang = atan(q.y, q.x);
// trabeculae: collagen, pupil -> ciliary edge
const fibers = streaks(ang, { lobes: 46 })
  .mul(streaks(ang.mul(2.7), { lobes: 17 }));
// the collarette, where the two muscles meet
const collarette = smoothstep(.07, 0, r.sub(.38).abs());
// melanin BEHIND...
const stroma = ramp(crypts.mul(depth),
  [[0, void], [.35, limb.mul(.3)], [.7, swarmWarm.mul(.42)]]);
// ...Tyndall scatter IN FRONT. A blue eye has no
// blue pigment; it is structural, like the sky.
colorNode = stroma.add(atmo.mul(scatter.mul(.75)))
  .mul(pupil.oneMinus());`;
