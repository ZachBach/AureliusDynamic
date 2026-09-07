/**
 * STRATA — sedimentary layering, plus the one feature that makes a cliff face
 * readable as history: an ANGULAR UNCONFORMITY. Below it an older sequence
 * was laid down, tilted, and planed flat by erosion; above it a younger
 * sequence sits horizontally on the stump. The surface between them is a gap
 * in time — often tens of millions of years — and it is visible precisely
 * because the two bedding directions disagree. Two layer stacks read along
 * two different axes, switched by a height threshold, is the whole trick.
 *
 * @cost    see REGISTRY materials/strata
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'STRATA';

export const apply = (TSL, mat) => {
  const { brand, solar, terra } = palette(TSL);
  const p = TSL.positionLocal;
  // beds are never perfectly flat — a little relief, or it reads as wallpaper
  const relief = fbm(TSL, p.mul(1.6), { octaves: 3 }).mul(0.09);
  const younger = p.y.add(relief).mul(6.5); // horizontal, deposited last
  const older = p.y.mul(0.72).add(p.x.mul(0.62)).add(relief).mul(8.5); // tilted, then truncated
  const unconformity = TSL.smoothstep(-0.06, 0.06, p.y.add(relief.mul(1.5)).sub(0.1));
  const bed = TSL.mix(older, younger, unconformity).fract();
  const rock = ramp(TSL, bed, [
    [0.0, brand.slate], [0.18, solar.limb.mul(0.32)],
    [0.42, brand.mist.mul(0.55)], [0.66, terra.land.mul(0.22)],
    [0.85, solar.mid.mul(0.30)], [1.0, brand.slate.mul(1.3)],
  ]);
  // the contact itself: a hard line, because the time gap is a surface
  const contact = TSL.smoothstep(0.045, 0.0, p.y.add(relief.mul(1.5)).sub(0.1).abs());
  mat.colorNode = rock.mul(0.95)
    .sub(brand.void.mul(contact.mul(0.6)))
    .add(brand.mist.mul(contact.mul(0.12)));
  return { impl: 'native' };
};

export const source = () => `const younger = posL.y.add(relief).mul(6.5);
const older = posL.y.mul(.72)          // tilted, then
  .add(posL.x.mul(.62)).add(relief).mul(8.5);  // planed off
// the unconformity: the two bedding directions
// DISAGREE, and the gap between them is ~10^7 years
const bed = mix(older, younger,
  smoothstep(-.06, .06, posL.y.sub(.1))).fract();
colorNode = ramp(bed, [[0, slate], [.18, limb.mul(.32)],
  [.42, mist.mul(.55)], [.66, land.mul(.22)]])
  .sub(void.mul(contact.mul(.6)));`;
