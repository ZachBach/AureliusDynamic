<div align="center">

# Aurelius Dynamic

**Code shaping the world — one line at a time.**

The official site for Aurelius Dynamic — a single, self-contained web experience with zero runtime dependencies, plus the TSL node library behind it.

[aureliusdynamic.com](https://aureliusdynamic.com) · [Contact](mailto:build@aureliusdynamic.com)

</div>

---

## Overview

This repository is the production source for the Aurelius Dynamic site: the landing page, four dossier pages, the Shader Lab, the Lab applications deployed on the same domain, and [`tsl-lib/`](tsl-lib/) — the shared TSL node library the studio's projects draw on.

The landing experience — markup, styling, scripts, fonts, and two three.js r178 builds — is delivered from a single [`index.html`](index.html). There is no build step, no bundler, and no CDN.

## Highlights

- **WebGPU + TSL hero.** The hero renders a live electromagnetic-helix particle field — a Three.js `WebGPURenderer` compute pass written in TSL (Three.js Shading Language). Pointer-reactive particles spring-assemble into twin helical strands, rotate into a tunnel the camera flies down, and — flanked by a procedural Sun (granulated photosphere, prominences, flux-rope CMEs) and Earth (continents, storms, aurora-lit night side) — dissolve into a pair of glimmering Dyson swarms in a finale. It scales from ~500k particles on desktop WebGPU to a 100k WebGL2 fallback and 20k on mobile (the HUD reads `RENDER // WEBGPU · TSL` or `WEBGL2 · TSL`), respects `prefers-reduced-motion`, idles off-screen, and removes itself cleanly if graphics init fails.
- **Single-file landing page.** The complete landing page is one self-contained `index.html`; every style, script, font, and the Three.js builds are inlined. No bundler, no CDN, no install.
- **Privacy by design.** The landing page makes no external requests at runtime — no analytics, no cookies, no backend — with one deliberate exception: the hero Earth's storms are painted from a live public weather feed ([Open-Meteo](https://open-meteo.com/)), fetched client-side with no key, account, or personal data, falling back silently to a procedural storm pattern if it is unavailable. The contact form opens a pre-addressed email draft. (One honest caveat: the dossier sub-pages still link a Google Fonts stylesheet — see [Known gaps](#known-gaps).)
- **Measured, not asserted.** Every node in `tsl-lib` ships with a verified cost on both WGSL and GLSL backends, measured on named hardware. The numbers on this site come from [`tsl-lib/docs/REGISTRY.json`](tsl-lib/docs/REGISTRY.json), not from estimates.
- **Fully responsive.** Layouts, typography, and interactions adapt from mobile through ultrawide displays.
- **Interactive by default.** A live hero console (try `help`, `solve <your problem>`, `helix`, `ikos`, or `galaxy`), a simulated three-engine pipeline demo, scrollspy navigation, animated counters, and an engagement-brief form.

## The site

| Page | Path | What it is |
| --- | --- | --- |
| **Landing** | [`/`](index.html) | The single-file experience described above |
| **Philosophy** | [`/philosophy/`](philosophy/) | How the studio decides what to build and what to claim |
| **Capabilities** | [`/capabilities/`](capabilities/) | What is proven today, what is active R&D, what is a future program |
| **Case Studies** | [`/cases/`](cases/) | Four projects, each written to a different structural angle |
| **Roadmap** | [`/roadmap/`](roadmap/) | Near, mid, and long-term sequence — with the reasoning attached |
| **Privacy** | [`/privacy/`](privacy/) | Data practices, primarily for the echoGalaxy app |

The five dossier pages are plain `index.html` files sharing [`pages.css`](pages.css), linked relatively so they open correctly from `file://` as well as over HTTP.

## The Lab

Working instruments, featured from the landing page's **Lab** section. The first four are deployed on this domain; PulseMask is hosted from its own repository and linked out to.

| App | Path | What it is |
| --- | --- | --- |
| **Shader Lab** | [`/shader-lab/`](shader-lab/) | Live TSL material browser — every material compiled in the page, source visible, frame cost attached. Built from `tsl-lib` by [`tsl-lib/tools/build-lab.mjs`](tsl-lib/tools/build-lab.mjs). |
| **Electromagnetic Helix Reactor** | [`/helix/`](helix/) | Browser-native plasma simulation built around charged-particle dynamics and interactive diagnostics — ~18k macro-electrons under a Boris integrator, Monte-Carlo collisions, live 3D diagnostics, and a dusty-plasma module. Fully self-hosted (React, Babel, and Three.js are vendored in [`helix/vendor/`](helix/vendor/)). |
| **IKOS — Iterative Knowledge OS** | [`/ikos/`](ikos/) | A knowledge-graph runtime rendered four ways — Book, Graph, Terminal, and Orbit — from one living state. Ships as a self-contained bundle with an offline-first service worker; the optional 3D Orbit view loads Three.js modules from a CDN at runtime. |
| **echoGalaxy** | [`/galaxy/`](galaxy/) | Free educational universe explorer — planet → star system → galaxy → Local Group — installable PWA, offline after first visit, built on the studio's verified TSL node library. Android TWA package: `com.aureliusdynamic.echogalaxy` (Digital Asset Links stub in [`.well-known/assetlinks.json`](.well-known/assetlinks.json)). |

| **PulseMask** | [zachbach.github.io/pulsemask](https://zachbach.github.io/pulsemask/) | Photo-fitted parametric geometry: one portrait and one interpupillary measurement become thirty named, watertight parts, exported as STL, OBJ or GLB. The geometry engine has no browser dependencies, so the same code runs headless in Node. Published as a wearable-art design study — **not a respirator, not protective equipment, not a medical device**; its germicidal figures are modelled, never measured. Source: [`ZachBach/pulsemask`](https://github.com/ZachBach/pulsemask). |

Helix, IKOS, and echoGalaxy are **deployed build output copied in**, not source — edit the upstream project, rebuild, copy the result. The copy step is manual. echoGalaxy's upstream sets `base: './'` precisely so one build serves both standalone and from a subdirectory. PulseMask is the exception to the pattern: it is not copied in at all, it is linked, because it is a separate product on its own GitHub Pages deployment.

## tsl-lib — the shared node library

118 modules under [`tsl-lib/src/`](tsl-lib/src/) (`materials`, `pattern`, `noise`, `fresnel`, `ramp`, `util`), consumed two ways: inlined into the landing bundle's Lab section, and vendored one-way into echoGalaxy.

The contract that makes them portable — full rules in [`tsl-lib/docs/CONVENTIONS.md`](tsl-lib/docs/CONVENTIONS.md):

- **Nodes import nothing.** Every factory takes the TSL namespace as its first argument: `fresnel(TSL, opts)`.
- **Domain input is positional, tunables are an options object.** Every tunable has a default.
- **Nodes never own uniforms and never bake `time`.** Callers pass both in.
- **Each module exports `source()`**, returning the readable snippet the Lab displays — it lives in the same file and changes in the same commit.
- **Brand colors come only from `src/util/palette.js`**, never hex literals.
- **three.js is pinned to r178**, the build embedded in the bundle.

[`tsl-lib/docs/REGISTRY.json`](tsl-lib/docs/REGISTRY.json) is the single source of truth for status, parity, and cost; `NODES.md`, the Lab badges, and the gallery are **generated** from it. Modules land in `src/` before they are benched, so the registry is the smaller number — see [Known gaps](#known-gaps).

```bash
cd tsl-lib/bench && npm install    # once (puppeteer-core)
node run.mjs                       # full matrix: every node x {webgpu, webgl2}
node tools/gen-docs.mjs            # regenerate NODES.md from the registry
node tools/verify-site.mjs after   # hero + Lab smoke, both backends, error gate
```

## Getting started

The site is fully static and requires no tooling.

```bash
git clone https://github.com/ZachBach/AureliusDynamic.git
cd AureliusDynamic
```

Open `index.html` in any modern browser — that is the entire stack. For a local server that mirrors production paths:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Working on the bundle

**Never hand-edit `index.html`.** It is generated, and editing it directly breaks the encoding contract. The round-trip is the only supported path:

```bash
python tsl-lib/tools/extract.py          # decode -> tsl-lib/build/template.html
python tsl-lib/tools/extract.py --check  # prove encode(decode(x)) == x byte-for-byte
# ... edit tsl-lib/build/template.html ...
python tsl-lib/tools/pack.py --dry       # preview the splice
python tsl-lib/tools/pack.py             # write index.html
```

`tsl-lib/build/` and `tsl-lib/bench/vendor/` are generated and gitignored — **the bundle is the source of truth**, including for the embedded three.js builds.

## Deployment

The site is deployed on **Vercel** from this repository. Pushing to `master` deploys; the project is git-linked, so no `vercel.json` or `.vercel/` directory is needed and none exists.

`CNAME` and `.nojekyll` are inert leftovers from an earlier GitHub Pages setup. They are harmless and kept only so a Pages fallback stays one setting away — they are **not** evidence of the deploy target.

<!-- PARKED FOR REVIEW - znatodos section 0.3 - NOT LIVE (hidden on GitHub).
     Delete this line and the PARKED-WHOBUILDS-END marker to publish.

## Who builds this

Aurelius Dynamic is one engineer. Everything in this repository — the hero's compute pass, the node library, each page — was designed, written, measured, and shipped by the same person, with AI assistance used the way the rest of the stack is used: fast, useful, and never trusted past the point where a benchmark can check it.

Zachary Auerbach · ORCID [0009-0001-3046-9104](https://orcid.org/0009-0001-3046-9104) · [github.com/ZachBach](https://github.com/ZachBach)

PARKED-WHOBUILDS-END -->

## Known gaps

Stated here rather than left for you to find:

- **Sub-pages load Google Fonts.** The landing page inlines every face and contacts nobody, but the six sub-pages still link a `fonts.googleapis.com` stylesheet, which hands Google the visitor's IP — including on `/privacy/`, which does not disclose it. The fix is to self-host the three families next to `pages.css`.
- **The node registry lags `src/`.** 18 materials have a module but no registry entry and no bench entry, so they are missing from every generated surface — `NODES.md`, the Lab badges, and the gallery. Registering one means authoring a bench entry and running the bench, not editing a table.
- **The Android asset-links fingerprint is a placeholder**, pending Play Console signup.

## Related repositories

Separate products with their own remotes, not deployed from here: [echoGalaxy](https://github.com/ZachBach/echoGalaxy), [PulseMask](https://github.com/ZachBach/pulsemask), [Electromagnetic Helix Reactor](https://github.com/ZachBach/ElectromagneticHelixReactor), [IKOS](https://github.com/ZachBach/IKOS).

## Project status

Actively maintained. Console and pipeline-demo output is a scripted demonstration, not live data — the Lab applications above are the real artifacts.

## License

Released under the [MIT License](LICENSE).

Copyright © 2026 Zachary Auerbach, dba Aurelius Dynamic. The **Aurelius** name, wordmark, and hexagon mark are used for identification and demonstration; no trademark rights are granted.

---

<div align="center">

*Solve · Validate · Ship · Repeat*

</div>
