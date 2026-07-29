/**
 * vignette — radial edge fade over centered uv, as shipped on the nebula
 * backdrop (fades the veil out before its quad edges can enter frame).
 *
 * @param   {object} TSL
 * @param   {Node}   cuv  centered uv (uv() − .5)
 * @param   {object} opts
 * @param   {number} [opts.inner=0.28]  fully opaque inside this radius
 * @param   {number} [opts.outer=0.72]  fully faded beyond this radius
 * @returns {Node} float 1 (center) → 0 (edge)
 * @cost    class ① — length + smoothstep
 * @backend wgsl ✓ / glsl ✓
 */
export const vignette = (TSL, cuv, { inner = 0.28, outer = 0.72 } = {}) =>
  TSL.smoothstep(outer, inner, cuv.length());

export const source = () => `opacityNode = cloud.mul(vignette(uv().sub(.5)));`;
