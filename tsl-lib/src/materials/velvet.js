/**
 * VELVET — the sheen lobe, not a diffuse lobe. Velvet's signature is that
 * the face pointing straight at the light is the darkest part and the
 * grazing rim is the brightest, which is fresnel used as the primary term
 * rather than as a garnish. High-frequency fbm gives the nap its jitter.
 *
 * @cost    see REGISTRY materials/velvet
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { fresnel } from '../fresnel/fresnel.js';
import { rimLight } from '../fresnel/rimLight.js';

export const name = 'VELVET';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const L = TSL.vec3(0.5, 0.7, 0.5).normalize();
  const nap = fbm(TSL, TSL.positionLocal.mul(26), { octaves: 2 }).mul(0.5).add(0.5);
  const sheen = fresnel(TSL, { power: 1.4 }).mul(nap.mul(0.5).add(0.75));
  const lambert = TSL.normalWorld.dot(L).mul(0.5).add(0.5);
  mat.colorNode = brand.blue.mul(0.18)
    .add(brand.blue.mul(lambert.mul(0.22)))
    .add(brand.cyan.mul(sheen.mul(0.9)))
    .add(rimLight(TSL, { color: brand.ice, power: 5, dir: L, biasAmount: 0.5 }).mul(0.35));
  return { impl: 'native' };
};

export const source = () => `const nap = fbm(posL.mul(26), { octaves: 2 })
  .mul(.5).add(.5);            // fibre jitter
const sheen = fresnel({ power: 1.4 })
  .mul(nap.mul(.5).add(.75));  // rim bright, face dark
colorNode = blue.mul(.18)
  .add(blue.mul(lambert.mul(.22)))
  .add(cyan.mul(sheen.mul(.9)))
  .add(rimLight({ color: ice, dir: L }).mul(.35));`;
