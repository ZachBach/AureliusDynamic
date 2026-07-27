<div align="center">

# Aurelius Dynamic

**Code shaping the world — one line at a time.**

The official landing site for Aurelius Dynamic LLC — a single, self-contained web experience with zero runtime dependencies.

[aureliusdynamic.com](https://aureliusdynamic.com) · [Contact](mailto:build@aureliusdynamic.com)

</div>

---

## Overview

This repository contains the production source for the Aurelius Dynamic site, plus the two Lab applications deployed on the same domain. The landing experience — markup, styling, scripts, fonts, and the WebGPU engine — is delivered from a single [`index.html`](index.html) file. There is no build step and no external runtime footprint.

## Highlights

- **WebGPU + TSL hero.** The hero renders a live electromagnetic-helix particle field — a Three.js `WebGPURenderer` compute pass written in TSL (Three.js Shading Language). Pointer-reactive particles spring-assemble into twin helical strands, rotate into a tunnel the camera flies down, and — flanked by a procedural Sun (granulated photosphere, prominences, flux-rope CMEs) and Earth (continents, storms, aurora-lit night side) — dissolve into a pair of glimmering Dyson swarms in a finale. It scales from ~500k particles on desktop WebGPU to a 100k WebGL2 fallback and 20k on mobile (the HUD reads `RENDER // WEBGPU · TSL` or `WEBGL2 · TSL`), respects `prefers-reduced-motion`, idles off-screen, and removes itself cleanly if graphics init fails.
- **Single-file landing page.** The complete landing site is one self-contained `index.html`; every style, script, font, and the Three.js build are inlined. No bundler, no CDN, no install.
- **Privacy by design.** The landing page makes no external requests at runtime — no analytics, no cookies, no backend — with one deliberate exception: the hero Earth's storms are painted from a live public weather feed ([Open-Meteo](https://open-meteo.com/)), fetched client-side with no key, account, or personal data, and the field falls back silently to a procedural storm pattern if it is unavailable. The contact form opens a pre-addressed email draft to `build@aureliusdynamic.com` — the site itself collects and transmits nothing else.
- **Fully responsive.** Layouts, typography, and interactions adapt from mobile through ultrawide displays.
- **Interactive by default.** Features a live hero console (try `help`, `solve <your problem>`, `helix`, or `ikos`), a simulated three-engine pipeline demo, scrollspy navigation, animated counters, and an engagement-brief form.

## The Lab

Two working research instruments are deployed on this domain and featured in the landing page's **Lab** section:

| App | Path | What it is |
| --- | --- | --- |
| **Electromagnetic Helix Reactor** | [`/helix/`](helix/) | Browser-native plasma simulation built around charged-particle dynamics, GPU acceleration, and interactive diagnostics — ~18k macro-electrons under a Boris integrator, Monte-Carlo collisions, live 3D diagnostics, and a dusty-plasma module. Fully self-hosted (React, Babel, and Three.js are vendored in [`helix/vendor/`](helix/vendor/)). |
| **IKOS — Iterative Knowledge OS** | [`/ikos/`](ikos/) | A knowledge-graph runtime rendered four ways — Book, Graph, Terminal, and Orbit — from one living state. Ships as a self-contained bundle with an offline-first service worker; the optional 3D Orbit view loads Three.js modules from a CDN at runtime. |

Both apps are copies of their source repositories' built output, adjusted only for subdirectory serving (relative service-worker and manifest paths for IKOS).

## Getting Started

The site is fully static and requires no tooling.

```bash
# Clone the repository
git clone https://github.com/ZachBach/AureliusDynamic.git
cd AureliusDynamic
```

Open `index.html` in any modern browser — that is the entire stack. For a local server that mirrors production paths, you may optionally run:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

The site is deployed via **GitHub Pages** from the repository root.

1. **Pages:** Settings → Pages → Deploy from branch (`master`, root).
2. **Custom domain:** `aureliusdynamic.com` (configured in [`CNAME`](CNAME)) with **Enforce HTTPS** enabled.
3. **DNS** (at your registrar):
   - Apex `A` records → GitHub Pages IP addresses
   - `www` `CNAME` → `<your-github-user>.github.io`

## Project Status

Actively maintained. Certain content — including team profiles and console/demo output — is illustrative and provided for demonstration purposes rather than as live data.

## License

Released under the [MIT License](LICENSE).

Copyright © 2026 Aurelius Dynamic LLC. The **Aurelius** name, wordmark, and hexagon mark are used for identification and demonstration; no trademark rights are granted.

---

<div align="center">

*Solve · Validate · Ship · Repeat*

</div>
