/**
 * interference — the superposition of N circular waves, returned as both the
 * instantaneous field and its time-independent envelope.
 *
 * The envelope is the useful half and it is not an approximation. Each source
 * contributes cos(k·d − ωt); summing them is the real part of e^(−iωt)·Σe^(ikd),
 * so the amplitude a point can ever reach is |Σe^(ikd)| — computable once, with
 * no time in it. That is what draws the nodal lines (the dark hyperbolae of a
 * two-source ripple tank) as geometry rather than as a lucky frame.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec2 sample position
 * @param   {object} opts
 * @param   {number[][]} [opts.sources]  source positions in p's space
 * @param   {number} [opts.freq=26]    wavenumber k (radians per unit distance)
 * @param   {number} [opts.speed=3.2]  angular rate ω
 * @param   {number} [opts.decay=1.4]  1/(1+decay·d) amplitude falloff
 * @param   {Node}   [opts.clock]      injected clock (falls back to TSL.time)
 * @returns {object} { field, envelope } — floats, both ~[-1,1] / [0,1]
 * @cost    class ② — 2 trig per source + 2
 * @backend wgsl ✓ / glsl ✓
 */
export const interference = (TSL, p, {
  sources = [[-0.45, -0.25], [0.45, -0.25]],
  freq = 26, speed = 3.2, decay = 1.4, clock,
} = {}) => {
  const { vec2, float, cos, sin } = TSL;
  const t = clock || TSL.time;
  // accumulate the phasor sum Σ a·e^(i·k·d) as its real and imaginary parts
  let re = float(0);
  let im = float(0);
  for (const [sx, sy] of sources) {
    const d = p.sub(vec2(sx, sy)).length();
    const amp = float(1).div(d.mul(decay).add(1));
    const phase = d.mul(freq);
    re = re.add(cos(phase).mul(amp));
    im = im.add(sin(phase).mul(amp));
  }
  const norm = 1 / sources.length;
  const wt = t.mul(speed);
  return {
    // Re(Σe^(ikd) · e^(−iωt)) — the animated surface
    field: re.mul(cos(wt)).add(im.mul(sin(wt))).mul(norm),
    // |Σe^(ikd)| — the standing pattern the animation can never exceed
    envelope: re.mul(re).add(im.mul(im)).sqrt().mul(norm),
  };
};

export const source = () => `const { field, envelope } =
  interference(posL.xy, { sources, freq: 26, clock });
// envelope = |Σ e^(ikd)| — no time in it,
// so the nodal lines are geometry, not a frame
colorNode = atmo.mul(field.mul(.5).add(.5))
  .mul(smoothstep(0, .35, envelope));`;