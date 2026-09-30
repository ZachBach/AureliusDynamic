/**
 * reel-util.mjs — the small helpers a storyboard needs, in a module of their
 * own. They cannot live in reel.mjs: the engine's CLI awaits importing the
 * storyboard, and a storyboard that imports the engine back is a cycle that
 * never settles (Node reports it as an "unsettled top-level await").
 */
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
