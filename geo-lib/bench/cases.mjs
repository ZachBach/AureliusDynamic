/**
 * The bench cases.
 *
 * Each returns { geometry } or { object }, plus a camera distance and an
 * optional look-at. Kept apart from the page so adding a case never means
 * touching the harness.
 */
import { loft, merge, assembly, revolve, tube, roundedBox, normalizeModel }
  from '../src/index.js';

export function buildCases(THREE) {
  const cases = {};

  /* A limb. The comparison to hold in mind is a cylinder: this has an elbow
   * and a taper, and a cylinder can have neither. */
  cases['loft-limb'] = () => ({
    geometry: loft(THREE, [
      { p: [0.00, 1.60, 0.00], rx: 0.34 },
      { p: [0.42, 1.10, 0.10], rx: 0.27 },
      { p: [0.66, 0.42, 0.08], rx: 0.22 },
      { p: [0.60, -0.24, -0.06], rx: 0.19 },
      { p: [0.44, -0.78, -0.18], rx: 0.16 },
    ], { radial: 16, seed: [0, 0, 1] }),
    dist: 4.4,
  });

  /* Drapery. `shape` modulates the radius AROUND each section with a signed
   * power rather than a plain cosine, which gives flat panels separated by
   * sharp valleys — cloth — instead of the fluting a cosine gives.
   *
   * Lobe count and section count are NOT independent: 11 folds against 26
   * segments is under three samples per fold, and the folds vanish entirely
   * into the smooth shading. Four or five segments per lobe is the floor.
   * This case exists mostly to keep that fact discoverable. */
  const drape = (a, t) => {
    const amp = 0.115 * Math.pow(1 - t, 1.35) + 0.01;
    const w = Math.cos(a * 11) * 0.62 + Math.cos(a * 7 + 1.9) * 0.38;
    return 1 + amp * Math.sign(w) * Math.pow(Math.abs(w), 0.6);
  };
  cases['loft-drape'] = () => ({
    geometry: loft(THREE, [
      [0.00, 1.10, 1.00], [0.30, 0.98, 0.89], [0.90, 0.80, 0.72],
      [1.50, 0.64, 0.58], [2.00, 0.53, 0.47], [2.30, 0.50, 0.44],
      [2.70, 0.58, 0.46], [3.00, 0.66, 0.46],
    ].map(([y, rx, ry]) => ({ p: [0, y, 0], rx, ry, shape: drape })),
      { radial: 48, seed: [1, 0, 0] }),
    dist: 6.0,
    at: [0, 1.5, 0],
  });

  /* An open shell over a core — a mantle over a body, which is the actual use.
   *
   * Both edge columns present, no end caps. The two sections at each end turn
   * back INWARD: a shell simply stopped in mid-air shows its open underside as
   * a row of dark slots, and turning the edge under gives it a hem instead.
   *
   * Getting this case to SHOW anything took two goes, and both failures are
   * about rendering rather than geometry. A bare 270-degree shell was
   * indistinguishable from a closed cylinder: same silhouette, and looking
   * into the gap you see the lit inside of the far wall. Adding a core did not
   * fix it either — with everything one colour, an opening you look straight
   * through is still invisible.
   *
   * What works is a HALF shell covering the BACK, so its two free edges land
   * on the left and right of the silhouette where nothing can hide them —
   * angles run +X at zero, -Z at ninety, -X at one-eighty, +Z at two-seventy,
   * so [0, PI] is the back half and the edges sit at +X and -X.
   *
   * Orientation is not a detail in a bench case. A half shell wrapped round
   * the +X side instead is the same geometry and shows nothing at all: the
   * free edges are then dead-on from front and back and hidden behind the
   * body from either side. A case that cannot fail is worse than no case. */
  cases['loft-arc'] = () => {
    const a = assembly(THREE);
    a.part(revolve(THREE, [
      [0.00, 0.30], [0.44, 0.30], [0.38, 1.10], [0.42, 1.90],
      [0.34, 2.30], [0.00, 2.38],
    ], { radial: 26 }), 0, 0, 0);
    a.part(loft(THREE, [
      [2.02, 0.52, 0.46], [1.98, 0.68, 0.58], [1.90, 0.80, 0.66],
      [1.40, 0.86, 0.72], [0.90, 0.82, 0.70], [0.46, 0.92, 0.80],
      [0.38, 0.90, 0.78], [0.34, 0.72, 0.64],
    ].map(([y, rx, ry]) => ({
      p: [0, y, 0], rx, ry,
      shape: (ang) => 1 + 0.04 * Math.cos(ang * 8),
    })), { radial: 30, seed: [1, 0, 0], arc: [0, Math.PI] }),
      0, 0, 0);
    return { geometry: a.geometry(), dist: 5.2, at: [0, 1.2, 0] };
  };

  /* Roll. The frame turns about the tangent as it travels, which is how a
   * twist happens without the section itself changing. */
  cases['loft-roll'] = () => {
    const spine = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      spine.push({ p: [0, t * 3, 0], rx: 0.46, ry: 0.14, roll: t * Math.PI * 1.5 });
    }
    return {
      geometry: loft(THREE, spine, { radial: 20, seed: [1, 0, 0] }),
      dist: 5.0, at: [0, 1.5, 0],
    };
  };

  /* A repeated Y value in a profile is a flange, and it has to survive. An
   * earlier loft dropped co-located sections as duplicates and quietly
   * deleted them. The step near the base is the assertion. */
  cases['revolve-flange'] = () => ({
    geometry: revolve(THREE, [
      [0.00, 0.00], [0.62, 0.00], [0.62, 0.14], [0.34, 0.14],
      [0.30, 0.30], [0.26, 1.05], [0.44, 1.22], [0.52, 1.60],
      [0.50, 1.72], [0.00, 1.74],
    ], { radial: 30 }),
    dist: 3.6, at: [0, 0.85, 0],
  });

  /* Radius as a function of path position. A constant radius reads as a pipe. */
  cases['tube-taper'] = () => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([Math.sin(t * 5.2) * 1.1, t * 2.6 - 1.3, Math.cos(t * 5.2) * 1.1]);
    }
    return {
      geometry: tube(THREE, pts, (t) => 0.22 * (1 - t) + 0.03, { radial: 12 }),
      dist: 6.4,
    };
  };

  /* Left: a real chamfer. Right: almost none. The highlight running along
   * every edge of the left one is the entire point of the builder. */
  cases['rounded-box'] = () => {
    const a = assembly(THREE);
    a.part(roundedBox(THREE, 1.6, 1.6, 1.6, 0.18, 5), -1.1, 0, 0);
    a.part(roundedBox(THREE, 1.6, 1.6, 1.6, 0.005, 5), 1.1, 0, 0);
    return { geometry: a.geometry(), dist: 7.8 };
  };

  /* The assembly doing what it is for: many pieces, one draw call. Also
   * exercises inFrame — the wings are authored FLAT IN XY and swept back as
   * one piece, which is the only way a surface made of many flat pieces stays
   * a surface. Rotate each piece individually from world axes instead and the
   * plumage turns edge-on and renders as a handful of threads. */
  cases['assembly-figure'] = () => {
    const a = assembly(THREE);
    a.part(revolve(THREE, [
      [0.00, 0.00], [0.72, 0.00], [0.60, 0.55], [0.42, 1.30],
      [0.34, 1.70], [0.44, 2.05], [0.40, 2.25], [0.16, 2.42],
    ], { radial: 26 }), 0, 0, 0);
    a.part(new THREE.SphereGeometry(0.24, 14, 10), 0, 2.66, 0, null, [1, 1.14, 1.05]);

    for (const s of [-1, 1]) {
      const frame = new THREE.Matrix4().makeRotationY(s * 0.46);
      frame.premultiply(new THREE.Matrix4().makeTranslation(0, 2.15, -0.22));
      a.inFrame(frame, () => {
        const LEx = (t) => s * (0.34 + 1.30 * Math.sin(t * 1.34));
        const LEy = (t) => 0.02 + 2.10 * Math.pow(t, 0.86);
        for (let i = 0; i < 9; i++) {
          const f = i / 8, t = 0.30 + 0.70 * f;
          const feather = tube(THREE,
            [[0, 0, 0], [0.55, 0, 0], [1.10, -0.04, 0], [1.55, -0.10, 0]],
            (u) => 0.03 + 0.10 * Math.sin(Math.pow(u, 0.45) * Math.PI * 0.88),
            { radial: 8, seed: [0, 0, 1] });
          a.along(feather, [LEx(t), LEy(t), 0], [s * (0.1 + 0.45 * f), -1, 0]);
        }
      });
    }
    return { geometry: a.geometry(), dist: 9.6, at: [0, 1.7, 0] };
  };

  /* merge, on inputs that differ in every way it has to tolerate: indexed and
   * non-indexed side by side, three different primitive types. */
  cases['merge-mixed'] = () => {
    const parts = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      let g = i % 3 === 0 ? new THREE.BoxGeometry(0.5, 0.5, 0.5)
        : i % 3 === 1 ? new THREE.SphereGeometry(0.3, 12, 8)
          : new THREE.ConeGeometry(0.3, 0.7, 10);
      if (i % 4 === 0) g = g.toNonIndexed();
      g.translate(Math.cos(a) * 1.5, Math.sin(i * 1.7) * 0.5, Math.sin(a) * 1.5);
      parts.push(g);
    }
    return { geometry: merge(THREE, parts), dist: 8.2 };
  };

  /* normalizeModel, without needing a file. The input is deliberately
   * horrible — off-centre, wrong scale, facing backwards — which is what
   * actually arrives from an exporter. It should come out standing ON the
   * slab, centred, exactly 2.4 tall. */
  cases['normalize'] = () => {
    const bad = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(40, 90, 25));
    m.position.set(300, 900, -120);
    bad.add(m);
    const m2 = new THREE.Mesh(new THREE.SphereGeometry(28, 12, 10));
    m2.position.set(300, 975, -120);
    bad.add(m2);
    bad.scale.setScalar(0.4);

    const fitted = normalizeModel(THREE, bad, { height: 2.4, turn: Math.PI, target: [0, 0, 0] });
    const out = new THREE.Group();
    out.add(fitted);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 3.2));
    slab.position.y = -0.05;
    out.add(slab);

    /* The one case here where a number beats a picture. "Standing on the slab,
     * centred, 2.4 tall" is exactly checkable, and a render only shows it to
     * within however carefully you are squinting. */
    return {
      object: out, dist: 6.0, at: [0, 1.0, 0],
      check() {
        fitted.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(fitted);
        const bad2 = [];
        const near = (a, b2, tol) => Math.abs(a - b2) < tol;
        if (!near(b.max.y - b.min.y, 2.4, 1e-3)) bad2.push(`height ${(b.max.y - b.min.y).toFixed(4)}`);
        if (!near(b.min.y, 0, 1e-3)) bad2.push(`base y ${b.min.y.toFixed(4)}`);
        if (!near((b.min.x + b.max.x) / 2, 0, 1e-3)) bad2.push(`centre x ${((b.min.x + b.max.x) / 2).toFixed(4)}`);
        if (!near((b.min.z + b.max.z) / 2, 0, 1e-3)) bad2.push(`centre z ${((b.min.z + b.max.z) / 2).toFixed(4)}`);
        return bad2.length ? bad2.join(', ') : null;
      },
    };
  };

  return cases;
}
