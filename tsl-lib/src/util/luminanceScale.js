/**
 * luminanceScale — JS-side (not a node): keep an additive particle field's
 * aggregate brightness steady as its count scales, per the hero's
 * DIM/SDIM/EDIM idiom (docs/INVENTORY.md §5): brightness ∝ √(ref/count),
 * clamped.
 *
 * @param   {number} count  live particle count
 * @param   {object} opts
 * @param   {number} [opts.ref=100000]  count at which scale = k
 * @param   {number} [opts.k=0.6]       nominal brightness at ref
 * @param   {number} [opts.min=0.22]
 * @param   {number} [opts.max=0.6]
 * @returns {number} multiply into opacity/brightness
 */
export const luminanceScale = (count, { ref = 100000, k = 0.6, min = 0.22, max = 0.6 } = {}) =>
  Math.max(min, Math.min(max, k * Math.sqrt(ref / Math.max(1, count))));

export const source = () => `const DIM = luminanceScale(COUNT);
opacityNode = disc.mul(gates).mul(DIM);`;
