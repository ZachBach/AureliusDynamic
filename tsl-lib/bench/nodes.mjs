// Bench entries — every entry visualizes a real library node from ../src/
// (Phase 2: the Phase 0 hand-rolled demos are retired). Entry contract:
//   id              registry key ('noise/fbm'); map key stays URL/file-safe
//   apply(TSL, mat, { clock, ...params }) → { impl: 'native' | 'fallback' }
//   source()        the node module's own derived snippet
//   sweep           param sets for the frozen parity grid
//   parityGeo / parityTolerance   see verify-all.mjs
import { palette } from '../src/util/palette.js';
import { latlonUv, source as latlonSource } from '../src/util/latlonUv.js';
import { fbm, fbmImpl, source as fbmSource } from '../src/noise/fbm.js';
import { valueNoise, source as valueSource } from '../src/noise/valueNoise.js';
import { worleyF1, worleyF1F2, worleyImpl, source as worleySource } from '../src/noise/worley.js';
import { trigLattice, source as trigSource } from '../src/noise/trigLattice.js';
import { fresnel, source as fresnelSource } from '../src/fresnel/fresnel.js';
import { fireRamp, source as fireSource } from '../src/ramp/fireRamp.js';
import { remap } from '../src/ramp/remap.js';
import { scanlines, source as scanSource } from '../src/pattern/scanlines.js';
import { radialPulse, source as pulseSource } from '../src/pattern/radialPulse.js';
import { dissolve, source as dissolveSource } from '../src/pattern/dissolve.js';
import { flicker, flash, source as flickerSource } from '../src/pattern/flicker.js';
import { vignette, source as vignetteSource } from '../src/pattern/vignette.js';
import { spriteDisc, spriteDiamond, source as discSource } from '../src/pattern/spriteDisc.js';

export const nodes = {
  'noise-fbm': {
    id: 'noise/fbm',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 6 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2.4).add(TSL.vec3(clock.mul(0.15), 0, 0));
      const n = fbm(TSL, p, { octaves }).mul(0.5).add(0.5);
      mat.colorNode = brand.cyan.mul(n).add(brand.blue.mul(n.pow(3)));
      return { impl: fbmImpl(TSL) };
    },
    source: fbmSource,
  },

  'noise-fbm-fallback': {
    id: 'noise/fbm@fallback',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 6 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2.4).add(TSL.vec3(clock.mul(0.15), 0, 0));
      const n = fbm(TSL, p, { octaves, base: 'value' }).mul(0.5).add(0.5);
      mat.colorNode = brand.cyan.mul(n).add(brand.blue.mul(n.pow(3)));
      return { impl: 'fallback' };
    },
    source: fbmSource,
  },

  'noise-value': {
    id: 'noise/valueNoise',
    sweep: [{ scale: 2 }, { scale: 4 }, { scale: 8 }],
    apply(TSL, mat, { scale = 4 } = {}) {
      const { brand } = palette(TSL);
      const n = valueNoise(TSL, TSL.positionLocal.mul(scale)).mul(0.5).add(0.5);
      mat.colorNode = brand.ice.mul(n);
      return { impl: 'native' };
    },
    source: valueSource,
  },

  'noise-worley': {
    id: 'noise/worleyF1',
    sweep: [{ scale: 2 }, { scale: 3.2 }, { scale: 5 }],
    apply(TSL, mat, { clock, scale = 3.2 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(scale).add(TSL.vec3(0, clock.mul(0.2), 0));
      const w = worleyF1(TSL, p);
      mat.colorNode = brand.blue.mul(TSL.smoothstep(0.45, 0.92, w).mul(1.5));
      return { impl: worleyImpl(TSL) };
    },
    source: worleySource,
  },

  'noise-worley-f2f1': {
    // semantics test: if mx_worley_noise_vec2 = (F1, F2), y−x darkens at
    // cell borders — verify in the shot, then the adapter comment is earned
    id: 'noise/worleyF1F2',
    sweep: [{ scale: 2.4 }, { scale: 4 }],
    apply(TSL, mat, { scale = 3.2 } = {}) {
      const { brand } = palette(TSL);
      const w = worleyF1F2(TSL, TSL.positionLocal.mul(scale));
      mat.colorNode = brand.gold.mul(w.y.sub(w.x).mul(1.6));
      return { impl: worleyImpl(TSL) };
    },
    source: worleySource,
  },

  'noise-worley-fallback': {
    id: 'noise/worleyF1F2@fallback',
    sweep: [{ scale: 3.2 }],
    apply(TSL, mat, { scale = 3.2 } = {}) {
      const { brand } = palette(TSL);
      const w = worleyF1F2(TSL, TSL.positionLocal.mul(scale), { impl: 'fallback' });
      mat.colorNode = brand.gold.mul(w.y.sub(w.x).mul(1.6));
      return { impl: 'fallback' };
    },
    source: worleySource,
  },

  'noise-triglattice': {
    id: 'noise/trigLattice',
    sweep: [{ terms: 2 }, { terms: 3 }, { terms: 4 }],
    apply(TSL, mat, { clock, terms = 3 } = {}) {
      const { terra } = palette(TSL);
      const n = trigLattice(TSL, TSL.positionLocal, { terms, freq: 3, drift: clock.mul(0.3) });
      const land = TSL.smoothstep(0.05, 0.45, n);
      mat.colorNode = TSL.mix(terra.ocean, terra.land, land);
      return { impl: 'native' };
    },
    source: trigSource,
  },

  'fresnel': {
    id: 'fresnel/fresnel',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ power: 1 }, { power: 3 }, { power: 5 }],
    apply(TSL, mat, { power = 1 } = {}) {
      const { brand } = palette(TSL);
      const fres = fresnel(TSL, { power });
      mat.colorNode = brand.cyan.mul(fres.mul(1.4)).add(brand.ice.mul(fres.pow(5)));
      return { impl: 'native' };
    },
    source: fresnelSource,
  },

  'ramp-fire': {
    id: 'ramp/fireRamp',
    sweep: [{ gain: 1.6 }, { gain: 2.4 }, { gain: 3.4 }],
    apply(TSL, mat, { clock, gain = 2.4 } = {}) {
      const p = TSL.positionLocal.mul(2.2).add(TSL.vec3(0, clock.mul(0.1), 0));
      const nz = fbm(TSL, p, { octaves: 4 });
      const bright = remap(TSL, nz, -1, 1, 0.3, 4.2);
      mat.colorNode = fireRamp(TSL, bright, { gain });
      return { impl: 'native' };
    },
    source: fireSource,
  },

  'pattern-scanlines': {
    id: 'pattern/scanlines',
    sweep: [{ sharpness: 1 }, { sharpness: 3 }, { sharpness: 7 }],
    apply(TSL, mat, { clock, sharpness = 3 } = {}) {
      const { brand } = palette(TSL);
      const scan = scanlines(TSL, TSL.positionLocal.y, { freq: 18, sharpness, clock });
      mat.colorNode = brand.cyan.mul(scan).add(brand.blue.mul(0.15));
      return { impl: 'native' };
    },
    source: scanSource,
  },

  'pattern-radialpulse': {
    id: 'pattern/radialPulse',
    sweep: [{ freq: 5 }, { freq: 9 }, { freq: 14 }],
    apply(TSL, mat, { clock, freq = 9 } = {}) {
      const { brand } = palette(TSL);
      const pulse = radialPulse(TSL, TSL.positionLocal, { freq, clock });
      mat.colorNode = brand.blue.mul(pulse.mul(1.4)).add(brand.ice.mul(pulse.pow(6)));
      return { impl: 'native' };
    },
    source: pulseSource,
  },

  'pattern-dissolve': {
    id: 'pattern/dissolve',
    sweep: [{ edgeWidth: 0.05 }, { edgeWidth: 0.1 }, { edgeWidth: 0.2 }],
    apply(TSL, mat, { clock, edgeWidth = 0.1 } = {}) {
      const { brand } = palette(TSL);
      const n = fbm(TSL, TSL.positionLocal.mul(2.6), { octaves: 4 }).mul(0.5).add(0.5);
      const th = TSL.sin(clock.mul(0.9)).mul(0.5).add(0.5).mul(0.7).add(0.1);
      const { alive, edge } = dissolve(TSL, n, th, { edgeWidth });
      mat.transparent = true;
      mat.colorNode = TSL.mix(brand.slate, brand.mist, 0.4)
        .add(brand.gold.mul(edge.mul(2.4)))
        .add(brand.ember.mul(edge.mul(edge).mul(1.6)));
      mat.opacityNode = alive;
      return { impl: 'native' };
    },
    source: dissolveSource,
  },

  'pattern-flicker': {
    id: 'pattern/flicker',
    sweep: [{ depth: 0.2 }, { depth: 0.6 }],
    apply(TSL, mat, { clock, depth = 0.5 } = {}) {
      const { brand, terra } = palette(TSL);
      const phase = TSL.positionLocal.x.mul(8);
      const tw = flicker(TSL, clock, { rate: 2, phase, depth });
      const bolt = flash(TSL, clock, { rate: 3, phase, sharpness: 16, envPhase: TSL.positionLocal.y.mul(3) });
      mat.colorNode = brand.gold.mul(tw).add(terra.bolt.mul(bolt.mul(2)));
      return { impl: 'native' };
    },
    source: flickerSource,
  },

  'pattern-vignette': {
    id: 'pattern/vignette',
    sweep: [{ inner: 0.15 }, { inner: 0.28 }],
    apply(TSL, mat, { inner = 0.28 } = {}) {
      const { brand } = palette(TSL);
      const v = vignette(TSL, TSL.uv().sub(0.5), { inner });
      mat.colorNode = brand.ice.mul(v);
      return { impl: 'native' };
    },
    source: vignetteSource,
  },

  'pattern-spritedisc': {
    id: 'pattern/spriteDisc',
    sweep: [{ core: 0 }, { core: 0.5 }],
    apply(TSL, mat, { core = 0.5 } = {}) {
      const { brand } = palette(TSL);
      const u = TSL.uv();
      const disc = spriteDisc(TSL, u, { core });
      const dia = spriteDiamond(TSL, u);
      const pick = TSL.step(0.5, u.x); // left: disc · right: diamond
      const shape = disc.mul(pick.oneMinus()).add(dia.mul(pick));
      mat.colorNode = brand.gold.mul(shape);
      return { impl: 'native' };
    },
    source: discSource,
  },

  'util-latlon': {
    id: 'util/latlonUv',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{}],
    apply(TSL, mat) {
      const dir = TSL.positionLocal.normalize();
      const uvLL = latlonUv(TSL, dir);
      mat.colorNode = TSL.vec3(uvLL.x, uvLL.y, 0.4);
      return { impl: 'native' };
    },
    source: latlonSource,
  },
};
