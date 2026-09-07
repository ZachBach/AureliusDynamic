/**
 * AMBER — fossil resin, which is a FLOW before it is a stone. Resin ran down
 * bark in successive pulses, each one trapping whatever was on the surface,
 * so the interior carries stretched flow lines and the inclusions sit ON
 * those lines rather than scattered through the volume. That is also how a
 * fake is spotted: cast resin has bubbles everywhere and no lamination. The
 * warp here supplies the flow, and the inclusions are gated by it so they
 * land where the flow would actually have swept them.
 *
 * @cost    see REGISTRY materials/amber
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { warp } from '../noise/warp.js';
import { worleyF1 } from '../noise/worley.js';
import { fresnel } from '../fresnel/fresnel.js';
import { ramp } from '../ramp/ramp.js';

export const name = 'AMBER';

export const apply = (TSL, mat) => {
  const { brand, solar } = palette(TSL);
  // resin ran in pulses: stretch the domain along the flow before laminating
  const flow = warp(TSL, TSL.positionLocal.mul(TSL.vec3(1.5, 0.55, 1.5)), { amp: 0.55, octaves: 3 });
  const lamination = flow.y.mul(5.5).add(flow.x.mul(1.2)).sin().mul(0.5).add(0.5);
  const body = ramp(TSL, lamination, [
    [0.0, solar.limb.mul(0.5)], [0.45, solar.mid.mul(0.85)],
    [0.75, solar.swarmWarm], [1.0, solar.hot.mul(0.9)],
  ]);
  // inclusions sit ON the flow lines — that is what separates it from cast resin
  const debris = worleyF1(TSL, flow.mul(7.5), { impl: 'fallback' });
  const bubble = TSL.smoothstep(0.26, 0.02, debris).mul(TSL.smoothstep(0.35, 0.75, lamination));
  const fres = fresnel(TSL, { power: 2.5 });
  mat.colorNode = body.mul(TSL.mix(0.55, 1.0, lamination))
    .sub(brand.void.mul(bubble.mul(0.75)))
    .add(solar.hot.mul(bubble.pow(3).mul(0.4)))
    .add(solar.hot.mul(fres.pow(3).mul(0.5)));
  return { impl: 'fallback' };
};

export const source = () => `// resin RAN, in pulses — stretch the domain
// along the flow, then laminate it
const flow = warp(posL.mul(vec3(1.5, .55, 1.5)),
  { amp: .55 });
const lam = flow.y.mul(5.5).add(flow.x.mul(1.2))
  .sin().mul(.5).add(.5);
const body = ramp(lam, [[0, limb.mul(.5)],
  [.45, mid.mul(.85)], [.75, swarmWarm]]);
// inclusions ride the flow lines; cast fakes
// scatter their bubbles evenly and have no lamination
const bubble = smoothstep(.26, .02, worleyF1(flow.mul(7.5)))
  .mul(smoothstep(.35, .75, lam));
colorNode = body.sub(void.mul(bubble.mul(.75)));`;
