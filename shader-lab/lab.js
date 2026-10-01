import * as THREE from './vendor/three.webgpu.min.js';
import { MATERIALS_GALLERY, MATERIALS_SOURCES } from '../tsl-lib/src/materialsGallery.js';

// The roster is the source of truth. This page used to restate the material
// list, which meant every new library material had to be remembered here too —
// and twenty-five of them were not. materialsGallery.js derives name and
// display source from each module, so a material that ships is a material that
// appears, with no second list to rot.

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
const filterInput = getElement('[data-lab-filter]');
const countOutput = getElement('[data-lab-count]');

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

// Entries describe a material; the GPU program behind one is only built when
// it is first selected. Compiling fifty-four node graphs up front would stall
// the first paint for no benefit — nobody looks at all of them at once.
const createEntries = (registry) => MATERIALS_GALLERY.map((entry) => {
  const code = MATERIALS_SOURCES[entry.id];
  if (!entry.name || typeof entry.apply !== 'function' || !code) {
    throw new Error(`${entry.id} does not implement the Shader Lab material contract.`);
  }
  return {
    id: entry.id,
    name: entry.name,
    apply: entry.apply,
    source: code,
    badge: formatBadge(registry[entry.id], registry._baseline),
    material: null,
  };
});

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
  const entries = createEntries(registry);
  if (!entries.length) throw new Error('The Shader Lab material roster is empty.');

  const materialOf = (entry) => {
    if (!entry.material) {
      const material = new THREE.MeshBasicNodeMaterial();
      entry.apply(THREE.TSL, material, { clock });
      entry.material = material;
    }
    return entry.material;
  };

  const rendererBackend = renderer.backend && renderer.backend.isWebGPUBackend ? 'WEBGPU' : 'WEBGL2';
  backend.textContent = `${rendererBackend} · THREE R${THREE.REVISION}`;
  countOutput.textContent = String(entries.length);
  setStatus(`${entries.length} verified materials loaded. Drag to rotate the geometry.`);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
  const geometry = new THREE.TorusKnotGeometry(1, 0.36, 200, 32);
  const knot = new THREE.Mesh(geometry, materialOf(entries[0]));
  scene.add(knot);

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

  const buttons = entries.map((entry) => {
    const button = document.createElement('button');
    button.className = 'lab-chip';
    button.type = 'button';
    button.textContent = entry.name;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => updateMaterial(entry.id));
    chips.appendChild(button);
    return button;
  });

  const updateMaterial = (id) => {
    const index = entries.findIndex((entry) => entry.id === id);
    const entry = entries[index];
    knot.material = materialOf(entry);
    source.textContent = entry.source;
    badge.textContent = entry.badge;
    buttons.forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === index));
    });
  };
  updateMaterial(entries[0].id);

  filterInput.addEventListener('input', () => {
    const needle = filterInput.value.trim().toLowerCase();
    let shown = 0;
    entries.forEach((entry, index) => {
      const match = !needle || entry.name.toLowerCase().includes(needle);
      buttons[index].hidden = !match;
      if (match) shown += 1;
    });
    countOutput.textContent = needle ? `${shown} / ${entries.length}` : String(entries.length);
  });

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
    entries.forEach((entry) => { if (entry.material) entry.material.dispose(); });
    renderer.dispose();
  }, { once: true });
};

init().catch((error) => {
  console.error(error);
  backend.textContent = 'RENDERER UNAVAILABLE';
  setStatus(`Shader Lab could not initialize: ${error.message}`, 'error');
});
