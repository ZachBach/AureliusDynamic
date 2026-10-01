# vendor/

Third-party files IKOS serves itself, so a visit contacts no CDN. Each file is
the unmodified build from the npm registry tarball of the version shown. The
hashes let anyone check that.

| File | Package | Used by | How it ships |
|---|---|---|---|
| `react.production.min.js` | react 18.3.1 | the DC runtime (`support.js`) | embedded in `index.html` by `build.mjs` |
| `react-dom.production.min.js` | react-dom 18.3.1 | the DC runtime | embedded in `index.html` by `build.mjs` |
| `three.webgpu.min.js` | three 0.171.0 | Orbit, WebGPU engine | served from this folder, loaded when Orbit opens |
| `three.core.min.js` | three 0.171.0 | imported by `three.webgpu.min.js` | served from this folder |
| `three.min.js` | three 0.128.0 (r128) | Orbit, classic WebGL fallback | served from this folder |

SHA-384 (base64), matching the `integrity` attributes CDNs publish:

```
react.production.min.js      sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z
react-dom.production.min.js  sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1
three.webgpu.min.js          sha384-QHB8m8YU1K6nU4Ujz809m8Os3kIBvdwOhMy/9/+ZqavALxT8Wu8sQJ0Q4oVFt6VX
three.core.min.js            sha384-o7aLe+NzQLKhqUTx3AWnCnAsurwCaoG+cVd4flrG/xpmV7l6qzNtiGIw7qvdkPMH
three.min.js                 sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu
```

The two React hashes are the same values `support.js` pins in `REACT_SRI` and
`REACT_DOM_SRI`, which proves these are the exact bytes the runtime used to
fetch from unpkg.com.

Check a file:

```bash
openssl dgst -sha384 -binary vendor/three.min.js | openssl base64 -A
```

All five are MIT licensed. The license texts are `LICENSE-react.txt` (react and
react-dom share it) and `LICENSE-three.txt` (three 0.171.0; the r128 text differs
only in its copyright year, 2010-2021).

**Deploying:** copy this whole folder next to `index.html`. The React files are
already inside `index.html`, but keeping them here keeps the build reproducible.
