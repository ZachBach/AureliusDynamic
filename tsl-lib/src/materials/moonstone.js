/**
 * MOONSTONE — adularescence, and the reason the glow looks like it is BELOW
 * the surface rather than on it. Feldspar unmixes on cooling into alternating
 * albite/orthoclase lamellae a few hundred nanometres thick; light scatters
 * off that stack, and because the layers are near the short end of the
 * visible band the scatter is Rayleigh-weighted — blue leaves, warm passes
 * through. So the sheen is a broad lobe tied to the lamellar plane, not a
 * specular point tied to the surface normal, and it swims when the stone
 * turns. Modelled as a wide directional lobe about the lamellae, gated by
 * depth into the stone rather than by fresnel.
 *
 * @cost    see REGISTRY materials/moonstone
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'MOONSTONE';

export const apply = (TSL, mat) => {
  const { brand, terra } = palette(TSL);
  const lamellae = TSL.vec3(0.25, 0.94, 0.22).normalize(); // the unmixing plane
  const view = TSL.cameraPosition.sub(TSL.positionWorld).normalize();
  const n = TSL.normalWorld;
  // a BROAD lobe about the lamellar plane — not a specular highlight
  const lobe = n.dot(lamellae).abs().oneMinus();
  const sheen = TSL.smoothstep(0.35, 0.98, lobe.mul(view.dot(n).abs().mul(0.6).add(0.55)));
  // faint cloudiness — the stone is never optically clean
  const cloud = fbm(TSL, TSL.positionLocal.mul(2.1), { octaves: 3 }).mul(0.5).add(0.5);
  const depth = TSL.mix(0.55, 1.0, cloud);
  const fres = fresnel(TSL, { power: 4 });
  mat.colorNode = TSL.mix(brand.slate, brand.mist, 0.35).mul(0.55)
    // Rayleigh-weighted: blue is what scatters back out
    .add(terra.atmo.mul(sheen.mul(depth).mul(1.35)))
    .add(brand.ice.mul(sheen.pow(3).mul(0.6)))
    .add(brand.ice.mul(fres.pow(4).mul(0.28)));
  return { impl: 'native' };
};

export const source = () => `const lamellae = vec3(.25, .94, .22).normalize();
// a BROAD lobe about the unmixing plane — the glow
// sits under the surface, so it is not a fresnel term
const lobe = normalWorld.dot(lamellae).abs().oneMinus();
const sheen = smoothstep(.35, .98,
  lobe.mul(view.dot(n).abs().mul(.6).add(.55)));
const depth = mix(.55, 1, fbm(posL.mul(2.1)));
colorNode = mix(slate, mist, .35).mul(.55)
  .add(atmo.mul(sheen.mul(depth).mul(1.35)))  // Rayleigh
  .add(ice.mul(sheen.pow(3).mul(.6)));`;
