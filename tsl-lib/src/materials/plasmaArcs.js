/**
 * PLASMA ARCS — ridged-fbm filaments thresholded into crawling lightning,
 * storm-envelope flashes, additive over a fresnel field glow.
 *
 * @cost    see REGISTRY materials/plasmaArcs
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { ridgedFbm } from '../noise/ridgedFbm.js';
import { fresnel } from '../fresnel/fresnel.js';
import { flash } from '../pattern/flicker.js';

export const name = 'PLASMA ARCS';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  mat.side = 2;
  const r = ridgedFbm(TSL, TSL.positionLocal.mul(1.7).add(TSL.vec3(clock.mul(0.12), 0, clock.mul(0.07))), { octaves: 4 });
  const arc = TSL.smoothstep(0.78, 0.96, r);
  const core = TSL.smoothstep(0.9, 0.99, r);
  const surge = flash(TSL, clock, { rate: 2.2, phase: TSL.positionLocal.y.mul(2), sharpness: 6, floor: 0.45 });
  const fres = fresnel(TSL);
  mat.colorNode = brand.blue.mul(arc.mul(1.6))
    .add(terra.bolt.mul(arc.mul(surge).mul(1.4)))
    .add(brand.ice.mul(core.mul(2.4)))
    .add(brand.cyan.mul(fres.mul(0.5)));
  mat.opacityNode = arc.mul(0.75).add(core.mul(0.5)).add(fres.mul(0.3));
  return { impl: 'native' };
};

export const source = () => `const r = ridgedFbm(posL.mul(1.7)
  .add(drift), { octaves: 4 });
const arc = smoothstep(.78, .96, r);
const core = smoothstep(.9, .99, r);
const surge = flash(t, { rate: 2.2,
  sharpness: 6, floor: .45 });
colorNode = blue.mul(arc.mul(1.6))
  .add(bolt.mul(arc.mul(surge).mul(1.4)))
  .add(ice.mul(core.mul(2.4)));
opacityNode = arc.mul(.75).add(core.mul(.5));`;
