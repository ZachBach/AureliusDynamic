/**
 * OBSIDIAN — volcanic glass, and the fracture that made it the best cutting
 * edge in the Stone Age. Glass has no crystal planes to cleave along, so a
 * crack front spreads as a series of nested curved shells from the impact
 * point: CONCHOIDAL fracture, the ripples on a struck flake. Those ripples
 * are the reason a knapped edge can come out a few molecules wide. Modelled
 * as concentric shells around a small number of strike points, sharpened —
 * the ridges between shells are where the light catches.
 *
 * @cost    see REGISTRY materials/obsidian
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'OBSIDIAN';

export const apply = (TSL, mat) => {
  const { brand, terra } = palette(TSL);
  const p = TSL.positionLocal;
  const wobble = fbm(TSL, p.mul(2.2), { octaves: 3 }).mul(0.16);
  // glass has no cleavage planes, so the crack front spreads as nested shells
  const strike = (cx, cy, cz, freq) =>
    p.sub(TSL.vec3(cx, cy, cz)).length().add(wobble).mul(freq).fract();
  const s1 = strike(-0.8, 0.5, 0.6, 9.0);
  const s2 = strike(0.9, -0.6, -0.4, 7.0);
  // the RIDGE between shells is what catches light, so keep the near-1 band
  const ripple = TSL.max(TSL.smoothstep(0.72, 1.0, s1), TSL.smoothstep(0.76, 1.0, s2));
  const fres = fresnel(TSL, { power: 5 });
  // the body is nearly black; everything you see is surface
  mat.colorNode = brand.void.mul(1.05)
    .add(brand.slate.mul(0.22))
    .add(brand.mist.mul(ripple.mul(0.42)))
    .add(brand.ice.mul(ripple.pow(4).mul(0.9)))
    .add(terra.atmo.mul(fres.pow(5).mul(0.5)))
    .add(brand.ice.mul(fres.pow(9).mul(0.7)));
  return { impl: 'native' };
};

export const source = () => `// no cleavage planes, so a crack front spreads
// as nested curved shells — conchoidal fracture,
// the reason a knapped edge can be molecules wide
const shell = posL.sub(strikePt).length()
  .add(wobble).mul(9).fract();
// the RIDGE between shells catches the light
const ripple = smoothstep(.72, 1, shell);
colorNode = void.mul(1.05).add(slate.mul(.22))
  .add(mist.mul(ripple.mul(.42)))
  .add(ice.mul(ripple.pow(4).mul(.9)))
  .add(atmo.mul(fres.pow(5).mul(.5)));`;
