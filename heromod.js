/* Aurelius hero (vanilla build) — imports vendored three.webgpu; full WebGPU/TSL
   choreography incl. El-Sol shader sun + live weather. Removes itself on failure. */
/* Aurelius hero — WebGPU/TSL electromagnetic helix field.
   Particles spring-assemble into a twin-strand helix; compute pass runs on
   WebGPU, transparently falling back to WebGL2. Removes itself on any failure
   so the CSS hero underneath always stands alone. */
(async () => {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const waitFor = (fn, tries) => new Promise((res) => {
    const tick = (n) => { const v = fn(); if (v || n <= 0) res(v); else requestAnimationFrame(() => tick(n - 1)); };
    tick(tries || 600);
  });

  const findHost = () => document.querySelector('[data-fxhost]') || document.getElementById('hero');
  let hero = await waitFor(findHost);
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('data-fx', 'helix');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;' +
    'opacity:0;transition:opacity 1.4s ease;' +
    '-webkit-mask-image:radial-gradient(120% 105% at 50% 42%,#000 55%,transparent 99%);' +
    'mask-image:radial-gradient(120% 105% at 50% 42%,#000 55%,transparent 99%)';
  hero.appendChild(canvas);

  const label = document.createElement('div');
  label.setAttribute('data-hud', '1');
  label.setAttribute('data-hudlabel', '1');
  label.style.cssText = "position:absolute;bottom:32px;left:64px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.18em;color:rgba(154,167,188,.6);z-index:2";

  try {
    const THREE = await import('./vendor/three.webgpu.min.js');
    const { Fn, If, uniform, float, vec3, instancedArray, instanceIndex, hash,
            time, deltaTime, sin, cos, step, uv, smoothstep, mix, color, exp, vec4, modelViewMatrix,
            vec2, texture, asin, atan,
            positionLocal, positionWorld, normalWorld, cameraPosition, mx_fractal_noise_float } = THREE.TSL;

    const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    await renderer.init();
    const isWebGPU = !!(renderer.backend && renderer.backend.isWebGPUBackend);

    // density scales with viewport; ceilings protect fill-rate-bound targets:
    // 500k needs WebGPU on a desktop; the WebGL2 backend's transform-feedback
    // compute holds ~100k comfortably, and phones (additive overdraw + battery)
    // cap at 20k. Per-sprite brightness/size auto-scale with COUNT below, so a
    // richer WebGL2 field stays luminance-balanced without extra tuning.
    // Re-resolve the host first: the dc-runtime may have swapped the subtree
    // while three.js loaded, and a detached node reads clientWidth 0 → floor count.
    hero = findHost() || hero;
    if (!canvas.isConnected) hero.appendChild(canvas);
    const area = Math.max(hero.clientWidth * hero.clientHeight,
      window.innerWidth * window.innerHeight * 0.8, 1);
    const isMobile = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      Math.min(window.innerWidth, window.innerHeight) < 700;
    let ceiling = 500000;
    if (!isWebGPU) ceiling = 100000;
    if (isMobile) ceiling = Math.min(ceiling, 20000);
    let COUNT = Math.min(ceiling, Math.max(8000, Math.round(area / 3)));
    if ((navigator.hardwareConcurrency || 8) <= 4) COUNT = Math.round(COUNT * 0.6);
    canvas.dataset.particles = COUNT;
    console.info('[helix-fx] ' + COUNT + ' particles · ' + (isWebGPU ? 'webgpu' : 'webgl2') + (isMobile ? ' · mobile' : ''));

    // keep aggregate luminance steady as density scales: dimmer, smaller
    // sprites at 500k; full size and brightness down at mobile counts
    const DIM = Math.max(0.22, Math.min(0.6, 0.6 * Math.sqrt(100000 / COUNT)));
    const SIZ = Math.max(0.6, Math.min(1, Math.pow(100000 / COUNT, 0.25)));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 200);
    camera.position.set(0, 0, 38);

    const group = new THREE.Group();
    group.rotation.z = -0.10;
    scene.add(group);

    const LEN = 46, RAD = 5.2, TURNS = 5.0;
    const positions = instancedArray(COUNT, 'vec3');
    const velocities = instancedArray(COUNT, 'vec3');

    const uIntro = uniform(0);
    const uDim = uniform(1); // scroll-linked: field recedes as the pitch scrolls over it
    const uPointer = uniform(new THREE.Vector3(0, 0, 0));
    const uPointerActive = uniform(0);
    const uDyson = uniform(0); // finale: helix dissolves into twin Dyson swarms
    const uSunL = uniform(new THREE.Vector3(34, 15, -50));   // body centers in group space
    const uEarthL = uniform(new THREE.Vector3(-34, 11, -48));

    // Terra: live-weather storm map — a small equirectangular texture whose red
    // channel is storm intensity by lat/lon, painted from Open-Meteo (loadStorms
    // below). uStormMix ramps 0→1 once real data lands; until then storms stay
    // procedural, so the field never depends on the network.
    const STORM_W = 128, STORM_H = 64;
    const stormImg = new Uint8Array(STORM_W * STORM_H * 4);
    const stormTexture = new THREE.DataTexture(stormImg, STORM_W, STORM_H, THREE.RGBAFormat);
    stormTexture.wrapS = THREE.RepeatWrapping;
    stormTexture.minFilter = THREE.LinearFilter;
    stormTexture.magFilter = THREE.LinearFilter;
    stormTexture.needsUpdate = true;
    const uStormMix = uniform(0);

    // scatter far out; the spring assembles the helix on load
    const computeInit = Fn(() => {
      const p = positions.element(instanceIndex);
      const v = velocities.element(instanceIndex);
      const h1 = hash(instanceIndex);
      const h2 = hash(instanceIndex.add(91));
      const h3 = hash(instanceIndex.add(517));
      const th = h1.mul(Math.PI * 2);
      const ph = h2.mul(Math.PI).sub(Math.PI / 2);
      const rr = h3.mul(26).add(16);
      p.assign(vec3(cos(th).mul(cos(ph)).mul(rr), sin(ph).mul(rr).mul(0.6), sin(th).mul(cos(ph)).mul(rr)));
      v.assign(vec3(0, 0, 0));
    })().compute(COUNT);

    const computeUpdate = Fn(() => {
      const p = positions.element(instanceIndex);
      const v = velocities.element(instanceIndex);

      const u = hash(instanceIndex);
      const hStrand = hash(instanceIndex.add(1234));
      const hJit = hash(instanceIndex.add(7777));
      const hSpd = hash(instanceIndex.add(31337));

      const s04 = step(0.42, hStrand);
      const s08 = step(0.84, hStrand);
      const isB = s04.sub(s08);       // strand B
      const isCloud = s08;            // ambient field
      const isStrand = isCloud.oneMinus();

      const drift = time.mul(hSpd.mul(0.1).add(0.22));
      const angle = u.mul(Math.PI * 2 * TURNS).add(drift).add(isB.mul(Math.PI));
      const axisX = u.sub(0.5).mul(LEN);
      const rS = float(RAD).mul(hJit.sub(0.5).mul(0.18).add(1));
      const strandT = vec3(axisX, cos(angle).mul(rS), sin(angle).mul(rS));

      const ca = angle.mul(0.45).add(hJit.mul(Math.PI * 2));
      const rC = float(RAD).mul(hJit.mul(2.1).add(1.5));
      const cloudT = vec3(axisX.mul(1.12), cos(ca).mul(rC).mul(0.85), sin(ca).mul(rC));

      // finale target: half the field swarms the sun, half the earth, on
      // shells of mixed radii and speeds — a pair of glimmering Dyson swarms
      const dPick = step(0.5, hash(instanceIndex.add(2468)));
      const dC = mix(uEarthL, uSunL, dPick);
      const dy = hJit.mul(2).sub(1).mul(0.96);
      const dss = dy.mul(dy).oneMinus().max(0.0001).sqrt();
      const dth = u.mul(Math.PI * 2).add(time.mul(hSpd.mul(0.2).add(0.15)));
      const ddir = vec3(cos(dth).mul(dss), dy, sin(dth).mul(dss));
      const dR = dPick.mul(1.5).add(8.2).add(hJit.mul(3.6));
      const dTarget = dC.add(ddir.mul(dR));

      const target = mix(strandT.mul(isStrand).add(cloudT.mul(isCloud)), dTarget, uDyson);

      const spring = target.sub(p).mul(isStrand.mul(1.6).add(0.8));

      const t2 = time.mul(0.55);
      const turbAmp = isCloud.mul(1.9).add(0.55).mul(uDyson.mul(-0.7).add(1));
      const turb = vec3(
        sin(p.y.mul(0.55).add(t2)).add(sin(p.z.mul(0.82).add(t2.mul(0.7)))),
        sin(p.z.mul(0.62).add(t2.mul(0.9))).add(sin(p.x.mul(0.74))),
        sin(p.x.mul(0.51).add(t2.mul(1.1))).add(sin(p.y.mul(0.9)))
      ).mul(turbAmp);

      const dm = p.sub(uPointer);
      const md2 = dm.dot(dm).add(1.5);
      const mouseF = dm.div(md2.mul(md2.sqrt())).mul(uPointerActive.mul(260));

      // finale — the sun's Dyson shell CAPTURES each CME. The eruption's shock
      // front (same 14s cycle as the sun sprite) sweeps outward through the
      // swarm; where it crosses, sun-bound particles get buffeted radially out
      // and the speed spike flares them via the heat term — then the spring
      // pulls the shell shut again: the swarm catching and harvesting the plasma.
      const toSun = p.sub(uSunL);
      const rSun = toSun.length().max(0.001);
      const pc = time.add(7).div(14).fract();
      const cmeR = float(5.85).add(pc.pow(1.5).mul(58));            // CME front radius from sun centre
      const cmeLive = smoothstep(0.02, 0.09, pc).mul(smoothstep(0.72, 0.30, pc));
      const shockBand = smoothstep(1.9, 0.0, rSun.sub(cmeR).abs()); // thin shell riding the front
      const capture = shockBand.mul(cmeLive).mul(dPick).mul(uDyson.mul(uDyson));
      const shockF = toSun.div(rSun).mul(capture.mul(14.0));

      const dt = deltaTime.min(1 / 30);
      v.assign(v.add(spring.add(turb).add(mouseF).add(shockF).mul(dt)).mul(exp(dt.mul(-2.2))));
      p.assign(p.add(v.mul(dt)));
    })().compute(COUNT);

    const material = new THREE.SpriteNodeMaterial();
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.depthTest = false;

    {
      const hStrand = hash(instanceIndex.add(1234));
      const hJit = hash(instanceIndex.add(7777));
      const hCry = hash(instanceIndex.add(4242));
      const s04 = step(0.42, hStrand);
      const s08 = step(0.84, hStrand);
      const isA = s04.oneMinus();
      const isB = s04.sub(s08);
      const isCloud = s08;
      const isCry = step(0.88, hCry); // ~12% ride the field as crystal facets

      const vel = velocities.toAttribute();
      const speed = vel.length();

      const gold = color(0xF4C95D), cyan = color(0x57D4FF), blue = color(0x2B6CF6), ice = color(0xEAF7FF);
      const base = gold.mul(isA).add(cyan.mul(isB)).add(blue.mul(isCloud));
      const heat = smoothstep(2.0, 9.0, speed);
      // finale: warm the sun-bound half, cool the earth-bound half (dPick matches
      // the compute pass) so the twin Dyson shells read as two distinct suns
      const dPick = step(0.5, hash(instanceIndex.add(2468)));
      const swarmTint = mix(color(0x59D6FF), color(0xFFB552), dPick);
      const lit = mix(mix(base, color(0xFFFFFF), heat.mul(0.35)), ice, isCry.mul(0.85));
      material.positionNode = positions.toAttribute();
      material.colorNode = mix(lit, swarmTint, uDyson.mul(0.55))
        .mul(isCloud.mul(-0.45).add(1)).mul(isCry.mul(0.5).add(1));
      material.scaleNode = hJit.mul(0.14 * SIZ).add(0.085 * SIZ).add(isCloud.mul(0.05 * SIZ)).add(heat.mul(0.07 * SIZ)).add(isCry.mul(0.09 * SIZ));

      const q = uv().sub(0.5);
      const d = q.length();
      const circle = smoothstep(0.5, 0.08, d);
      // hot pinpoint core so sprites glint like stars, not soft blobs; scaled by
      // DIM so the dense (500k WebGPU) field keeps the luminance the low-count
      // WebGL2 field gets at full strength
      const soft = circle.mul(circle).add(circle.pow(7).mul(0.5 * DIM));
      const twinkle = sin(time.mul(hJit.mul(2).add(0.8)).add(hStrand.mul(40))).mul(0.25).add(0.75);
      // crystals are hard-edged diamonds that glint instead of twinkle
      const dia = q.x.abs().add(q.y.abs());
      const facet = smoothstep(0.46, 0.03, dia);
      const glint = sin(time.mul(hJit.mul(1.6).add(0.5)).add(hCry.mul(60))).mul(0.5).add(0.5);
      const crystal = facet.mul(facet).mul(glint.mul(glint).mul(1.5).add(0.15));
      // denser field → dimmer individual sprites, or additive overlap clips white;
      // near-fade keeps sprites from flaring when the camera rides inside the bore
      // (instance depth via modelViewMatrix — positionView skips the sprite billboard path)
      const instDepth = modelViewMatrix.mul(vec4(positions.toAttribute().xyz, 1)).z.negate();
      material.opacityNode = mix(soft.mul(twinkle), crystal, isCry)
        .mul(isCloud.mul(-0.62).add(1))
        .mul(smoothstep(0.6, 4.0, instDepth))
        .mul(uIntro).mul(uDim).mul(DIM);
    }

    const particles = new THREE.Sprite(material);
    particles.count = COUNT;
    particles.frustumCulled = false;
    group.add(particles);

    // ---- sun (right) and earth (left) flank the reactor; both are scene-space
    // (not in group) so the helix tunnel move doesn't drag them, and both are
    // pure functions of time — no extra compute passes. They trade sides on a
    // timed half-orbit glide (see frame()).
    const SUN_COUNT = Math.round(Math.min(40000, Math.max(4000, COUNT * 0.08)));
    const SDIM = Math.max(0.25, Math.min(0.8, 0.8 * Math.sqrt(9000 / SUN_COUNT)));
    const uSunPos = uniform(new THREE.Vector3(34, 15, -50));

    const sunMat = new THREE.SpriteNodeMaterial();
    sunMat.transparent = true;
    sunMat.blending = THREE.AdditiveBlending;
    sunMat.depthWrite = false;
    sunMat.depthTest = false;

    {
      const R = 6.5, T = 14, CL = 58;
      const ax = new THREE.Vector3(0.62, 0.40, 0.30).normalize();
      const b1 = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize();
      const b2 = new THREE.Vector3().crossVectors(b1, ax).normalize();
      const A = vec3(ax.x, ax.y, ax.z), B1 = vec3(b1.x, b1.y, b1.z), B2 = vec3(b2.x, b2.y, b2.z);

      const h1 = hash(instanceIndex.add(11));
      const h2 = hash(instanceIndex.add(211));
      const h3 = hash(instanceIndex.add(3111));
      const h4 = hash(instanceIndex.add(41111));

      const isCME = step(0.80, h4);
      const isProm = step(0.70, h4).sub(isCME);   // prominence loops on the limb
      const isCorona = step(0.55, h4).sub(step(0.70, h4));
      const isBody = step(0.55, h4).oneMinus();

      // body/corona: sphere point with slow differential swirl and a breath
      const sy = h2.mul(2).sub(1);
      const ss = sy.mul(sy).oneMinus().max(0.0001).sqrt();
      const th = h1.mul(Math.PI * 2).add(time.mul(h3.mul(0.05).add(0.03)));
      const dir = vec3(cos(th).mul(ss), sy, sin(th).mul(ss));
      const breath = sin(time.mul(0.6).add(h1.mul(9))).mul(0.02).add(1);
      const rBody = float(R).mul(h3.pow(0.45)).mul(breath);
      // corona hugs the sun then streams out; streamers slowly precess with th
      const rCor = float(R).mul(h3.pow(1.6).mul(1.8).add(1.02));
      const streak = sin(th.mul(3)).abs().pow(2).mul(0.85).add(0.35);
      const rBC = rBody.mul(isBody).add(rCor.mul(isCorona));

      // prominences: ~5 anchored loop arcs that rise, sway, and fade in/out
      const site = h1.mul(5).floor();
      const sa = site.mul(2.399).add(0.7);
      const st = sin(site.mul(1.3)).mul(0.55);
      const ct = st.mul(st).oneMinus().sqrt();
      const Da = vec3(cos(sa).mul(ct), st, sin(sa).mul(ct));
      const Ta = vec3(sin(sa).negate(), 0, cos(sa));
      const phi = h3.mul(Math.PI).add(sin(time.mul(0.3).add(site)).mul(0.15));
      const loopH = float(R).mul(sin(site.mul(3.7)).mul(0.15).add(0.44));
      // fuzzy plasma: scatter each strand in 3D so a loop reads as glowing gas
      // rather than a thin wire, and keep the arcs small so they sit on the limb
      const fuzz = vec3(h2.sub(0.5), hash(instanceIndex.add(777)).sub(0.5), hash(instanceIndex.add(888)).sub(0.5)).mul(R * 0.28);
      const ppos = Da.mul(float(R).mul(0.99).add(sin(phi).mul(loopH)))
        .add(Ta.mul(cos(phi).mul(R * 0.42))).add(fuzz);
      const promAct = sin(time.mul(0.11).add(site.mul(2.1))).max(0);

      // CME: a twisting flux rope bursts off the limb — the strands wind
      // helically around the eruption axis as the shell expands and curls
      // sideways, led by a bright compressed shock front (h1≈1) ahead of the
      // slower, cooler trailing ejecta
      const p = time.add(7).div(T).fract();
      const pe = p.pow(1.5);
      const alpha = h2.mul(0.52);
      // flux-rope twist: the whole rope winds as it flies, and each strand's
      // distance from the axis ripples helically for a braided-tube look
      const az = h3.mul(Math.PI * 2).add(pe.mul(5.5));
      const rope = sin(pe.mul(Math.PI * 3.5).add(h3.mul(Math.PI * 2))).mul(0.22).add(1);
      const cdir = A.mul(cos(alpha)).add(B1.mul(cos(az)).add(B2.mul(sin(az))).mul(sin(alpha).mul(rope)));
      const lead = h1.mul(0.34).add(0.82);              // front-to-back spread; h1≈1 rides the shock
      const rC = float(R).mul(0.9).add(pe.mul(CL).mul(lead));
      const cpos = cdir.mul(rC).add(B2.mul(pe.mul(pe).mul(8.5)));
      const ring = smoothstep(0.22, 0.6, alpha).mul(0.8).add(0.45);
      const shock = smoothstep(1.0, 1.16, lead);        // leading shock sheath, whitest at the very front

      const local = dir.mul(rBC).mul(isBody.add(isCorona))
        .add(ppos.mul(isProm)).add(cpos.mul(isCME));
      sunMat.positionNode = uSunPos.add(local);

      const rN = rBC.div(R);
      // photosphere granulation: slow overlapping convective cells mottle the
      // surface so it reads as roiling plasma rather than a flat glow
      const gran = sin(dir.x.mul(15).add(time.mul(0.25))).mul(sin(dir.y.mul(17)))
        .add(sin(dir.z.mul(19).sub(time.mul(0.18))).mul(sin(dir.x.mul(13)))).mul(0.5).add(0.5);
      const hot = color(0xFFF2C9), midc = color(0xFFC24D), limb = color(0xFF7A1A), ember = color(0xFF5A28);
      const bodyCol = mix(hot, mix(midc, limb, smoothstep(0.55, 1.0, rN)), smoothstep(0.12, 0.75, rN))
        .mul(gran.mul(0.28).add(0.86));   // hotter granules brighten, cool lanes darken
      const cmeCol = mix(color(0xFFF3D6), color(0xFF7A24), smoothstep(0.02, 0.45, p))
        .add(color(0xFFFFFF).mul(shock.mul(0.5)));
      sunMat.colorNode = bodyCol.mul(isBody.add(isCorona)).mul(isCorona.mul(-0.55).add(1))
        .add(ember.mul(isProm.mul(1.25))).add(cmeCol.mul(isCME));

      sunMat.scaleNode = h1.mul(0.12).add(0.10)
        .add(isCorona.mul(h2.mul(0.16).add(0.06)))
        .add(isProm.mul(h2.mul(0.08).add(0.03)))
        .add(isCME.mul(pe.mul(0.16).add(0.04).add(shock.mul(0.06))));

      const q2 = uv().sub(0.5);
      const cir = smoothstep(0.5, 0.06, q2.length());
      const flick = sin(time.mul(h2.mul(3).add(1)).add(h1.mul(50))).mul(0.2).add(0.8);
      const limbFade = rN.mul(rN).mul(0.68).oneMinus();
      const bodyOp = limbFade.mul(gran.mul(0.5).add(0.6)).mul(isBody).mul(0.2).add(isCorona.mul(streak).mul(0.16));
      const promOp = isProm.mul(promAct).mul(0.42);
      // gate the cycle so a mid-flight remnant never shows at page load
      const cmeOp = smoothstep(0.0, 0.05, p).mul(smoothstep(0.95, 0.5, p))
        .mul(ring.add(shock.mul(1.4))).mul(1.2)
        .mul(smoothstep(6, 9, time));
      sunMat.opacityNode = cir.mul(cir).mul(flick)
        .mul(bodyOp.add(promOp).add(cmeOp.mul(isCME)))
        .mul(uIntro).mul(uDim.mul(0.7).add(0.3)).mul(SDIM);
    }

    const sun = new THREE.Sprite(sunMat);
    sun.count = SUN_COUNT;
    sun.frustumCulled = false;
    scene.add(sun);

    // El-Sol shader sun BODY — a plasma sphere (fbm-noise surface + fresnel
    // corona, ported from El-Sol's GLSL to TSL) beneath the particle corona,
    // prominences and CME. Tracks uSunPos each frame (see frame()).
    const sunBodyMat = new THREE.MeshBasicNodeMaterial();
    sunBodyMat.transparent = true;
    {
      const pd = positionLocal.normalize();
      const tt = time.mul(0.12);
      const n1 = mx_fractal_noise_float(pd.mul(2.8).add(vec3(tt, 0, 0)), 5, 2, 0.5);
      const n2 = mx_fractal_noise_float(pd.mul(5.2).sub(vec3(0, tt.mul(0.8), 0)), 4, 2, 0.5);
      const nz = n1.mul(0.6).add(n2.mul(0.4));
      const bright = nz.mul(3.4).add(1.15).max(0.28);   // lower baseline = redder/higher-contrast plasma; clamp keeps cool lanes dark-red not green
      const ramp = (x) => { const b = x.mul(0.25).max(0.0); return vec3(b, b.mul(b), b.mul(b).mul(b).mul(b)).mul(4).mul(0.6); };
      const eye = cameraPosition.sub(positionWorld).normalize();
      const fres = float(1).sub(eye.dot(normalWorld).max(0)).pow(3);
      sunBodyMat.colorNode = ramp(bright).add(ramp(fres.mul(4)).mul(vec3(1, 0.55, 0.25)));
      sunBodyMat.opacityNode = uIntro.mul(uDim.mul(0.7).add(0.3));
    }
    const sunBody = new THREE.Mesh(new THREE.SphereGeometry(6.5, 48, 48), sunBodyMat);
    sunBody.frustumCulled = false;
    scene.add(sunBody);

    // ---- earth: particle globe with procedural continents, a faster-drifting
    // clumpy cloud shell, and storm cells that flash lightning
    const EARTH_COUNT = Math.round(Math.min(36000, Math.max(4000, COUNT * 0.075)));
    const EDIM = Math.max(0.35, Math.min(1.1, 1.1 * Math.sqrt(9000 / EARTH_COUNT)));
    const uEarthPos = uniform(new THREE.Vector3(-34, 11, -48));

    const earthMat = new THREE.SpriteNodeMaterial();
    earthMat.transparent = true;
    earthMat.blending = THREE.AdditiveBlending;
    earthMat.depthWrite = false;
    earthMat.depthTest = false;

    {
      const R = 5.6;
      const h1 = hash(instanceIndex.add(53));
      const h2 = hash(instanceIndex.add(523));
      const h3 = hash(instanceIndex.add(5231));
      const h4 = hash(instanceIndex.add(52311));

      const isStorm = step(0.86, h4);                    // flashing storm layer (denser — ~14% of the globe)
      const isAtmo = step(0.76, h4).sub(isStorm);        // rim-glow atmosphere
      const isCloudE = step(0.60, h4).sub(step(0.76, h4)); // cloud shell
      const isSurf = step(0.60, h4).oneMinus();          // ocean + continents

      // fixed body-frame point on the sphere; continents stay glued to it
      const ey = h2.mul(2).sub(1);
      const es = ey.mul(ey).oneMinus().max(0.0001).sqrt();
      const eth = h1.mul(Math.PI * 2);
      const bdir = vec3(cos(eth).mul(es), ey, sin(eth).mul(es));

      // low-frequency noise over the body frame carves the continents
      const n = sin(bdir.x.mul(3.1).add(1.7)).mul(sin(bdir.y.mul(2.3).sub(0.4)))
        .add(sin(bdir.y.mul(3.7).add(0.6)).mul(sin(bdir.z.mul(2.9).add(2.1))))
        .add(sin(bdir.z.mul(2.2).add(4.2)).mul(sin(bdir.x.mul(3.4))));
      const land = smoothstep(0.15, 0.55, n.mul(0.33));

      // spin the rendered position; clouds ride a faster lane
      const spin = time.mul(isCloudE.mul(0.05).add(0.10));
      const scs = cos(spin), sns = sin(spin);
      const rdir = vec3(bdir.x.mul(scs).add(bdir.z.mul(sns)), bdir.y,
                        bdir.z.mul(scs).sub(bdir.x.mul(sns)));
      const rr = float(R).mul(isSurf)
        .add(float(R * 1.07).mul(isCloudE))
        .add(float(R).mul(h3.mul(0.06).add(1.08)).mul(isAtmo))
        .add(float(R * 1.03).mul(isStorm));
      earthMat.positionNode = uEarthPos.add(rdir.mul(rr));

      // sunlight: lit hemisphere tracks the actual sun as the bodies orbit
      const L = uSunPos.sub(uEarthPos).normalize();
      const day = rdir.dot(L);
      const dayShade = smoothstep(-0.15, 0.4, day).mul(0.82).add(0.18);
      const night = smoothstep(0.05, -0.3, day);
      // rim glow strongest at the silhouette (view is along z)
      const rim = rdir.z.abs().oneMinus();

      const ocean = color(0x2E6BF0), landc = color(0x27C08A), cloudc = color(0xEAF3FF),
            boltc = color(0xBFD9FF), atmoc = color(0x7FD4FF), cityc = color(0xFFC97A);
      const cityFlick = sin(time.mul(h3.mul(2).add(0.6)).add(h1.mul(30))).mul(0.15).add(0.85);
      const iceCap = smoothstep(0.80, 0.96, bdir.y.abs());   // polar ice at high latitudes
      const surfCol = mix(mix(ocean, landc, land), color(0xE9F3FF), iceCap.mul(0.92)).mul(dayShade)
        .add(cityc.mul(land).mul(night).mul(cityFlick).mul(0.6));
      const cloudCol = cloudc.mul(smoothstep(-0.25, 0.3, day).mul(0.8).add(0.2));
      earthMat.colorNode = surfCol.mul(isSurf).add(cloudCol.mul(isCloudE))
        .add(atmoc.mul(isAtmo)).add(boltc.mul(isStorm.mul(2.1)));

      // clumpy clouds that slowly morph
      const cn = sin(bdir.x.mul(4.3).add(time.mul(0.05))).mul(sin(bdir.y.mul(3.9).add(1.3)))
        .add(sin(bdir.z.mul(4.7).add(time.mul(0.04))));
      const cloudMask = smoothstep(0.25, 0.8, cn.mul(0.5));

      // storms live in sparse cells; each bolt is a rare sharp flash inside a
      // waxing/waning envelope so whole storms light up then go quiet —
      // and they read brightest on the night side, like real lightning
      const snz = sin(bdir.x.mul(6.3).add(2.2)).mul(sin(bdir.y.mul(5.7).sub(1.1))).mul(sin(bdir.z.mul(6.6).add(0.7)));
      const cell = smoothstep(0.4, 0.72, snz.abs());
      // envelope never fully quiets, so several storm systems always simmer while
      // others wax to full fury; softer flash exponent = flashes read longer
      const envl = sin(time.mul(0.26).add(h2.mul(6))).max(0).mul(0.72).add(0.28);
      const flash = sin(time.mul(h3.mul(4).add(2.6)).add(h1.mul(80))).max(0).pow(16).mul(envl)
        .mul(night.mul(0.8).add(0.55));

      // real-weather storms: sample the live storm map by the FIXED body-frame
      // lat/lon (bdir) so cells sit over their true geographic location while
      // Terra spins. Blends in only once live data has loaded (uStormMix 0→1);
      // before that, the procedural `cell` field carries the storms.
      const slat = asin(bdir.y);
      const slon = atan(bdir.z, bdir.x); // 2-arg atan = atan2
      const suv = vec2(slon.mul(1 / (Math.PI * 2)).add(0.5), slat.mul(1 / Math.PI).add(0.5));
      const stormData = texture(stormTexture, suv).r;
      const stormMask = mix(cell, stormData.mul(1.4), uStormMix);

      earthMat.scaleNode = h1.mul(0.12).add(0.12)
        .add(isCloudE.mul(h2.mul(0.14).add(0.07)))
        .add(isAtmo.mul(h2.mul(0.10).add(0.05)))
        .add(isStorm.mul(flash.mul(0.45).add(0.02)));

      const qe = uv().sub(0.5);
      const cire = smoothstep(0.5, 0.06, qe.length());
      earthMat.opacityNode = cire.mul(cire)
        .mul(isSurf.mul(land.mul(0.25).add(0.75))
          .add(isCloudE.mul(cloudMask).mul(0.6))
          .add(isAtmo.mul(rim).mul(rim).mul(0.55))
          .add(isStorm.mul(stormMask).mul(flash).mul(4.8)))
        .mul(uIntro).mul(uDim.mul(0.7).add(0.3)).mul(EDIM);
    }

    const earth = new THREE.Sprite(earthMat);
    earth.count = EARTH_COUNT;
    earth.frustumCulled = false;
    scene.add(earth);

    await renderer.computeAsync(computeInit);

    // Terra: pull live global weather (Open-Meteo, no key) and paint the storm
    // map. This is the hero's one deliberate external request; any failure
    // silently leaves uStormMix at 0 so the field falls back to procedural storms.
    const loadStorms = async () => {
      try {
        const lats = [], lons = [];
        for (let la = -60; la <= 60; la += 12)
          for (let lo = -180; lo < 180; lo += 12) { lats.push(la); lons.push(lo); }
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' +
          lats.join(',') + '&longitude=' + lons.join(',') +
          '&current=weather_code,precipitation,wind_speed_10m');
        if (!res.ok) return;
        const arr = await res.json();
        const acc = new Float32Array(STORM_W * STORM_H);
        for (let i = 0; i < arr.length; i++) {
          const c = arr[i].current || {};
          const code = c.weather_code || 0, precip = c.precipitation || 0, wind = c.wind_speed_10m || 0;
          let inten = code >= 95 ? 1 : (code >= 80 && code <= 82 ? 0.65 : (code >= 61 && code <= 67 ? 0.5 : 0));
          inten = Math.max(inten, Math.min(1, precip * 0.4), Math.min(0.5, (wind - 35) / 50));
          if (inten <= 0) continue;
          const cx = ((lons[i] + 180) / 360) * STORM_W, cy = ((lats[i] + 90) / 180) * STORM_H, R = 7;
          for (let dy = -R; dy <= R; dy++) {
            const y = Math.round(cy + dy); if (y < 0 || y >= STORM_H) continue;
            for (let dx = -R; dx <= R; dx++) {
              let x = Math.round(cx + dx); x = ((x % STORM_W) + STORM_W) % STORM_W;
              const d2 = dx * dx + dy * dy; if (d2 > R * R) continue;
              const w = inten * Math.exp(-d2 / (R * R * 0.5)), idx = y * STORM_W + x;
              if (w > acc[idx]) acc[idx] = w;
            }
          }
        }
        for (let j = 0; j < STORM_W * STORM_H; j++) {
          const v = Math.min(255, acc[j] * 255) | 0;
          stormImg[j * 4] = v; stormImg[j * 4 + 1] = v; stormImg[j * 4 + 2] = v; stormImg[j * 4 + 3] = 255;
        }
        stormTexture.needsUpdate = true;
        uStormMix.value = 1;
      } catch (e) { /* keep procedural storms */ }
    };
    loadStorms();
    setInterval(loadStorms, 15 * 60 * 1000);

    const setSize = () => {
      const w = Math.max(1, hero.clientWidth), h = Math.max(1, hero.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setSize) : null;
    if (ro) ro.observe(hero); else window.addEventListener('resize', setSize);

    // pointer → world (z=0 plane) → group space, with soft engage/release
    const ndc = new THREE.Vector2(0, 0);
    let pointerIn = false;
    window.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pointerIn = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
      if (pointerIn) {
        ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      }
    }, { passive: true });
    window.addEventListener('pointerleave', () => { pointerIn = false; }, { passive: true });

    let visible = true;
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((es) => { es.forEach((en) => { visible = en.isIntersecting; }); })
      : null;
    if (io) io.observe(canvas);

    const proj = new THREE.Vector3();
    const _w = new THREE.Vector3();
    const t0 = performance.now();
    let reattach = 0;

    async function frame() {
      const el = (performance.now() - t0) / 1000;
      const k = Math.min(1, el / 2.4);
      uIntro.value = k * k * (3 - 2 * k);

      // survive a React re-render replacing the hero subtree
      if ((reattach++ & 63) === 0) {
        const h = findHost();
        if (h && (h !== hero || !canvas.isConnected)) {
          hero = h;
          if (!canvas.isConnected) { h.appendChild(canvas); h.appendChild(label); }
          if (ro) ro.observe(h);
          setSize();
        }
      }
      if (!visible) return; // rAF idles cheaply off-screen; hidden tabs stop it entirely

      // scroll progress through the hero: dim the field and dolly the camera
      // back while the text stage slides over the pinned banner
      const sec = document.getElementById('hero');
      const span = sec ? sec.offsetHeight - window.innerHeight : 0;
      const sp = span > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / span)) : 0;

      // tunnel move: after the banner has had its moment the helix axis eases
      // toward the camera and the camera rides into the bore — the strands'
      // own drift keeps the tunnel swirling once you're staring down it
      const tp = Math.min(1, Math.max(0, (el - 5) / 20));
      const tun = tp * tp * (3 - 2 * tp);
      // final act: after ~15s staring into the bore, fly down the tunnel while
      // the reactor's particles stream ahead into twin Dyson swarms
      const fl0 = Math.min(1, Math.max(0, (el - 52) / 8));
      const fly = fl0 * fl0 * (3 - 2 * fl0);
      const dy0 = Math.min(1, Math.max(0, (el - 51) / 8));
      uDyson.value = dy0 * dy0 * (3 - 2 * dy0);
      // axial view stacks additive light; dim extra mid-transit so punching
      // through the dissolving stream doesn't white out the frame
      uDim.value = (1 - sp * 0.62) * (1 - tun * 0.28) * (1 - Math.sin(fly * Math.PI) * 0.5);
      camera.position.z = 38 + sp * 8 - tun * 21 - fly * 42;
      camera.fov = 42 + tun * 16 - fly * 8;
      camera.updateProjectionMatrix();

      group.rotation.x = Math.sin(el * 0.05) * 0.10 * (1 - tun * 0.5) + ndc.y * -0.05;
      group.rotation.y = (el * 0.02 + sp * 0.45) * (1 - tun) +
        tun * (Math.PI / 2 + Math.sin(el * 0.07) * 0.07) + ndc.x * 0.06;
      group.updateMatrixWorld();

      // sun and earth trade sides on a half-orbit glide every 28s, arcing
      // through different depths so they pass around each other. Once the
      // tunnel has formed and the first swap is done they descend into the
      // bore and keep orbiting there, framed in the tunnel opening.
      const SWAP_T = 28, GLIDE = 5;
      const cyc = Math.floor(el / SWAP_T);
      const g0 = Math.min(1, Math.max(0, ((el - cyc * SWAP_T) - (SWAP_T - GLIDE)) / GLIDE));
      const swapA = Math.PI * (cyc + g0 * g0 * (3 - 2 * g0));
      const ib0 = Math.min(1, Math.max(0, (el - 29) / 8));
      const inb = tun * ib0 * ib0 * (3 - 2 * ib0);
      const orbR = 34 - 25 * inb, dj = 1 - inb * 0.6;
      const bx = Math.cos(swapA) * orbR, bz = Math.sin(swapA) * (12 - 6 * inb);
      const cy = 13 * (1 - inb), cz = -50 - 20 * inb;
      uSunPos.value.set(bx + Math.sin(el * 0.031) * 3 * dj, cy + 2 + Math.sin(el * 0.023 + 1.7) * 2.5 * dj, cz + bz);
      sunBody.position.copy(uSunPos.value);
      uEarthPos.value.set(-bx + Math.sin(el * 0.027 + 3) * 3 * dj, cy - 2 + Math.sin(el * 0.021) * 2.2 * dj, cz - bz);
      // Dyson targets live in group space; convert the scene-space centers
      uSunL.value.copy(group.worldToLocal(_w.copy(uSunPos.value)));
      uEarthL.value.copy(group.worldToLocal(_w.copy(uEarthPos.value)));

      uPointerActive.value += ((pointerIn ? 1 : 0) - uPointerActive.value) * 0.06;
      if (pointerIn) {
        proj.set(ndc.x, ndc.y, 0.5).unproject(camera);
        const dir = proj.sub(camera.position).normalize();
        const t = -camera.position.z / dir.z;
        const world = camera.position.clone().add(dir.multiplyScalar(t));
        uPointer.value.copy(group.worldToLocal(world));
      }

      await renderer.computeAsync(computeUpdate);
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(frame);
    canvas.style.opacity = '1';
    label.textContent = 'RENDER // ' + (isWebGPU ? 'WEBGPU · TSL' : 'WEBGL2 · TSL');
    hero.appendChild(label);
  } catch (err) {
    console.warn('[helix-fx] disabled:', err);
    canvas.remove();
    label.remove();
  }
})();
