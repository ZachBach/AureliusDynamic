// Phase 0/3 pipeline-proof demos. These are NOT library nodes — they prove
// the bench + verification gate before Phase 2 lands real nodes under src/.
// They follow the library factory shape from docs/CONVENTIONS.md:
// (TSL, material, opts) in, no owned uniforms, injected clock, mx_*
// feature-detected.
//
// Entry contract (what verify-all.mjs and index.html consume):
//   apply(TSL, mat, opts)  — build the material; opts.clock is the animation
//                            clock node (frozen to a constant in parity mode);
//                            other opts are node params. MUST return
//                            { impl: 'native' | 'fallback' }.
//   source()               — curated readable snippet (Lab display source)
//   sweep                  — param sets rendered as a grid in ?sweep=1 mode
//                            and swept in parity shots
//   parityGeo              — geometry for parity shots ('quad' default;
//                            'sphere' for view-dependent nodes needing
//                            curvature)
//   parityTolerance        — { maxDiffPct, pixelThreshold } per-node override

const fresnelOf = (TSL) => {
  const { float, cameraPosition, positionWorld, normalWorld } = TSL;
  const eye = cameraPosition.sub(positionWorld).normalize();
  return float(1).sub(eye.dot(normalWorld).abs());
};

export const nodes = {
  'fbm-mx': {
    parityGeo: 'quad',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 6 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { positionLocal, vec3, color } = TSL;
      const n = TSL.mx_fractal_noise_float(
        positionLocal.mul(2.4).add(vec3(clock.mul(0.15), 0, 0)), octaves, 2.0, 0.5)
        .mul(0.5).add(0.5);
      mat.colorNode = color(0x57D4FF).mul(n).add(color(0x2B6CF6).mul(n.pow(3)));
      return { impl: 'native' };
    },
    source: () => `const n = fbm(posL.mul(2.4), { octaves: 4 })
  .mul(.5).add(.5);
colorNode = cyan.mul(n).add(blue.mul(n.pow(3)));`,
  },

  'worley-mx': {
    parityGeo: 'quad',
    sweep: [{ scale: 2.0 }, { scale: 3.2 }, { scale: 5.0 }],
    apply(TSL, mat, { clock, scale = 3.2 } = {}) {
      const { positionLocal, vec3, color, smoothstep } = TSL;
      const worley = TSL.mx_worley_noise_float;
      const p = positionLocal.mul(scale).add(vec3(0, clock.mul(0.2), 0));
      const w = worley ? worley(p)
        : TSL.mx_fractal_noise_float(p, 3, 2.0, 0.5).abs();
      mat.colorNode = color(0x2B6CF6).mul(smoothstep(0.45, 0.92, w).mul(1.5));
      return { impl: worley ? 'native' : 'fallback' };
    },
    source: () => `const w = worleyF1(posL.mul(3.2));
colorNode = blue.mul(smoothstep(.45, .92, w).mul(1.5));`,
  },

  'fresnel': {
    parityGeo: 'sphere', // needs curvature — flat quads give a constant normal
    sweep: [{ power: 1 }, { power: 3 }, { power: 5 }],
    // silhouette rasterization differs slightly between backends; allow more
    // differing pixels than the flat-quad nodes
    parityTolerance: { maxDiffPct: 1.0 },
    apply(TSL, mat, { power = 1 } = {}) {
      const { color } = TSL;
      const fres = fresnelOf(TSL).pow(power);
      mat.colorNode = color(0x57D4FF).mul(fres.mul(1.4))
        .add(color(0xEAF7FF).mul(fres.pow(5)));
      return { impl: 'native' };
    },
    source: () => `const fres = fresnel({ power: 1 });
colorNode = cyan.mul(fres.mul(1.4))
  .add(ice.mul(fres.pow(5)));`,
  },
};
