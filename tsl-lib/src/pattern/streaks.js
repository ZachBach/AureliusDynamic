/**
 * streaks — angular lobes around a center: the sun's corona streamers
 * (docs/INVENTORY.md §4), radial glints, star spikes.
 *
 * @param   {object} TSL
 * @param   {Node}   angle  polar angle (e.g. atan(p.y, p.x))
 * @param   {object} opts
 * @param   {number} [opts.lobes=3]       streak count around the circle
 * @param   {number} [opts.sharpness=2]   pow exponent
 * @param   {number} [opts.floor=0.35]    minimum between lobes
 * @param   {Node}   [opts.drift]         slow precession (clock·rate)
 * @returns {Node} float floor..≈1.2
 * @cost    class ① — one sin + pow
 * @backend wgsl ✓ / glsl ✓
 */
export const streaks = (TSL, angle, { lobes = 3, sharpness = 2, floor = 0.35, drift } = {}) => {
  let a = angle.mul(lobes);
  if (drift) a = a.add(drift);
  return TSL.sin(a).abs().pow(sharpness).mul(0.85).add(floor);
};

export const source = () => `const ang = atan(q.y, q.x);
const streak = streaks(ang, { lobes: 3 });
opacityNode = corona.mul(streak);`;
