import * as THREE from './vendor/three.webgpu.min.js';

const MATERIAL_MODULES = [
  ['materials/hologram', () => import('../tsl-lib/src/materials/hologram.js')],
  ['materials/shield', () => import('../tsl-lib/src/materials/shield.js')],
  ['materials/liquidMetal', () => import('../tsl-lib/src/materials/liquidMetal.js')],
  ['materials/dissolve', () => import('../tsl-lib/src/materials/dissolveMat.js')],
  ['materials/magma', () => import('../tsl-lib/src/materials/magma.js')],
  ['materials/ice', () => import('../tsl-lib/src/materials/ice.js')],
  ['materials/forceField', () => import('../tsl-lib/src/materials/forceField.js')],
  ['materials/glitch', () => import('../tsl-lib/src/materials/glitch.js')],
  ['materials/marble', () => import('../tsl-lib/src/materials/marble.js')],
  ['materials/auroraSilk', () => import('../tsl-lib/src/materials/auroraSilk.js')],
  ['materials/nebulaGlass', () => import('../tsl-lib/src/materials/nebulaGlass.js')],
  ['materials/toonCel', () => import('../tsl-lib/src/materials/toonCel.js')],
  ['materials/brushedMetal', () => import('../tsl-lib/src/materials/brushedMetal.js')],
  ['materials/starfield', () => import('../tsl-lib/src/materials/starfield.js')],
  ['materials/plasmaArcs', () => import('../tsl-lib/src/materials/plasmaArcs.js')],
  ['materials/prismaticField', () => import('../tsl-lib/src/materials/prismaticField.js')],
  ['materials/circuitMaze', () => import('../tsl-lib/src/materials/circuitMaze.js')],
  ['materials/vortexFlow', () => import('../tsl-lib/src/materials/vortexFlow.js')],
];

const getElement = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Shader Lab is missing ${selector}.`);
  return element;
};

const stage = getElement('[data-lab-stage]');
const canvas = getElement('[data-lab-canvas]');
const chips = getElement('[data-lab-chips]');
const backend = getElement('[data-lab-backend]');
const metrics = getElement('[data-lab-metrics]');
const status = getElement('[data-lab-status]');
const badge = getElement('[data-lab-badge]');
const source = getElement('[data-lab-source]');
const fluxInput = getElement('[data-lab-flux]');
const fluxOutput = getElement('[data-lab-flux-output]');

const COST_CLASSES = ['', 'I', 'II', 'III', 'IV', 'V'];

const loadRegistry = async () => {
  const response = await fetch('../tsl-lib/docs/REGISTRY.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Verification registry failed to load (${response.status}).`);
  return response.json();
};

const formatBadge = (record, baseline) => {
  if (!record || record.status !== 'verified' || !record.cost) {
    throw new Error('A material is missing its verified cost record.');
  }
  const cost = record.cost;
  const device = baseline && baseline.gpu ? baseline.gpu.replace('Intel(R) ', '') : 'baseline device';
  const gpu = cost.gpuMs == null ? '--' : `${cost.gpuMs.toFixed(2)} MS`;
  const backends = record.impl && record.impl.webgpu && record.impl.webgl2 ? 'WGSL + GLSL' : 'BACKEND RECORD INCOMPLETE';
  return `CLASS ${COST_CLASSES[cost.costClass] || '?'} · ${gpu} @ ${device} · ${backends} · VERIFIED ${record.verified}`;
};

const setStatus = (message, state = 'ready') => {
  status.textContent = message;
  status.dataset.state = state;
};

const createMaterialEntries = async (registry, clock) => {
  const modules = await Promise.all(MATERIAL_MODULES.map(async ([id, load]) => [id, await load()]));
  return modules.map(([id, module]) => {
    if (!module.name || typeof module.apply !== 'function' || typeof module.source !== 'function') {
      throw new Error(`${id} does not implement the Shader Lab material contract.`);
    }
    const material = new THREE.MeshBasicNodeMaterial();
    module.apply(THREE.TSL, material, { clock });
    return {
      id,
      name: module.name,
      material,
      source: module.source(),
      badge: formatBadge(registry[id], registry._baseline),
    };
  });
};

const init = async () => {
  if (!THREE.WebGPURenderer || !THREE.MeshBasicNodeMaterial) {
    throw new Error('The pinned three.js WebGPU build is unavailable.');
  }

  setStatus('Loading verification records and material modules.');
  const registryPromise = loadRegistry();
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setClearColor(0x05070C, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  await renderer.init();

  const flux = THREE.TSL.uniform(Number(fluxInput.value));
  const clock = THREE.TSL.time.mul(flux.mul(1.8).add(0.25));
  const registry = await registryPromise;
  const entries = await createMaterialEntries(registry, clock);
  if (entries.length !== MATERIAL_MODULES.length) {
    throw new Error('The Shader Lab did not load its complete material set.');
  }

  const rendererBackend = renderer.backend && renderer.backend.isWebGPUBackend ? 'WEBGPU' : 'WEBGL2';
  backend.textContent = `${rendererBackend} · THREE R${THREE.REVISION}`;
  setStatus(`${entries.length} verified materials loaded. Drag to rotate the geometry.`);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
  const geometry = new THREE.TorusKnotGeometry(1, 0.36, 200, 32);
  const knot = new THREE.Mesh(geometry, entries[0].material);
  scene.add(knot);

  let activeIndex = 0;
  let distance = 3.7;
  let targetYaw = 0.35;
  let targetPitch = -0.2;
  let pointer = null;
  let frameAverage = 16.7;
  let previousFrame = performance.now();
  let frameCount = 0;
  let animationFrame = 0;
  let disposed = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateMaterial = (index) => {
    const entry = entries[index];
    activeIndex = index;
    knot.material = entry.material;
    source.textContent = entry.source;
    badge.textContent = entry.badge;
    chips.querySelectorAll('button').forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === index));
    });
  };

  entries.forEach((entry, index) => {
    const button = document.createElement('button');
    button.className = 'lab-chip';
    button.type = 'button';
    button.textContent = entry.name;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => updateMaterial(index));
    chips.appendChild(button);
  });
  updateMaterial(0);

  fluxInput.addEventListener('input', () => {
    flux.value = Number(fluxInput.value);
    fluxOutput.textContent = Number(fluxInput.value).toFixed(2);
  });

  const resize = () => {
    const bounds = stage.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  canvas.addEventListener('pointerdown', (event) => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    targetYaw += (event.clientX - pointer.x) * 0.01;
    targetPitch = Math.max(-1.2, Math.min(1.2, targetPitch + (event.clientY - pointer.y) * 0.01));
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  const releasePointer = (event) => {
    if (pointer && pointer.id === event.pointerId) pointer = null;
  };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    distance = Math.max(2.4, Math.min(6.4, distance + event.deltaY * 0.003));
  }, { passive: false });

  const render = (now) => {
    const delta = Math.min(100, now - previousFrame);
    previousFrame = now;
    frameAverage += (delta - frameAverage) * 0.08;
    if (!reduceMotion.matches && !pointer) targetYaw += delta * 0.00018;
    knot.rotation.y += (targetYaw - knot.rotation.y) * 0.08;
    knot.rotation.x += (targetPitch - knot.rotation.x) * 0.08;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    if (!document.hidden) renderer.render(scene, camera);
    frameCount += 1;
    if (frameCount % 12 === 0) {
      metrics.textContent = `${frameAverage.toFixed(1)} MS · ${(1000 / frameAverage).toFixed(0)} FPS`;
    }
    if (!disposed) animationFrame = requestAnimationFrame(render);
  };
  animationFrame = requestAnimationFrame(render);

  window.addEventListener('pagehide', () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    observer.disconnect();
    geometry.dispose();
    entries.forEach((entry) => entry.material.dispose());
    renderer.dispose();
  }, { once: true });
};

init().catch((error) => {
  console.error(error);
  backend.textContent = 'RENDERER UNAVAILABLE';
  setStatus(`Shader Lab could not initialize: ${error.message}`, 'error');
});
