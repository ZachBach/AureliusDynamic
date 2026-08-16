/**
 * polarFold — fold the plane into one wedge and MIRROR it about the wedge's
 * centre line. The mirror is the load-bearing step: without the abs() you get
 * rotational symmetry, which reads as a pinwheel. With it you get the symmetry
 * group of two hinged mirrors — a kaleidoscope, or a snow crystal.
 *
 * Promoted from the inline trick in materials/kaleidoscope.js (2026-08-16).
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec2 coordinates, centred on the fold axis
 * @param   {object} opts
 * @param   {number} [opts.sectors=8]  mirror sectors (12 = a six-fold crystal)
 * @param   {Node|number} [opts.spin=0]  angular offset, e.g. clock.mul(.08)
 * @returns {object} { p, angle, radius } — folded vec2 + its polar parts
 * @cost    class ① — atan + two trig
 * @backend wgsl ✓ / glsl ✓
 */
export const polarFold = (TSL, p, { sectors = 8, spin = 0 } = {}) => {
  const seg = (Math.PI * 2) / sectors;
  const radius = p.length();
  const a = TSL.atan(p.y, p.x).add(spin);
  const angle = a.div(seg).fract().sub(0.5).abs().mul(seg); // fold, then MIRROR
  return {
    p: TSL.vec2(TSL.cos(angle).mul(radius), TSL.sin(angle).mul(radius)),
    angle,
    radius,
  };
};

export const source = () => `const { p: q, radius } =
  polarFold(posL.xy, { sectors: 12 });
// .fract().sub(.5).abs() — fold, then MIRROR:
// without the abs() it is a pinwheel, not a
// kaleidoscope`;