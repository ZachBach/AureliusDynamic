/**
 * ICE — worley crack veins + fresnel glaze + depth tint. Deliberately uses
 * the pure-TSL worley fallback: it measures FASTER than mx native on the
 * baseline (3.58 vs 5.92 ms) — the tiered impl system earning its keep.
 *
 * @cost    see REGISTRY materials/ice
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { rimLight } from '../fresnel/rimLight.js';
import { worleyF1F2 } from '../noise/worley.js';
import { fbm } from '../noise/fbm.js';

export const name = 'ICE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const w = worleyF1F2(TSL, TSL.positionLocal.mul(2.8), { impl: 'fallback' });
  const cracks = TSL.smoothstep(0.07, 0.0, w.y.sub(w.x));
  const depth = fbm(TSL, TSL.positionLocal.mul(1.4).add(TSL.vec3(0, 0, clock.mul(0.05))), { octaves: 3 })
    .mul(0.5).add(0.5);
  const fres = fresnel(TSL, { power: 2 });
  mat.colorNode = TSL.mix(terra.ice, brand.blue.mul(0.55), depth.mul(0.6))
    .mul(cracks.mul(-0.55).add(1))
    .add(brand.ice.mul(fres.mul(0.9)))
    .add(rimLight(TSL, { color: brand.cyan, power: 4 }).mul(0.5));
  return { impl: 'fallback' };
};

export const source = () => `const w = worleyF1F2(posL.mul(2.8),
  { impl: 'fallback' }); // faster than mx here
const cracks = smoothstep(.07, 0, w.y.sub(w.x));
const fres = fresnel({ power: 2 });
colorNode = mix(iceWhite, blue.mul(.55), depth)
  .mul(cracks.mul(-.55).add(1))
  .add(ice.mul(fres.mul(.9)))
  .add(rimLight({ color: cyan, power: 4 }));`;
