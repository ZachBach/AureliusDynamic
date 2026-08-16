/**
 * CARBON WEAVE — the plain-weave twill, shaded as fibre rather than as paint.
 * Each tow is thousands of parallel filaments, so its highlight is a band
 * lying across the tow, and the band's direction turns ninety degrees every
 * time the weave's over/under swaps. Feeding `anisoSheen` a tangent chosen by
 * `weave`'s own visibility flag is what makes the cloth flash in a chequer as
 * the light moves, which no isotropic specular can do.
 *
 * @cost    see REGISTRY materials/carbonWeave
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { weave } from '../pattern/weave.js';
import { valueNoise2D } from '../noise/valueNoise2D.js';
import { anisoSheen, surfaceTangent } from '../fresnel/anisoSheen.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'CARBON WEAVE';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.xy;
  const { height, mask, warpVisible } = weave(TSL, p, { cells: 5, thickness: 0.34, sink: 0.5 });
  // filament grain runs ALONG the visible tow, so the sampling stretches with it
  const grain = valueNoise2D(TSL, TSL.mix(
    TSL.vec2(p.x.mul(110), p.y.mul(4)),
    TSL.vec2(p.x.mul(4), p.y.mul(110)),
    warpVisible));
  const { u, v } = surfaceTangent(TSL);
  const T = TSL.mix(v, u, warpVisible);
  const sheen = anisoSheen(TSL, T, { power: 22, shift: grain.mul(0.07) });
  const resin = fresnel(TSL, { power: 3.2 });
  mat.colorNode = brand.void.mul(0.75)
    .add(brand.slate.mul(mask.mul(height.mul(0.55).add(0.45))))
    .add(brand.silver.mul(sheen.mul(mask).mul(1.15)))
    .add(brand.cyan.mul(resin.mul(0.22)))
    .add(brand.ice.mul(sheen.pow(2).mul(mask).mul(0.4)));
  return { impl: 'native' };
};

export const source = () => `const { height, mask, warpVisible } =
  weave(posL.xy, { cells: 5, thickness: .34 });
const grain = valueNoise2D(mix(       // grain runs
  vec2(p.x.mul(110), p.y.mul(4)),        // ALONG
  vec2(p.x.mul(4), p.y.mul(110)),        // the tow
  warpVisible));
const { u, v } = surfaceTangent();
const sheen = anisoSheen(mix(v, u, warpVisible),
  { power: 22, shift: grain.mul(.07) });
colorNode = void.mul(.75)
  .add(slate.mul(mask.mul(height.mul(.55).add(.45))))
  .add(silver.mul(sheen.mul(mask).mul(1.15)))
  .add(cyan.mul(fresnel({ power: 3.2 }).mul(.22)));`;
