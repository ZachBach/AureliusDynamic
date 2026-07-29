/**
 * NEBULA GLASS — the deep-space backdrop recipe sealed inside a fresnel
 * shell: dual-fbm cloud + wisp fields in brand colors under a glass rim.
 *
 * @cost    see REGISTRY materials/nebulaGlass
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'NEBULA GLASS';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, nebula } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  const q = TSL.positionLocal.mul(1.7).add(TSL.vec3(0, 0, clock.mul(0.04)));
  const f1 = fbm(TSL, q, { octaves: 4, gain: 0.55 }).mul(0.5).add(0.5);
  const f2 = fbm(TSL, q.mul(2.3).add(TSL.vec3(7.7, 1.9, 4.2)), { octaves: 4 }).mul(0.5).add(0.5);
  const cloud = TSL.smoothstep(0.45, 0.9, f1);
  const wisp = TSL.smoothstep(0.55, 0.95, f2).mul(f1);
  const fres = fresnel(TSL, { power: 2.5 });
  mat.colorNode = nebula.deep.mul(cloud.mul(2.2))
    .add(brand.blue.mul(wisp.mul(1.1)))
    .add(brand.cyan.mul(TSL.smoothstep(0.7, 0.98, f2).mul(0.7)))
    .add(brand.gold.mul(TSL.smoothstep(0.78, 0.99, f1).mul(TSL.smoothstep(0.55, 0.9, f2)).mul(0.5)))
    .add(brand.ice.mul(fres.mul(0.8)));
  mat.opacityNode = fres.mul(0.6).add(cloud.mul(0.35)).add(wisp.mul(0.2));
  return { impl: 'native' };
};

export const source = () => `const f1 = fbm(q, { octaves: 4, gain: .55 });
const f2 = fbm(q.mul(2.3).add(off));
const cloud = smoothstep(.45, .9, f1);
const wisp = smoothstep(.55, .95, f2).mul(f1);
colorNode = deep.mul(cloud.mul(2.2))
  .add(blue.mul(wisp.mul(1.1)))
  .add(ice.mul(fresnel({ power: 2.5 }).mul(.8)));
opacityNode = fresnel().mul(.6)
  .add(cloud.mul(.35)).add(wisp.mul(.2));`;
