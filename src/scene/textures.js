import * as THREE from 'three';
import { palette, sceneColors } from '../config/tokens.js';

/**
 * Procedural canvas textures.
 *
 * Everything the 3D scene wears is drawn here at runtime rather than loaded, so the
 * build stays self-contained and every surface is guaranteed to sit inside the
 * moodboard palette. When Higgsfield GLBs land (see config/assets.manifest.js) their
 * baked materials replace these, but the palette contract stays the same.
 */

const cache = new Map();

function canvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function finish(c, repeat = 1) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Non-colour data — normal and roughness maps must not be sRGB-decoded. */
function dataTexture(c, repeat = 1) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Derives a tangent-space normal map from an albedo canvas by treating its
 * luminance as a height field and running a Sobel filter over it.
 *
 * This is the single biggest thing separating "low poly" from "detailed" here.
 * Polygon count controls the silhouette; everything *inside* the silhouette is
 * shading, and with a flat normal every surface reads as a painted card no matter
 * how many triangles it has. Shingle courses, stone joints, wood grain and carved
 * ornament all already exist as light and dark in the albedo, so the relief is
 * free — it just has to be handed to the lighting model.
 *
 * Wraps at the edges to match the textures' RepeatWrapping, so tiles seam cleanly.
 */
function heightToNormal(src, strength = 1.6) {
  const size = src.width;
  const data = src.getContext('2d').getImageData(0, 0, size, size).data;

  const h = new Float32Array(size * size);
  for (let i = 0, p = 0; i < h.length; i++, p += 4) {
    h[i] = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
  }
  const at = (x, y) =>
    h[((y + size) % size) * size + ((x + size) % size)];

  const out = canvas(size);
  const octx = out.getContext('2d');
  const img = octx.createImageData(size, size);
  const o = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = at(x - 1, y - 1);
      const tt = at(x, y - 1);
      const tr = at(x + 1, y - 1);
      const ll = at(x - 1, y);
      const rr = at(x + 1, y);
      const bl = at(x - 1, y + 1);
      const bb = at(x, y + 1);
      const br = at(x + 1, y + 1);

      const dx = tr + 2 * rr + br - (tl + 2 * ll + bl);
      const dy = bl + 2 * bb + br - (tl + 2 * tt + tr);

      const nx = -dx * strength;
      const ny = -dy * strength;
      const inv = 1 / Math.hypot(nx, ny, 1);

      const i = (y * size + x) * 4;
      o[i] = (nx * inv * 0.5 + 0.5) * 255;
      o[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
      o[i + 2] = (inv * 0.5 + 0.5) * 255;
      o[i + 3] = 255;
    }
  }

  octx.putImageData(img, 0, 0);
  return out;
}

/**
 * Varying roughness from the same luminance.
 *
 * A uniform roughness value is the other giveaway of a synthetic surface — real
 * materials are polished where they're walked on and rough where dirt collects.
 * Dark areas map to rough by default (joints, grain, shadowed crevices); `invert`
 * flips that for surfaces where the dark parts are the polished ones.
 */
function heightToRoughness(src, min = 0.4, max = 0.95, invert = false) {
  const size = src.width;
  const data = src.getContext('2d').getImageData(0, 0, size, size).data;

  const out = canvas(size);
  const octx = out.getContext('2d');
  const img = octx.createImageData(size, size);
  const o = img.data;

  for (let i = 0; i < size * size; i++) {
    const p = i * 4;
    let l = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) / 255;
    if (!invert) l = 1 - l;
    const v = (min + (max - min) * l) * 255;
    o[p] = o[p + 1] = o[p + 2] = v;
    o[p + 3] = 255;
  }

  octx.putImageData(img, 0, 0);
  return out;
}

/**
 * Builds and caches a full PBR set for one surface.
 *
 * `build` returns the albedo canvas; the normal and roughness maps are derived
 * from it so the three can never disagree about where a joint or a grain line is.
 */
/**
 * Half-size copy of a canvas.
 *
 * The Sobel and roughness passes are per-pixel JavaScript over the whole image, so
 * they cost four times as much at 1024 as at 512. Derived maps do not need the
 * albedo's resolution to be convincing — they are low-frequency by nature and the
 * GPU filters them anyway — and running them at full size was a large part of a
 * three-second startup. Albedo stays sharp; only the derivations shrink.
 */
function halfSize(src, cap = 512) {
  if (src.width <= cap) return src;
  const size = Math.max(cap, src.width >> 1);
  const out = canvas(size);
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, size, size);
  return out;
}

function pbr(key, opts, build) {
  const hit = cache.get(key);
  if (hit) return hit;

  const { normalStrength = 1.6, rough = [0.4, 0.95], invertRough = false } = opts;
  const c = build();
  const small = halfSize(c);
  const set = {
    canvas: c,
    map: finish(c),
    normalMap: dataTexture(heightToNormal(small, normalStrength)),
    roughnessMap: dataTexture(
      heightToRoughness(small, rough[0], rough[1], invertRough),
    ),
  };
  cache.set(key, set);
  return set;
}

function memo(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

/** Aged teak for the soko guru (the four central pillars) and all timber. */
export function timberMaps() {
  return pbr('timber', { normalStrength: 2.4, rough: [0.55, 0.92] }, () => {
    const c = canvas(512);
    const g = c.getContext('2d');
    g.fillStyle = sceneColors.timber;
    g.fillRect(0, 0, 512, 512);

    // Long vertical grain — the pillars are read end-on, so grain runs with height.
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 512;
      const w = 0.6 + Math.random() * 2.4;
      const dark = Math.random() > 0.5;
      g.strokeStyle = dark
        ? `rgba(40, 30, 18, ${0.05 + Math.random() * 0.18})`
        : `rgba(190, 160, 110, ${0.03 + Math.random() * 0.09})`;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x, 0);
      // Slight drift keeps the grain from reading as a barcode.
      let cx = x;
      for (let y = 0; y <= 512; y += 32) {
        cx += (Math.random() - 0.5) * 5;
        g.lineTo(cx, y);
      }
      g.stroke();
    }

    // A few knots.
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 4 + Math.random() * 9;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(35, 26, 15, 0.55)');
      grad.addColorStop(1, 'rgba(35, 26, 15, 0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    return c;
  });
}

/** Pale limestone for the platform and steps. */
export function stoneMaps() {
  return pbr('stone', { normalStrength: 2.0, rough: [0.6, 0.98] }, () => {
    const c = canvas(512);
    const g = c.getContext('2d');
    g.fillStyle = sceneColors.stone;
    g.fillRect(0, 0, 512, 512);

    // Speckle.
    for (let i = 0; i < 5200; i++) {
      const v = Math.random();
      g.fillStyle =
        v > 0.5
          ? `rgba(255, 253, 245, ${Math.random() * 0.35})`
          : `rgba(120, 112, 96, ${Math.random() * 0.22})`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 1.6, 1.6);
    }

    // Slab joints — 4x4 grid of cut stone.
    g.strokeStyle = 'rgba(110, 103, 88, 0.45)';
    g.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      const p = (512 / 4) * i;
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 512);
      g.moveTo(0, p);
      g.lineTo(512, p);
      g.stroke();
    }

    return c;
  });
}

/** Shingled roof tile — the dominant mass of a joglo, so it carries the most detail. */
export function roofMaps() {
  // Strongest relief in the scene: overlapping shingle is genuinely thick, and
  // the raking sun at the later beats needs an edge to catch on every course.
  return pbr('roof', { normalStrength: 3.2, rough: [0.62, 0.95] }, () => {
    const c = canvas(1024);
    const g = c.getContext('2d');
    g.fillStyle = '#3B4238';
    g.fillRect(0, 0, 1024, 1024);

    const rows = 26;
    const rh = 1024 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      const offset = (r % 2) * 22;
      for (let x = -44; x < 1024 + 44; x += 44) {
        // Each shingle gets its own tone so the roof shimmers instead of flattening.
        const t = Math.random();
        const base = 52 + t * 26;
        g.fillStyle = `rgb(${base}, ${base + 7}, ${base - 4})`;
        g.beginPath();
        g.roundRect(x + offset, y, 42, rh * 1.5, [0, 0, 5, 5]);
        g.fill();
        // Lower lip catches light.
        g.fillStyle = `rgba(200, 190, 160, ${0.05 + Math.random() * 0.07})`;
        g.fillRect(x + offset, y + rh * 1.5 - 2.5, 42, 2.5);
      }
    }

    // Course shadow, to read the horizontal banding from a distance.
    g.fillStyle = 'rgba(18, 24, 18, 0.3)';
    for (let r = 0; r < rows; r++) g.fillRect(0, r * rh, 1024, 2.5);

    return c;
  });
}

/**
 * Batik — a soft parang-inspired wash for the tumpang-sari soffits, in the
 * cloth's own palette (forest, sage, gold, cream).
 *
 * This used to be a printed diagonal motif — repeating blades, the actual
 * parang pattern. That read well at the `interior` beat but broke at
 * `ascend`: the panels are viewed almost edge-on there, and no printed
 * pattern survives that angle. Repeating content needs anisotropic
 * filtering to resolve, and 16x (the practical hardware ceiling) isn't
 * enough once the panel is close to edge-on — blurring or downsampling the
 * print only pushed the aliasing threshold a little further out, it never
 * removed it, because *any* periodic content aliases once the viewing
 * angle is steep enough. A gradient doesn't have that failure mode: it has
 * no repeat to alias, at any angle. So the motif here is now soft diagonal
 * bands of colour and a few wide, low-contrast blooms — same palette, same
 * diagonal grain as the parang print, no period for filtering to lose.
 */
export function batikMaps() {
  // Cloth, so barely any relief — just enough to catch lantern light.
  return pbr('batik', { normalStrength: 0.5, rough: [0.55, 0.82] }, () => {
    const c = canvas(512);
    const g = c.getContext('2d');
    g.fillStyle = palette.cream;
    g.fillRect(0, 0, 512, 512);

    // Soft diagonal grain, echoing the parang's angle without repeating it.
    g.save();
    g.translate(256, 256);
    g.rotate(-Math.PI / 4);
    g.translate(-256, -256);
    const grain = g.createLinearGradient(0, 0, 512, 0);
    grain.addColorStop(0, palette.forest);
    grain.addColorStop(0.45, palette.sage);
    grain.addColorStop(0.55, palette.sage);
    grain.addColorStop(1, palette.tan);
    g.globalAlpha = 0.4;
    g.fillStyle = grain;
    g.fillRect(-256, -256, 1024, 1024);
    g.globalAlpha = 1;
    g.restore();

    // A few wide gold blooms — soft radial gradients, not repeating shapes —
    // to give the wash some life under lantern light.
    const blooms = [
      [140, 160, 150],
      [400, 340, 170],
      [260, 470, 120],
    ];
    for (const [x, y, r] of blooms) {
      const bloom = g.createRadialGradient(x, y, 0, x, y, r);
      bloom.addColorStop(0, 'rgba(224, 188, 107, 0.32)');
      bloom.addColorStop(1, 'rgba(224, 188, 107, 0)');
      g.fillStyle = bloom;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    return c;
  });
}

/**
 * Gilded ornament panel — the eight-petal rosette that repeats through the
 * moodboard as a divider glyph. Sits on the roof fascia and the platform frieze.
 */
export function ornamentMaps() {
  // Chased metal: deep relief on the rosettes, low roughness so it reads as gilt.
  return pbr('ornament', { normalStrength: 2.8, rough: [0.18, 0.5] }, () => {
    const c = canvas(512);
    const g = c.getContext('2d');
    g.fillStyle = palette.forest;
    g.fillRect(0, 0, 512, 512);

    const drawRosette = (cx, cy, r) => {
      g.save();
      g.translate(cx, cy);
      for (let i = 0; i < 8; i++) {
        g.rotate(Math.PI / 4);
        g.fillStyle = palette.gold;
        g.beginPath();
        g.ellipse(0, -r * 0.55, r * 0.19, r * 0.46, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = palette.tan;
      g.beginPath();
      g.arc(0, 0, r * 0.19, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };

    drawRosette(128, 128, 78);
    drawRosette(384, 128, 78);
    drawRosette(128, 384, 78);
    drawRosette(384, 384, 78);

    // Connecting gold rule.
    g.strokeStyle = 'rgba(201, 163, 78, 0.4)';
    g.lineWidth = 3;
    g.strokeRect(20, 20, 472, 472);

    return c;
  });
}

/**
 * Courtyard paving — the swept stone plaza the pendopo stands in.
 *
 * This surface fills the bottom third of the hero frame, so a flat colour there
 * was the single largest area of nothing in the render. Large slabs with worn
 * joints give the eye something to measure distance against, which is most of
 * what "detail" means at this scale.
 */
export function courtyardMaps() {
  return pbr('courtyard', { normalStrength: 2.2, rough: [0.6, 0.95] }, () => {
    const c = canvas(1024);
    const g = c.getContext('2d');
    g.fillStyle = sceneColors.stone;
    g.fillRect(0, 0, 1024, 1024);

    // 8×8 slabs, each with its own tone so the grid never reads as a print.
    const n = 8;
    const cell = 1024 / n;
    for (let ix = 0; ix < n; ix++) {
      for (let iy = 0; iy < n; iy++) {
        const t = Math.random();
        const v = 196 + t * 26;
        g.fillStyle = `rgb(${v}, ${v - 4}, ${v - 18})`;
        // Inset leaves the joint line showing through.
        g.fillRect(ix * cell + 1.5, iy * cell + 1.5, cell - 3, cell - 3);

        // Weathering blooms, heavier toward slab edges where water sits.
        for (let k = 0; k < 5; k++) {
          const bx = ix * cell + Math.random() * cell;
          const by = iy * cell + Math.random() * cell;
          const br = 6 + Math.random() * 22;
          const grad = g.createRadialGradient(bx, by, 0, bx, by, br);
          const dark = Math.random() > 0.55;
          grad.addColorStop(
            0,
            dark ? 'rgba(120, 118, 98, 0.16)' : 'rgba(240, 236, 220, 0.16)',
          );
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.fillRect(bx - br, by - br, br * 2, br * 2);
        }
      }
    }

    // Joint shadow.
    g.strokeStyle = 'rgba(122, 116, 98, 0.5)';
    g.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      const p = cell * i;
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 1024);
      g.moveTo(0, p);
      g.lineTo(1024, p);
      g.stroke();
    }

    // Fine grit over everything, so the slabs don't read as plastic.
    for (let i = 0; i < 9000; i++) {
      g.fillStyle =
        Math.random() > 0.5
          ? `rgba(255,252,242,${Math.random() * 0.3})`
          : `rgba(110,104,88,${Math.random() * 0.22})`;
      g.fillRect(Math.random() * 1024, Math.random() * 1024, 1.7, 1.7);
    }

    return c;
  });
}

/** Swept earth beyond the paving — mottled, no hard structure. */
export function earthMaps() {
  return pbr('earth', { normalStrength: 0.9, rough: [0.86, 1.0] }, () => {
    const c = canvas(512);
    const g = c.getContext('2d');
    g.fillStyle = palette.cream;
    g.fillRect(0, 0, 512, 512);

    // Broad tonal drifts. Low frequency on purpose — this is read at distance and
    // any tight pattern would tile visibly.
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 30 + Math.random() * 95;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const sage = Math.random() > 0.55;
      grad.addColorStop(
        0,
        sage ? 'rgba(147, 169, 141, 0.16)' : 'rgba(198, 186, 158, 0.2)',
      );
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    for (let i = 0; i < 3500; i++) {
      g.fillStyle = `rgba(150,142,120,${Math.random() * 0.16})`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    return c;
  });
}

/**
 * Pendopo floor — polished tile laid on the diagonal with a diamond inlay.
 *
 * Read through the gaps between columns from every beat outside, and underfoot
 * for the whole interior beat, so it earns real pattern rather than the plain
 * stone the platform sides use.
 */
export function floorMaps() {
  // Polished tile — joints and the inlaid diamond stay matte, the field is glossy.
  return pbr('floor', { normalStrength: 1.5, rough: [0.1, 0.62] }, () => {
    const c = canvas(1024);
    const g = c.getContext('2d');
    g.fillStyle = palette.paper;
    g.fillRect(0, 0, 1024, 1024);

    const n = 6;
    const cell = 1024 / n;

    for (let ix = 0; ix < n; ix++) {
      for (let iy = 0; iy < n; iy++) {
        const x = ix * cell;
        const y = iy * cell;
        const alt = (ix + iy) % 2 === 0;

        // Alternating warm/cool tiles, each with slight per-tile variation so the
        // checker doesn't read as a printed grid.
        const j = (Math.random() - 0.5) * 9;
        g.fillStyle = alt
          ? `rgb(${239 + j}, ${235 + j}, ${221 + j})`
          : `rgb(${222 + j}, ${222 + j}, ${208 + j})`;
        g.fillRect(x + 2, y + 2, cell - 4, cell - 4);

        // Inlaid diamond on the darker tiles.
        if (!alt) {
          g.save();
          g.translate(x + cell / 2, y + cell / 2);
          g.rotate(Math.PI / 4);
          const d = cell * 0.26;
          g.fillStyle = 'rgba(44, 74, 52, 0.16)';
          g.fillRect(-d, -d, d * 2, d * 2);
          g.strokeStyle = 'rgba(201, 163, 78, 0.55)';
          g.lineWidth = 2.5;
          g.strokeRect(-d, -d, d * 2, d * 2);
          g.restore();
        }

        // Polish sheen — a soft highlight biased to one corner of each tile.
        const grad = g.createLinearGradient(x, y, x + cell, y + cell);
        grad.addColorStop(0, 'rgba(255,255,255,0.16)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(120,116,100,0.07)');
        g.fillStyle = grad;
        g.fillRect(x + 2, y + 2, cell - 4, cell - 4);
      }
    }

    // Joints.
    g.strokeStyle = 'rgba(120, 114, 96, 0.42)';
    g.lineWidth = 2.5;
    for (let i = 0; i <= n; i++) {
      const p = cell * i;
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 1024);
      g.moveTo(0, p);
      g.lineTo(1024, p);
      g.stroke();
    }

    return c;
  });
}

/**
 * Foliage — overlapping leaf clusters.
 *
 * Geometry alone cannot make a canopy look real at this budget: a subdivided
 * sphere is still a sphere. What sells it is breaking the surface *within* each
 * clump, so the normal map derived from this is doing most of the work — the
 * canopy picks up hundreds of small light and shade events instead of shading as
 * one smooth mass.
 */
export function foliageMaps() {
  return pbr('foliage', { normalStrength: 2.6, rough: [0.72, 0.98] }, () => {
    const c = canvas(1024);
    const g = c.getContext('2d');
    g.fillStyle = '#2F4A33';
    g.fillRect(0, 0, 1024, 1024);

    // Broad tonal patches first, so the leaves below sit on varied ground rather
    // than a flat field.
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = 60 + Math.random() * 170;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(
        0,
        Math.random() > 0.5 ? 'rgba(126,150,110,0.3)' : 'rgba(22,38,26,0.34)',
      );
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Individual leaves. Drawn with wrap-around copies so the tile seams cleanly —
    // a hard edge here would ring the canopy with a visible band.
    const leaf = (x, y, s, rot, fill) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(0, -s);
      g.quadraticCurveTo(s * 0.62, -s * 0.15, 0, s);
      g.quadraticCurveTo(-s * 0.62, -s * 0.15, 0, -s);
      g.fill();
      // Midrib.
      g.strokeStyle = 'rgba(20,34,22,0.3)';
      g.lineWidth = Math.max(0.7, s * 0.07);
      g.beginPath();
      g.moveTo(0, -s * 0.85);
      g.lineTo(0, s * 0.85);
      g.stroke();
      g.restore();
    };

    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const s = 7 + Math.random() * 15;
      const rot = Math.random() * Math.PI * 2;
      const t = Math.random();
      const fill =
        t > 0.72
          ? `rgba(150,176,132,${0.5 + Math.random() * 0.4})`
          : t > 0.34
            ? `rgba(74,104,72,${0.5 + Math.random() * 0.4})`
            : `rgba(30,50,34,${0.5 + Math.random() * 0.4})`;

      for (const dx of [-1024, 0, 1024]) {
        for (const dy of [-1024, 0, 1024]) {
          // Only bother with the wrap copies near an edge.
          if (dx !== 0 && x > 60 && x < 964) continue;
          if (dy !== 0 && y > 60 && y < 964) continue;
          leaf(x + dx, y + dy, s, rot, fill);
        }
      }
    }

    return c;
  });
}

/**
 * Batik sogan for the dancer's jarik — the wrapped skirt in the reference photo.
 *
 * Different cloth from the ceiling `batik`: that one is the cream/green parang of
 * the moodboard, this is the warm brown-and-gold sogan a jarik is actually dyed in.
 * Motif is kawung — interlocking ellipses — rather than parang, because kawung
 * reads better at the scale a skirt occupies on screen.
 */
export function jaritMaps() {
  return pbr('jarit', { normalStrength: 1.3, rough: [0.62, 0.92] }, () => {
    const c = canvas(1024);
    const g = c.getContext('2d');
    g.fillStyle = '#6B4423'; // sogan brown ground
    g.fillRect(0, 0, 1024, 1024);

    // Kawung: four ellipses around each grid point, on a staggered lattice.
    const step = 128;
    for (let gy = 0; gy <= 1024 / step; gy++) {
      for (let gx = 0; gx <= 1024 / step; gx++) {
        const cx = gx * step + (gy % 2 ? step / 2 : 0);
        const cy = gy * step;

        for (let k = 0; k < 4; k++) {
          const a = (Math.PI / 2) * k + Math.PI / 4;
          const ox = cx + Math.cos(a) * step * 0.26;
          const oy = cy + Math.sin(a) * step * 0.26;

          g.save();
          g.translate(ox, oy);
          g.rotate(a);
          g.fillStyle = '#C89B4A';
          g.beginPath();
          g.ellipse(0, 0, step * 0.2, step * 0.31, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#4A2E15';
          g.beginPath();
          g.ellipse(0, 0, step * 0.13, step * 0.22, 0, 0, Math.PI * 2);
          g.fill();
          // Isen-isen — the tiny filler dots that make batik read as hand-drawn.
          g.fillStyle = '#E4C88A';
          for (let d = 0; d < 3; d++) {
            g.beginPath();
            g.arc((Math.random() - 0.5) * step * 0.16, (Math.random() - 0.5) * step * 0.3, 1.6, 0, Math.PI * 2);
            g.fill();
          }
          g.restore();
        }

        // Centre boss.
        g.fillStyle = '#8B5E2A';
        g.beginPath();
        g.arc(cx, cy, step * 0.075, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Wax-crackle: the fine irregular veining that only hand-waxed cloth has.
    g.strokeStyle = 'rgba(38, 22, 10, 0.28)';
    g.lineWidth = 1.1;
    for (let i = 0; i < 130; i++) {
      let x = Math.random() * 1024;
      let y = Math.random() * 1024;
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 7; s++) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        g.lineTo(x, y);
      }
      g.stroke();
    }

    return c;
  });
}

/**
 * Fine woven fabric — the kebaya. Almost flat colour; the point is purely the
 * weave, which the derived normal map turns into a soft sheen under raking light
 * so the garment doesn't read as painted plastic.
 */
export function fabricMaps() {
  return pbr('fabric', { normalStrength: 0.85, rough: [0.66, 0.9] }, () => {
    const c = canvas(512);
    const g = c.getContext('2d');
    g.fillStyle = '#F2F2F2';
    g.fillRect(0, 0, 512, 512);

    // Plain weave: alternating warp and weft.
    for (let y = 0; y < 512; y += 4) {
      g.fillStyle = 'rgba(180,180,180,0.5)';
      g.fillRect(0, y, 512, 2);
    }
    for (let x = 0; x < 512; x += 4) {
      g.fillStyle = 'rgba(255,255,255,0.4)';
      g.fillRect(x, 0, 2, 512);
    }
    // Slub — occasional thicker threads, so the weave isn't perfectly regular.
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(150,150,150,${0.1 + Math.random() * 0.2})`;
      const horizontal = Math.random() > 0.5;
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      if (horizontal) g.fillRect(x, y, 20 + Math.random() * 50, 2);
      else g.fillRect(x, y, 2, 20 + Math.random() * 50);
    }

    return c;
  });
}

/** Soft radial alpha — dust motes and the god-ray billboards. */
export function glowTexture() {
  return memo('glow', () => {
    const c = canvas(128);
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 246, 220, 1)');
    grad.addColorStop(0.35, 'rgba(224, 188, 107, 0.5)');
    grad.addColorStop(1, 'rgba(224, 188, 107, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/**
 * Albedo-only accessors.
 *
 * Kept for the handful of places that genuinely want a colour map and nothing
 * else — decorative planes, tinted overlays. Anything lit should take the whole
 * `*Maps()` set instead, or it throws away the relief that makes the surface read
 * as a material rather than a painted card.
 */
export const timberTexture = () => timberMaps().map;
export const stoneTexture = () => stoneMaps().map;
export const roofTexture = () => roofMaps().map;
export const batikTexture = () => batikMaps().map;
export const ornamentTexture = () => ornamentMaps().map;
export const courtyardTexture = () => courtyardMaps().map;
export const earthTexture = () => earthMaps().map;
export const floorTexture = () => floorMaps().map;

/**
 * Applies a PBR set to a material, cloning the textures so each surface can carry
 * its own UV repeat without the shared cache entry being mutated underneath it.
 *
 * `repeat` is a [u, v] pair; a single number means square tiling.
 */
export function applyMaps(material, maps, repeat = 1, normalScale = 1) {
  const [u, v] = Array.isArray(repeat) ? repeat : [repeat, repeat];

  for (const slot of ['map', 'normalMap', 'roughnessMap']) {
    const src = maps[slot];
    if (!src) continue;
    const tex = src.clone();
    tex.needsUpdate = true;
    tex.repeat.set(u, v);
    material[slot] = tex;
  }

  if (material.normalScale) material.normalScale.set(normalScale, normalScale);
  material.needsUpdate = true;
  return material;
}

export function disposeTextures() {
  cache.forEach((entry) => {
    if (entry?.isTexture) {
      entry.dispose();
      return;
    }
    entry?.map?.dispose();
    entry?.normalMap?.dispose();
    entry?.roughnessMap?.dispose();
  });
  cache.clear();
}
