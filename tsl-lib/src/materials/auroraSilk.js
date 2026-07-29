/**
 * AURORA SILK — the hero's aurora curtain draped over geometry via uv space:
 * two layers (near + far preset) of ridgeline glow with falling rays.
 *
 * @cost    see REGISTRY materials/auroraSilk
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { curtain } from '../pattern/curtain.js';

export const name = 'AURORA SILK';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  mat.side = 2;
  const u = TSL.uv();
  const near = curtain(TSL, u, { clock: clock.mul(0.06) });
  const far = curtain(TSL, u, { ridgeBase: 0.76, ridgeFreq: 0.55, decay: 5.5, seed: 6.3, clock: clock.mul(0.04) });
  mat.colorNode = brand.cyan.mul(near.glow.mul(1.15))
    .add(brand.blue.mul(near.glow.mul(0.5)).add(brand.blue.mul(far.glow.mul(0.6))))
    .add(brand.gold.mul(near.edge.mul(0.9)))
    .add(brand.cyan.mul(far.edge.mul(0.35)));
  mat.opacityNode = near.glow.mul(0.55).add(far.glow.mul(0.25))
    .add(near.edge.mul(0.3)).add(0.06);
  return { impl: 'native' };
};

export const source = () => `const near = curtain(uv(), { clock: t });
const far = curtain(uv(), { ridgeBase: .76,
  decay: 5.5, seed: 6.3, clock: t.mul(.7) });
colorNode = cyan.mul(near.glow.mul(1.15))
  .add(blue.mul(far.glow.mul(.6)))
  .add(gold.mul(near.edge.mul(.9)));
opacityNode = near.glow.mul(.55)
  .add(far.glow.mul(.25)).add(.06);`;
