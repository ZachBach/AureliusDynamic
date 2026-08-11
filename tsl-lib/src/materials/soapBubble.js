/**
 * SOAP BUBBLE — the film drains under gravity, so it is thin and nearly
 * colourless at the top and pools thick at the bottom. That vertical
 * thickness gradient, fed to thinFilm as a phase shift, is what separates a
 * bubble from a generic iridescent ball.
 *
 * @cost    see REGISTRY materials/soapBubble
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { thinFilm } from '../fresnel/thinFilm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'SOAP BUBBLE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const drain = TSL.positionLocal.y.mul(-0.5).add(0.5);
  const churn = fbm(TSL, TSL.positionLocal.mul(2.4).add(TSL.vec3(0, clock.mul(0.12), 0)), { octaves: 3 })
    .mul(0.5).add(0.5);
  const thickness = drain.mul(0.7).add(churn.mul(0.4));
  const film = thinFilm(TSL, { cycles: 4.2, shift: thickness.mul(3.1) });
  const rim = fresnel(TSL, { power: 2.2 });
  mat.transparent = true;
  mat.colorNode = film.mul(rim.mul(0.8).add(0.35))
    .add(brand.ice.mul(rim.pow(4).mul(0.6)));
  mat.opacityNode = rim.mul(0.85).add(0.12);
  return { impl: 'native' };
};

export const source = () => `const drain = posL.y.mul(-.5).add(.5);
const churn = fbm(posL.mul(2.4)
  .add(vec3(0, clock.mul(.12), 0)))
  .mul(.5).add(.5);
const th = drain.mul(.7).add(churn.mul(.4));
const film = thinFilm({ cycles: 4.2,
  shift: th.mul(3.1) });       // thick pools low
transparent = true;
colorNode = film.mul(rim.mul(.8).add(.35))
  .add(ice.mul(rim.pow(4).mul(.6)));
opacityNode = rim.mul(.85).add(.12);`;
