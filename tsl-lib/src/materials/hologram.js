/**
 * HOLOGRAM — fresnel shell + traveling scanlines + flicker. Library rebuild
 * of the shipped Lab material (screenshot-parity gated against the bundle).
 *
 * @param   {object} TSL
 * @param   {object} mat   MeshBasicNodeMaterial to configure
 * @param   {object} opts  { clock } — the Lab passes its flux-scaled clock
 * @cost    see REGISTRY materials/hologram
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { scanlines } from '../pattern/scanlines.js';
import { flicker } from '../pattern/flicker.js';

export const name = 'HOLOGRAM';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;  // THREE.AdditiveBlending
  mat.depthWrite = false;
  mat.side = 2;      // THREE.DoubleSide
  const fres = fresnel(TSL);
  const scan = scanlines(TSL, TSL.positionWorld.y, { freq: 46, speed: 6, sharpness: 3, clock });
  const flick = flicker(TSL, clock, { rate: 23, depth: 0.12 });
  mat.colorNode = brand.cyan.mul(fres.mul(1.4))
    .add(brand.blue.mul(scan.mul(0.8)))
    .add(brand.ice.mul(fres.pow(3)));
  mat.opacityNode = fres.mul(0.85).add(scan.mul(0.25)).mul(flick);
  return { impl: 'native' };
};

export const source = () => `const fres = fresnel();
const scan = scanlines(posW.y,
  { freq: 46, sharpness: 3, clock: t });
const flick = flicker(t, { rate: 23, depth: .12 });
colorNode = cyan.mul(fres.mul(1.4))
  .add(blue.mul(scan.mul(.8)))
  .add(ice.mul(fres.pow(3)));
opacityNode = fres.mul(.85)
  .add(scan.mul(.25)).mul(flick);`;
