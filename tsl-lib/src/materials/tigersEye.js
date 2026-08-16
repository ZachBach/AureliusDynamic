/**
 * TIGER'S EYE — chatoyancy, the cat's-eye band. The stone is crocidolite
 * fibres replaced by quartz, so it reflects like a bundle of wires: the
 * highlight is a band lying ACROSS the fibres, and it slides along them as
 * the stone turns rather than staying put like a specular dot. `anisoSheen`
 * is the whole effect; the stretched fbm underneath only supplies the golden
 * banding and the jitter that breaks the sheen into strands.
 *
 * @cost    see REGISTRY materials/tigersEye
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { ramp } from '../ramp/ramp.js';
import { anisoSheen, surfaceTangent } from '../fresnel/anisoSheen.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = "TIGER'S EYE";

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  // fibres run along one axis, so the sampling domain is stretched along it
  const fibre = fbm(TSL, TSL.positionLocal.mul(TSL.vec3(2.2, 30, 2.2)), { octaves: 3 })
    .mul(0.5).add(0.5);
  const band = fbm(TSL, TSL.positionLocal.mul(TSL.vec3(1.5, 5.5, 1.5)), { octaves: 3 })
    .mul(0.5).add(0.5);
  const { u } = surfaceTangent(TSL);
  const sheen = anisoSheen(TSL, u, { power: 30, shift: fibre.sub(0.5).mul(0.16) });
  const wide = anisoSheen(TSL, u, { power: 4, shift: band.sub(0.5).mul(0.1) });
  mat.colorNode = ramp(TSL, band, [
    [0.0, brand.void.mul(1.4)],
    [0.35, brand.ember.mul(0.35)],
    [0.7, brand.gold.mul(0.7)],
    [1.0, brand.gold.mul(1.15)],
  ]).mul(fibre.mul(0.35).add(0.75))
    .add(brand.gold.mul(wide.mul(0.35)))
    .add(brand.ice.mul(sheen.mul(0.8)))
    .add(brand.ember.mul(fresnel(TSL, { power: 3.5 }).mul(0.3)));
  return { impl: 'native' };
};

export const source = () => `const fibre = fbm(posL.mul(vec3(2.2, 30, 2.2)))
  .mul(.5).add(.5);            // domain stretched
// along the fibre axis, so the noise is fibrous
const { u } = surfaceTangent();
const sheen = anisoSheen(u, { power: 30,
  shift: fibre.sub(.5).mul(.16) });
// the band lies ACROSS the fibres and SLIDES
// along them — a dot specular can't do this
colorNode = ramp(band, [[0, void.mul(1.4)],
    [.35, ember.mul(.35)], [.7, gold.mul(.7)],
    [1, gold.mul(1.15)]])
  .mul(fibre.mul(.35).add(.75))
  .add(ice.mul(sheen.mul(.8)));`;