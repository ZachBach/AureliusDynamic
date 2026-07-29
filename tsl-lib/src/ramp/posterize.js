/**
 * posterize — quantize a scalar or color into discrete steps. The toon/cel
 * ingredient and the glitch-banding tool.
 *
 * @param   {object} TSL
 * @param   {Node}   x  float or vec3 (0..1 domain)
 * @param   {object} opts
 * @param   {number} [opts.steps=4]
 * @returns {Node} same width as x, quantized to `steps` levels (0..1 kept)
 * @cost    class ① — mul/floor/div
 * @backend wgsl ✓ / glsl ✓
 */
export const posterize = (TSL, x, { steps = 4 } = {}) =>
  x.mul(steps).floor().div(Math.max(1, steps - 1)).clamp(0, 1);

export const source = () => `const cel = posterize(shade, { steps: 3 });
colorNode = mix(slate, gold, cel);`;
