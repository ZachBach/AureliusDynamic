/* Lazy-loaded TSL/WebGPU scenes for the parallax homepage.
   - three.js (~0.5MB) is imported ONCE, on first need, shared across scenes.
   - each scene initialises only when its host nears the viewport, and pauses
     its render loop the moment it scrolls off — so only what's on screen ever
     touches the GPU. Honors prefers-reduced-motion. Falls back to WebGL2 (and
     to the CSS background) automatically. */

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

let threeP = null;
const loadThree = () => (threeP ||= import('./vendor/three.webgpu.min.js'));

function lazyScene(host, factory) {
  if (REDUCE || !host) return;
  let ctrl = null, initing = false;
  const io = new IntersectionObserver(async (entries) => {
    const near = entries.some((e) => e.isIntersecting);
    if (near && !ctrl && !initing) {
      initing = true;
      try {
        const THREE = await loadThree();
        ctrl = await factory(THREE, host);
        host.dataset.live = '1';
      } catch (e) { console.warn('[scene] disabled:', e); ctrl = { setActive() {} }; }
      initing = false;
    }
    if (ctrl) ctrl.setActive(near);
  }, { rootMargin: '300px 0px', threshold: 0 });
  io.observe(host);
}

function makeRenderer(THREE, host) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  host.appendChild(canvas);
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

// wires resize + an activate/pause switch around a render tick
function loopController(host, renderer, camera, tick) {
  const size = () => {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size); ro.observe(host);
  let active = false;
  return { setActive(v) { if (v === active) return; active = v; renderer.setAnimationLoop(v ? tick : null); } };
}

// shared soft round sprite opacity term
function softSprite(TSL, jitter, phase) {
  const { uv, sin, time, smoothstep } = TSL;
  const q = uv().sub(0.5);
  const soft = smoothstep(0.5, 0.07, q.length());
  const twinkle = sin(time.mul(jitter.mul(2).add(0.6)).add(phase.mul(40))).mul(0.3).add(0.7);
  return soft.mul(soft).mul(twinkle);
}

/* ---- HERO: a slow twin-strand helix field with an ambient cloud ---- */
async function heroField(THREE, host) {
  const T = THREE.TSL;
  const { float, vec3, instanceIndex, hash, time, sin, cos, step, mix, color } = T;
  const renderer = makeRenderer(THREE, host);
  await renderer.init();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 2, 0.1, 120);
  camera.position.set(0, 1.4, 26);
  const group = new THREE.Group(); group.rotation.z = -0.12; scene.add(group);

  const mobile = Math.min(innerWidth, innerHeight) < 700;
  const COUNT = mobile ? 14000 : 48000;

  const mat = new THREE.SpriteNodeMaterial();
  mat.transparent = true; mat.blending = THREE.AdditiveBlending; mat.depthWrite = false; mat.depthTest = false;

  const u = hash(instanceIndex), strand = hash(instanceIndex.add(11)),
        jit = hash(instanceIndex.add(77)), h3 = hash(instanceIndex.add(313));
  const isB = step(0.5, strand), isCloud = step(0.82, h3);
  const ang = u.mul(Math.PI * 2 * 4.5).add(time.mul(0.10)).add(isB.mul(Math.PI));
  const R = float(4.4).mul(jit.mul(0.18).add(0.92));
  const axisX = u.sub(0.5).mul(34);
  const strandT = vec3(axisX, cos(ang).mul(R), sin(ang).mul(R));
  const ca = ang.mul(0.5).add(jit.mul(Math.PI * 2));
  const rc = float(4.4).mul(jit.mul(2.2).add(1.4));
  const cloudT = vec3(axisX.mul(1.1), cos(ca).mul(rc).mul(0.8), sin(ca).mul(rc));
  mat.positionNode = mix(strandT, cloudT, isCloud);

  const gold = color(0xF4C95D), cyan = color(0x57D4FF), blue = color(0x2B6CF6);
  mat.colorNode = mix(mix(gold, cyan, isB), blue, isCloud).mul(isCloud.mul(-0.4).add(1));
  mat.scaleNode = jit.mul(0.11).add(0.05).add(isCloud.mul(0.04));
  mat.opacityNode = softSprite(T, jit, u).mul(isCloud.mul(-0.5).add(1)).mul(0.62);

  const pts = new THREE.Sprite(mat); pts.count = COUNT; pts.frustumCulled = false; group.add(pts);

  let mx = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; }, { passive: true });
  const t0 = performance.now();
  return loopController(host, renderer, camera, () => {
    const el = (performance.now() - t0) / 1000;
    group.rotation.y = el * 0.03 + mx * 0.35;
    group.rotation.x = Math.sin(el * 0.08) * 0.06;
    renderer.render(scene, camera);
  });
}

/* ---- INTERSPERSED: a slowly turning particle globe (parallax divider) ---- */
async function orbField(THREE, host) {
  const T = THREE.TSL;
  const { float, vec3, instanceIndex, hash, sin, cos, step, mix, color } = T;
  const renderer = makeRenderer(THREE, host);
  await renderer.init();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 2, 0.1, 100);
  camera.position.set(0, 0, 16);
  const group = new THREE.Group(); group.rotation.x = 0.32; scene.add(group);

  const COUNT = Math.min(innerWidth, innerHeight) < 700 ? 10000 : 24000;
  const mat = new THREE.SpriteNodeMaterial();
  mat.transparent = true; mat.blending = THREE.AdditiveBlending; mat.depthWrite = false; mat.depthTest = false;

  const h1 = hash(instanceIndex), h2 = hash(instanceIndex.add(21)), h3 = hash(instanceIndex.add(331));
  const y = h2.mul(2).sub(1);
  const s = y.mul(y).oneMinus().max(0.0001).sqrt();
  const th = h1.mul(Math.PI * 2);
  const dir = vec3(cos(th).mul(s), y, sin(th).mul(s));
  mat.positionNode = dir.mul(float(5.4).mul(h3.mul(0.06).add(0.96)));
  mat.colorNode = mix(color(0x6FDBFF), color(0xF7CE6A), step(0.8, h3));
  mat.scaleNode = h1.mul(0.11).add(0.06);
  mat.opacityNode = softSprite(T, h1, h2).mul(0.5);

  const pts = new THREE.Sprite(mat); pts.count = COUNT; pts.frustumCulled = false; group.add(pts);
  return loopController(host, renderer, camera, () => { group.rotation.y += 0.0022; renderer.render(scene, camera); });
}

lazyScene(document.querySelector('[data-scene="hero"]'), heroField);
document.querySelectorAll('[data-scene="orb"]').forEach((el) => lazyScene(el, orbField));
