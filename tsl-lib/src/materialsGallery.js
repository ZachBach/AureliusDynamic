/**
 * materialsGallery — the material roster as iterable data, the counterpart to
 * `gallery.js`'s node roster.
 *
 * The Lab reaches materials through `MATERIALS` in tools/build-lab.mjs, which
 * is a build-time list and therefore invisible at runtime. A consumer that
 * wants to WALK every material — a portability smoke on a different three
 * revision, a gallery view, a parity sweep — had no way to do it without
 * hand-listing all forty-three and watching that list rot.
 *
 * Entries are DERIVED from the modules, never restated: `name` and the display
 * snippet come from the module's own exports, so a material that changes its
 * label changes it here in the same commit. The only thing spelled out is the
 * id, because `dissolveMat.js` registers as `materials/dissolve` and a filename
 * is not reliably its registry key.
 *
 * Entry shape matches gallery.js: { id, name, family, apply(TSL, mat, {clock}) }.
 */
import * as hologram from './materials/hologram.js';
import * as shield from './materials/shield.js';
import * as liquidMetal from './materials/liquidMetal.js';
import * as dissolveMat from './materials/dissolveMat.js';
import * as magma from './materials/magma.js';
import * as ice from './materials/ice.js';
import * as forceField from './materials/forceField.js';
import * as glitch from './materials/glitch.js';
import * as marble from './materials/marble.js';
import * as auroraSilk from './materials/auroraSilk.js';
import * as nebulaGlass from './materials/nebulaGlass.js';
import * as toonCel from './materials/toonCel.js';
import * as brushedMetal from './materials/brushedMetal.js';
import * as starfield from './materials/starfield.js';
import * as plasmaArcs from './materials/plasmaArcs.js';
import * as prismaticField from './materials/prismaticField.js';
import * as circuitMaze from './materials/circuitMaze.js';
import * as vortexFlow from './materials/vortexFlow.js';
import * as oilSlick from './materials/oilSlick.js';
import * as crystal from './materials/crystal.js';
import * as rust from './materials/rust.js';
import * as topoMap from './materials/topoMap.js';
import * as radarSweep from './materials/radarSweep.js';
import * as lavaLamp from './materials/lavaLamp.js';
import * as damascus from './materials/damascus.js';
import * as stainedGlass from './materials/stainedGlass.js';
import * as caustics from './materials/caustics.js';
import * as velvet from './materials/velvet.js';
import * as bark from './materials/bark.js';
import * as snakeScales from './materials/snakeScales.js';
import * as neonTubes from './materials/neonTubes.js';
import * as thermalCam from './materials/thermalCam.js';
import * as crtScreen from './materials/crtScreen.js';
import * as matrixRain from './materials/matrixRain.js';
import * as soapBubble from './materials/soapBubble.js';
import * as opal from './materials/opal.js';
import * as malachite from './materials/malachite.js';
import * as sandDunes from './materials/sandDunes.js';
import * as coral from './materials/coral.js';
import * as halftone from './materials/halftone.js';
import * as blueprint from './materials/blueprint.js';
import * as plasmaGlobe from './materials/plasmaGlobe.js';
import * as kaleidoscope from './materials/kaleidoscope.js';

// [registry id, module]. Order follows tools/build-lab.mjs MATERIALS so the
// Lab's chip order and any consumer's walk order agree.
const MODULES = [
  ['materials/hologram', hologram],
  ['materials/shield', shield],
  ['materials/liquidMetal', liquidMetal],
  ['materials/dissolve', dissolveMat],
  ['materials/magma', magma],
  ['materials/ice', ice],
  ['materials/forceField', forceField],
  ['materials/glitch', glitch],
  ['materials/marble', marble],
  ['materials/auroraSilk', auroraSilk],
  ['materials/nebulaGlass', nebulaGlass],
  ['materials/toonCel', toonCel],
  ['materials/brushedMetal', brushedMetal],
  ['materials/starfield', starfield],
  ['materials/plasmaArcs', plasmaArcs],
  ['materials/prismaticField', prismaticField],
  ['materials/circuitMaze', circuitMaze],
  ['materials/vortexFlow', vortexFlow],
  ['materials/oilSlick', oilSlick],
  ['materials/crystal', crystal],
  ['materials/rust', rust],
  ['materials/topoMap', topoMap],
  ['materials/radarSweep', radarSweep],
  ['materials/lavaLamp', lavaLamp],
  ['materials/damascus', damascus],
  ['materials/stainedGlass', stainedGlass],
  ['materials/caustics', caustics],
  ['materials/velvet', velvet],
  ['materials/bark', bark],
  ['materials/snakeScales', snakeScales],
  ['materials/neonTubes', neonTubes],
  ['materials/thermalCam', thermalCam],
  ['materials/crtScreen', crtScreen],
  ['materials/matrixRain', matrixRain],
  ['materials/soapBubble', soapBubble],
  ['materials/opal', opal],
  ['materials/malachite', malachite],
  ['materials/sandDunes', sandDunes],
  ['materials/coral', coral],
  ['materials/halftone', halftone],
  ['materials/blueprint', blueprint],
  ['materials/plasmaGlobe', plasmaGlobe],
  ['materials/kaleidoscope', kaleidoscope],
];

export const MATERIALS_GALLERY = MODULES.map(([id, mod]) => ({
  id,
  name: mod.name,
  family: 'MATERIALS',
  apply: mod.apply,
}));

// Display snippets, same contract as GALLERY_SOURCES: the module owns its text.
export const MATERIALS_SOURCES = Object.fromEntries(
  MODULES.map(([id, mod]) => [id, mod.source()]),
);
