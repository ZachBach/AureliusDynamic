/**
 * spherePoint — uniform point on the unit sphere from two hash channels.
 * The idiom shipped three times verbatim (Dyson shells, sun, earth — see
 * docs/INVENTORY.md §5): y from one hash, ring angle from the other, with an
 * optional drift node added to the angle for slow orbital motion.
 *
 * @param   {object} TSL
 * @param   {Node}   h1  hash channel for the ring angle (0..1)
 * @param   {Node}   h2  hash channel for latitude (0..1)
 * @param   {object} opts
 * @param   {Node}   [opts.drift]  node added to the angle (e.g. clock·rate)
 * @returns {Node} vec3 unit direction
 * @cost    class ① — a handful of transcendentals
 * @backend wgsl ✓ / glsl ✓
 */
export const spherePoint = (TSL, h1, h2, { drift } = {}) => {
  const { vec3, cos, sin } = TSL;
  const y = h2.mul(2).sub(1);
  const s = y.mul(y).oneMinus().max(0.0001).sqrt();
  let th = h1.mul(Math.PI * 2);
  if (drift) th = th.add(drift);
  return vec3(cos(th).mul(s), y, sin(th).mul(s));
};

export const source = () => `const dir = spherePoint(h1, h2, { drift: clock.mul(.15) });
positionNode = center.add(dir.mul(radius));`;
