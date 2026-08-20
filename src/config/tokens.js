/**
 * Design tokens — lifted directly from referensi/ChatGPT Image 16 Agu 2026.png
 *
 * The moodboard's COLOR PALETTE strip reads left→right as six swatches, from the
 * deepest green through to off-white. They are named here by role, not by hue, so
 * the 3D scene and the DOM can share one vocabulary.
 */

export const palette = {
  // 1 — deepest swatch. Nav panel ("THE PALACE" card), headings, primary surfaces.
  forest: '#2C4A34',
  // 2 — muted sage. Secondary text on cream, distant atmospheric layers.
  sage: '#93A98D',
  // 3 — the gold. CTA fill ("EXPLORE"), ornaments, rule dividers, roof highlights.
  gold: '#C9A34E',
  // 4 — light gold / tan. Gilded trim, warm mid-tones.
  tan: '#DCC89A',
  // 5 — cream. Page ground.
  cream: '#E8E2D0',
  // 6 — off-white. Cards, raised surfaces, sky zenith.
  paper: '#F7F4EC',
};

/** Extra tones derived for 3D shading — not on the strip, but keyed to it. */
export const sceneColors = {
  forestDeep: '#1B2F21', // shadow end of `forest`, for fog at depth
  goldWarm: '#E0BC6B', // lit face of `gold`, for sun-struck roof tile
  stone: '#CFC7B4', // pendopo platform, between `cream` and `sage`
  stoneShadow: '#A69E8C',
  timber: '#6E5A3C', // soko guru columns — aged teak
  timberDark: '#4A3D28',
  skyLow: '#EFE7D2', // horizon haze
  skyHigh: '#D8DFD3', // zenith, faint green cast
};

export const fonts = {
  // Moodboard: "Cormorant Garamond ( Heading / Display )"
  display: "'Cormorant Garamond', 'Times New Roman', serif",
  // Moodboard: "Inter ( Body / UI )"
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

/**
 * Scroll timeline anchors, 0→1 across the whole page.
 *
 * These are fallbacks only. The real values are measured from the DOM at runtime by
 * `resolveBeats` below — hardcoded fractions are guesses about where a section will
 * land, and they were wrong: the `interior` payoff shot fired during Royal House
 * instead of Palace. Anything that reads a beat must read the resolved table.
 */
export const beats = {
  hero: 0.0,
  approach: 0.12, // camera begins the walk toward the pendopo
  threshold: 0.26, // passing between the outer columns
  interior: 0.4, // under the roof, tumpang sari overhead
  ascend: 0.56, // lift up through the roof opening
  compound: 0.72, // wide aerial of the whole compound
  horizon: 0.88, // pull back to the mountain silhouette
  end: 1.0,
};

/**
 * Which homepage section each camera beat belongs to.
 *
 * This is the actual editorial decision, and the one worth maintaining: the camera
 * should be under the roof while the reader is on Palace, and pulling back to the
 * mountains while they are on Archive. Section heights can then change freely
 * without anyone re-tuning numbers.
 */
export const beatSections = {
  hero: 'hero',
  approach: 'intro',
  threshold: 'history',
  interior: 'palace',
  ascend: 'culture',
  compound: 'discover',
  horizon: 'archive',
  end: 'news',
};

/**
 * Measures where each beat's section actually sits and returns a beat table in
 * scroll-progress space.
 *
 * A beat fires when its section is centred in the viewport. `hero` is pinned to 0
 * and `end` to 1 regardless of measurement, so the path always spans the full page.
 * The result is forced monotonic — an out-of-order table would make the camera
 * spline run backwards mid-scroll.
 *
 * Falls back to the static `beats` above for any section that isn't in the DOM.
 */
export function resolveBeats(doc = document) {
  const limit = Math.max(
    doc.documentElement.scrollHeight - window.innerHeight,
    1,
  );
  const halfView = window.innerHeight / 2;
  const names = Object.keys(beatSections);
  const out = {};

  for (const name of names) {
    const el = doc.querySelector(`[data-section="${beatSections[name]}"]`);
    if (!el) {
      out[name] = beats[name];
      continue;
    }
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const centred = top + rect.height / 2 - halfView;
    out[name] = Math.min(Math.max(centred / limit, 0), 1);
  }

  out.hero = 0;
  out.end = 1;

  // Enforce strictly increasing order.
  let prev = -Infinity;
  for (const name of names) {
    if (out[name] <= prev) out[name] = Math.min(prev + 0.001, 1);
    prev = out[name];
  }

  return out;
}

/** Homepage section order — mirrors PDF §3 "Struktur Homepage". */
export const sectionOrder = [
  'hero',
  'intro',
  'history',
  'royal-house',
  'culture',
  'palace',
  'discover',
  'archive',
  'news',
];
