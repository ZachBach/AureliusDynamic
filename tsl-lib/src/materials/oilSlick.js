/**
 * OIL SLICK — thin-film interference over near-black water. The film's
 * thickness is a drifting fbm field fed to thinFilm as a phase shift, so the
 * iridescence moves by changing where it sits in the interference cycle
 * rather than by mixing toward a hue.
 *
 * @cost    see REGISTRY materials/oilSlick
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { thinFilm } from '../fresnel/thinFilm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'OIL SLICK';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.mul(2.6).add(TSL.vec3(0, 0, clock.mul(0.06)));
  const thickness = fbm(TSL, p, { octaves: 4 }).mul(0.5).add(0.5);
  const film = thinFilm(TSL, { cycles: 3.4, shift: thickness.mul(2.2) });
  const wet = fresnel(TSL, { power: 4 });
  mat.colorNode = brand.void.mul(0.6)
    .add(film.mul(thickness.mul(0.7).add(0.3)))
    .add(brand.ice.mul(wet.mul(0.35)));
  return { impl: 'native' };
};

export const source = () => `const th = fbm(posL.mul(2.6))
  .mul(.5).add(.5);            // film thickness
const film = thinFilm({ cycles: 3.4,
  shift: th.mul(2.2) });       // phase, not hue
colorNode = void.mul(.6)
  .add(film.mul(th.mul(.7).add(.3)))
  .add(ice.mul(fresnel({ power: 4 })
    .mul(.35)));`;