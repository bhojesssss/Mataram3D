import { Scene } from './scene/Scene.js';
import { ScrollController } from './scroll/ScrollController.js';
import { hydrateAssets } from './config/assets.manifest.js';

/**
 * Bootstrap.
 *
 * Order matters here. The loader stays up until the renderer has actually put a
 * frame on the canvas and the display face has loaded — revealing a blank canvas or
 * letting Cormorant swap in under the hero title both look worse than a slightly
 * longer hold. Only then is the ScrollController built, so the reveal animations
 * start from a page the reader is already looking at.
 */

const canvas = document.getElementById('scene');
const loader = document.getElementById('loader');

// Gate the reveal styles on JS being alive: if anything below throws, the CSS
// never hides the content and the page degrades to a readable static document.
document.documentElement.classList.add('has-js');

/** Resolves once the renderer has completed `count` frames. */
function framesRendered(count = 2) {
  return new Promise((resolve) => {
    let n = 0;
    const step = () => {
      if (++n >= count) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/** Never let a stalled font or GPU hang the loader forever. */
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((r) => setTimeout(r, ms))]);
}

async function boot() {
  let scene;

  try {
    scene = new Scene(canvas);
    scene.start();
  } catch (err) {
    // WebGL unavailable or context creation failed. The page is still a complete
    // document without it, so drop the canvas and carry on rather than dying.
    console.error('[mataram] 3D scene failed to start:', err);
    canvas?.remove();
    loader?.classList.add('is-done');
    document.documentElement.classList.remove('has-js');
    return;
  }

  await Promise.all([
    withTimeout(document.fonts?.ready ?? Promise.resolve(), 2500),
    withTimeout(framesRendered(2), 2500),
  ]);

  loader?.classList.add('is-done');

  // Swap in any Higgsfield GLBs that have been dropped into public/models/ and
  // enabled in the manifest. A no-op today (0 credits, nothing generated yet), and
  // deliberately not awaited — the procedural scene is already on screen and a slow
  // model download must not hold up the reveals.
  hydrateAssets(scene.scene, {
    pendopo: scene.pendopo,
    tumpangSari: scene.pendopo.tumpangSari,
    dancer: scene.dancer,
  }).catch((err) => console.warn('[mataram] asset hydration skipped:', err));

  const scroll = new ScrollController(scene);

  // Late webfont metrics change element offsets; ScrollTrigger needs to re-measure.
  document.fonts?.ready.then(() => scroll.refresh());

  // Expose for debugging — handy when tuning beats in tokens.js against the page.
  if (import.meta.env?.DEV) {
    window.__mataram = { scene, scroll };
  }

  window.addEventListener('beforeunload', () => {
    scroll.dispose();
    scene.dispose();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
