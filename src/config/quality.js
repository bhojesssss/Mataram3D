/**
 * Render quality tiers and runtime adaptation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY
 *
 * The realism pass was tuned against the wrong assumption. Everything it added —
 * GTAO, 4× MSAA on a half-float target, a 4096² shadow map, a 3.76-megapixel
 * drawing buffer — costs *fill rate*, and fill rate is exactly what an integrated
 * GPU does not have. On an Intel Iris Xe the result was a slideshow.
 *
 * Rather than picking one compromise that is wasteful on a good GPU and still slow
 * on a weak one, the scene sizes itself to the machine: a tier chosen up front from
 * what the GPU reports, then a continuously adjusted resolution scale that reacts
 * to real measured frame times.
 *
 * The single most effective dial is pixel count, not polygon count or effect count.
 * A scene at 60% resolution with AO looks better than the same scene at full
 * resolution with everything switched off.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/*
 * Phones no longer run the scene at all (see deviceClass), so these tiers only
 * have to cover desktops, laptops and tablets — and can spend accordingly.
 *
 * Two settings here cost almost nothing per frame and are set generously on every
 * tier: the shadow map is rendered once at startup (see Scene: autoUpdate is off),
 * so its size is memory, not frame time; and `gtaoScale` buys AO back cheaply —
 * GTAO re-renders the whole scene for its normals, and measured on an Iris Xe it
 * was half the frame (45ms → 22ms without it). At half resolution it costs ~8ms
 * less and, through its own denoise, reads the same.
 */
export const TIERS = {
  high: {
    name: 'high',
    /** Ceiling on drawing-buffer pixels, before the dynamic scale is applied. */
    maxPixels: 5.0e6,
    maxPixelRatio: 2,
    msaa: 4,
    gtao: true,
    gtaoSamples: 16,
    /** GTAO's internal resolution as a fraction of the drawing buffer's. */
    gtaoScale: 1,
    shadowMap: 4096,
    /** Glow on the gilt and around the sun. Needs the post chain (gtao). */
    bloom: true,
    treeDetailBias: 0,
    /** Multiplier on tree and undergrowth counts outside the wall. */
    vegetation: 1,
  },
  medium: {
    name: 'medium',
    maxPixels: 2.1e6,
    maxPixelRatio: 1.5,
    msaa: 2,
    gtao: true,
    gtaoSamples: 8,
    gtaoScale: 0.5,
    shadowMap: 4096,
    // Off here: measured on an Iris Xe it was the single dearest addition
    // (~3.5ms of a ~50ms full-resolution frame), and the sunbeams and clouds
    // carry the atmosphere without it.
    bloom: false,
    treeDetailBias: 0,
    vegetation: 1,
  },
  low: {
    name: 'low',
    maxPixels: 1.3e6,
    maxPixelRatio: 1.25,
    msaa: 0,
    // AO is the first thing to go: it is three extra full-screen passes, and the
    // normal maps still carry most of the surface detail without it.
    gtao: false,
    gtaoSamples: 0,
    gtaoScale: 0.5,
    shadowMap: 2048,
    bloom: false,
    // One LOD step down on every tree ring.
    treeDetailBias: -1,
    vegetation: 0.6,
  },
};

/** GPU strings that mean "integrated" — shared memory, low fill rate. */
const INTEGRATED = /intel|iris|uhd graphics|hd graphics|mali|adreno|videocore|llvmpipe|swiftshader|softwarerasterizer|microsoft basic/i;
/** Strings that mean "no real GPU at all". */
const SOFTWARE = /llvmpipe|swiftshader|softwarerasterizer|microsoft basic/i;

/**
 * Picks a starting tier.
 *
 * `?q=low|medium|high` in the URL overrides everything — useful for testing a tier
 * you don't own the hardware for, and as an escape hatch if the detection is wrong
 * on some machine we never see.
 */
export function detectTier(renderer) {
  const forced = new URLSearchParams(location.search).get('q');
  if (forced && TIERS[forced]) return TIERS[forced];

  // Before the GPU sniff, which can't tell a tablet from a laptop: an iPad
  // reports only "Apple GPU", matches nothing below, and would land on high.
  // A tablet's GPU also composites the page scroll, so it gets at most medium.
  if (deviceClass() === 'tablet') return TIERS.medium;

  let gpu = '';
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) gpu = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
  } catch {
    // Some browsers withhold this. Fall through to the conservative default.
  }

  if (SOFTWARE.test(gpu)) return TIERS.low;

  const cores = navigator.hardwareConcurrency || 4;
  if (INTEGRATED.test(gpu)) {
    // Integrated, but a wide one with plenty of cores is usually a recent laptop
    // that can hold medium. Narrow ones get low.
    return cores >= 8 ? TIERS.medium : TIERS.low;
  }

  // Unknown or discrete. Unknown gets medium rather than high — guessing high on a
  // machine that can't hold it is a much worse first impression than the reverse,
  // and the adaptor below will promote it within a couple of seconds if it can.
  return gpu ? TIERS.high : TIERS.medium;
}

/**
 * 'phone' | 'tablet' | 'desktop'.
 *
 * Phones get no 3D at all — the homepage shows a plain background instead
 * (see HomeBackdrop). Even at the lowest settings a phone GPU couldn't
 * hold the scene and the page scroll at once, and the scroll is what the reader
 * actually feels.
 *
 * The split is the screen's short side, not the user agent: both phones and
 * tablets say "Mobile" in places, but no phone is 600 CSS px across in either
 * orientation and every tablet is. `?device=phone|tablet|desktop` overrides it,
 * for checking the phone page from a desktop browser and vice versa.
 */
export function deviceClass() {
  const forced = new URLSearchParams(location.search).get('device');
  if (forced === 'phone' || forced === 'tablet' || forced === 'desktop') return forced;

  const ua = navigator.userAgent || '';
  const handheld =
    navigator.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    // iPadOS Safari sends a desktop Mac user agent; only the touch points give it away.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ||
    // "Request desktop site" swaps the UA too, but the primary pointer is still a finger.
    (window.matchMedia?.('(pointer: coarse)').matches ?? false);

  if (!handheld) return 'desktop';
  return Math.min(screen.width, screen.height) < 600 ? 'phone' : 'tablet';
}

/**
 * Watches frame times and returns a resolution multiplier.
 *
 * Deliberately sluggish and asymmetric: it drops resolution quickly when frames are
 * slow (the user is feeling it right now) but raises it slowly and only from a long
 * run of good frames (a brief calm stretch is not proof the machine can hold more).
 * Without that asymmetry the scale oscillates and the oscillation is more visible
 * than simply running at the lower resolution would have been.
 */
export class ResolutionAdaptor {
  constructor({ min = 0.55, max = 1, target = 16.7, onChange } = {}) {
    this.min = min;
    this.max = max;
    this.target = target; // ms — 60fps
    this.scale = max;
    this.onChange = onChange;

    this._samples = [];
    this._cooldown = 0;
  }

  /** Feed one frame's delta in seconds. */
  sample(dt) {
    const ms = dt * 1000;
    // Ignore obvious outliers: tab wake-ups, GC pauses, the first frames after a
    // resize. They are not evidence about steady-state cost.
    if (ms > 250 || ms <= 0) return;

    this._samples.push(ms);
    if (this._samples.length < 45) return;

    if (this._cooldown > 0) {
      this._cooldown--;
      this._samples.length = 0;
      return;
    }

    // Median, not mean — one stutter shouldn't move the decision.
    const sorted = this._samples.slice().sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this._samples.length = 0;

    let next = this.scale;
    if (median > this.target * 1.35) {
      next = Math.max(this.min, this.scale - 0.15); // struggling: big step down
    } else if (median > this.target * 1.1) {
      next = Math.max(this.min, this.scale - 0.07);
    } else if (median < this.target * 0.7 && this.scale < this.max) {
      next = Math.min(this.max, this.scale + 0.05); // comfortable: small step up
    }

    if (Math.abs(next - this.scale) > 0.001) {
      this.scale = next;
      this._cooldown = 2; // let the new resolution settle before judging again
      this.onChange?.(next, median);
    }
  }
}

/**
 * Drawing-buffer pixel ratio for a tier at a given viewport, honouring both the
 * tier's ratio cap and its total-pixel budget.
 *
 * The pixel budget is what actually matters: a 1.5 ratio is cheap on a laptop
 * screen and ruinous on a 4K monitor, and only a total-pixel cap catches both.
 */
export function pixelRatioFor(tier, cssWidth, cssHeight, scale = 1) {
  const dpr = Math.min(window.devicePixelRatio || 1, tier.maxPixelRatio);
  const budget = tier.maxPixels * scale * scale;
  const byBudget = Math.sqrt(budget / Math.max(cssWidth * cssHeight, 1));
  return Math.max(0.5, Math.min(dpr * scale, byBudget));
}
