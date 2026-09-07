/**
 * MYCELIUM — the fungal network under the forest floor, and the largest
 * organism on Earth by area. Hyphae grow only at their TIPS, branch when a
 * tip finds resource, and fuse when two tips of the same colony meet
 * (anastomosis) — so unlike a root system the result is a mesh, not a tree,
 * and nutrients can route around a break. The visual signature is fine
 * filaments of near-constant width at every scale, because a hypha does not
 * taper: it is a tube. Ridged noise at three octaves gives filaments; keeping
 * the threshold identical per octave is what preserves the constant width.
 *
 * @cost    see REGISTRY materials/mycelium
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { ridgedFbm } from '../noise/ridgedFbm.js';
import { fbm } from '../noise/fbm.js';

export const name = 'MYCELIUM';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra, solar } = palette(TSL);
  const p = TSL.positionLocal;
  // a hypha does not taper — so the SAME threshold at every scale
  const thread = (scale) => TSL.smoothstep(0.80, 0.99, ridgedFbm(TSL, p.mul(scale), { octaves: 2, gain: 0.5 }));
  const net = TSL.max(TSL.max(thread(2.2), thread(4.6).mul(0.85)), thread(9.4).mul(0.62));
  // growth is at the TIPS: a slow front sweeping the colony outward
  const front = fbm(TSL, p.mul(1.3).add(TSL.vec3(0, clock.mul(0.09), 0)), { octaves: 3 }).mul(0.5).add(0.5);
  const active = TSL.smoothstep(0.42, 0.72, front);
  const soil = TSL.mix(brand.void, brand.slate, fbm(TSL, p.mul(4.2), { octaves: 3 }).mul(0.5).add(0.5));
  mat.colorNode = soil.mul(0.7)
    .add(brand.mist.mul(net.mul(0.75)))
    // the advancing margin is the bright part; the old network dims
    .add(solar.hot.mul(net.mul(active).mul(0.85)))
    .add(terra.swarmCool.mul(net.pow(3).mul(active).mul(0.5)));
  return { impl: 'native' };
};

export const source = () => `// hyphae grow at the TIPS and FUSE when they meet,
// so the result is a mesh, not a tree
const thread = (s) => smoothstep(.80, .99,
  ridgedFbm(posL.mul(s), { octaves: 2 }));
// a hypha is a tube and does not taper, so the
// SAME threshold at every scale keeps the width
const net = max(max(thread(2.2), thread(4.6).mul(.85)),
  thread(9.4).mul(.62));
const active = smoothstep(.42, .72, front);  // the tips
colorNode = soil.mul(.7).add(mist.mul(net.mul(.75)))
  .add(hot.mul(net.mul(active).mul(.85)));`;
