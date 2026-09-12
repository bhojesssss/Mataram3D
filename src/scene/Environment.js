import * as THREE from 'three';
import { palette, sceneColors } from '../config/tokens.js';
import {
  glowTexture,
  courtyardMaps,
  earthMaps,
  stoneMaps,
  timberMaps,
  foliageMaps,
  applyMaps,
} from './textures.js';

/**
 * Everything around the pendopo: sky, ground, the Merapi ridgelines, tree rings,
 * and the drifting mist bands.
 *
 * Depth is the whole job of this file. It is built from stacked layers at genuinely
 * different distances, each one lower in contrast and closer to the fog colour than
 * the one in front of it. That is real aerial perspective rather than a blur, so
 * when the camera dollies the layers separate on their own — no parallax faking.
 *
 *   z ≈  +46   foreground branches (frames the hero, drifts fastest)
 *   z ≈  +18   near tree ring
 *   z ≈    0   the pendopo itself
 *   z ≈  -60   far tree ring
 *   z ≈ -170   ridge A   (nearest mountains, most contrast)
 *   z ≈ -260   ridge B
 *   z ≈ -360   ridge C   (almost fog colour — reads as distance, not as an object)
 */

/** Deterministic PRNG so the tree scatter is identical on every reload. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws a mountain profile into an alpha canvas.
 *
 * Earlier version summed random sines, which at low frequency produced one huge
 * smooth dome spanning the whole sky and, with per-pixel jitter, a sawtooth edge.
 * Neither reads as a mountain. This version composes the silhouette the way the
 * real skyline north of the kraton is composed: rolling forested foothills with
 * distinct stratovolcano cones rising out of them. Cone flanks use a power-curve
 * falloff, which gives the concave profile characteristic of Merapi, and the
 * summit is softly truncated rather than needle-sharp.
 *
 * @param {number} seed
 * @param {{u:number,h:number,w:number}[]} cones  volcano cones: `u` horizontal
 *        position 0..1, `h` height as a fraction of canvas height, `w` half-width
 *        as a fraction of canvas width
 * @param {number} base      baseline of the range, fraction of height from top
 * @param {number} foothill  amplitude of the rolling hills under the cones
 * @param {number} rough     amplitude of fine surface relief (kept smooth — it is
 *        interpolated value noise, not per-pixel jitter, so no sawtooth)
 */
function ridgeTexture(seed, cones, base, foothill, rough) {
  const w = 2048;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);

  // Cosine-interpolated value noise over a coarse node array — smooth undulation
  // with no high-frequency artefacts.
  const nodes = (n) => Array.from({ length: n }, () => rnd());
  const noiseAt = (ns, t) => {
    const x = t * (ns.length - 1);
    const i = Math.floor(x);
    const s = (1 - Math.cos((x - i) * Math.PI)) / 2;
    return ns[i] * (1 - s) + ns[Math.min(i + 1, ns.length - 1)] * s;
  };
  const coarse = nodes(18);
  const fine = nodes(80);

  g.clearRect(0, 0, w, h);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(0, h);

  for (let x = 0; x <= w; x += 2) {
    const t = x / w;
    // Rolling foothills form the floor of the range…
    let up = noiseAt(coarse, t) * foothill;
    // …and the volcano cones rise out of them. max() lets a cone swallow the
    // hills at its base instead of stacking on top of them.
    for (const p of cones) {
      const d = Math.abs(t - p.u) / p.w;
      if (d < 1) up = Math.max(up, Math.min(Math.pow(1 - d, 1.55), 0.96) * p.h);
    }
    up += (noiseAt(fine, t) - 0.5) * rough;
    g.lineTo(x, h * (base - up));
  }

  g.lineTo(w, h);
  g.closePath();
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SKY_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/**
 * Three-stop vertical gradient plus a directional warm bloom around the sun. The
 * bloom is what sells the "golden hour" read at the later scroll beats — uniforms
 * are driven from Scene.js as the light shifts.
 */
const SKY_FRAG = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uLow;
  uniform vec3 uMid;
  uniform vec3 uHigh;
  uniform vec3 uSunDir;
  uniform float uSunStrength;

  void main() {
    vec3 dir = normalize(vWorld);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

    vec3 col = mix(uLow, uMid, smoothstep(0.42, 0.56, h));
    col = mix(col, uHigh, smoothstep(0.55, 0.9, h));

    float sun = max(dot(dir, normalize(uSunDir)), 0.0);
    col += uSunStrength * pow(sun, 7.0) * vec3(1.0, 0.86, 0.62);
    col += uSunStrength * 0.28 * pow(sun, 2.0) * vec3(1.0, 0.9, 0.74);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class Environment extends THREE.Group {
  /** @param {{treeDetailBias?: number}} tier  render quality tier, see config/quality.js */
  constructor(tier = {}) {
    super();
    this.name = 'environment';
    this.tier = tier;
    this._disposables = [];

    this._buildSky();
    this._buildGround();
    this._buildWall();
    this._buildFence();
    this._buildRidges();
    this._buildTrees();
    this._buildForeground();
    this._buildMist();
  }

  _track(x) {
    this._disposables.push(x);
    return x;
  }

  _buildSky() {
    const geo = this._track(new THREE.SphereGeometry(900, 32, 20));
    this.skyUniforms = {
      uLow: { value: new THREE.Color(sceneColors.skyLow) },
      uMid: { value: new THREE.Color(palette.paper) },
      uHigh: { value: new THREE.Color(sceneColors.skyHigh) },
      // Overwritten by Scene from its SUN_DIR so the glare and the shadows agree;
      // this value only matters if the sky is ever used standalone.
      uSunDir: { value: new THREE.Vector3(-0.42, 0.38, -0.93).normalize() },
      uSunStrength: { value: 0.55 },
    };
    const mat = this._track(
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: this.skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    );
    const sky = new THREE.Mesh(geo, mat);
    sky.name = 'sky';
    this.add(sky);
    this.sky = sky;
  }

  /**
   * The ground, in three parts rather than one flat disc.
   *
   * A single untextured plane was the largest area of nothing left in the frame —
   * it fills the bottom third of the hero and gave the eye no way to read distance
   * or scale. Splitting it into a paved courtyard, a kerb, and swept earth beyond
   * costs three draw calls and does more for perceived detail than anything on the
   * building itself.
   */
  _buildGround() {
    const g = new THREE.Group();

    // Swept earth, out to the fog.
    const earth = new THREE.Mesh(
      this._track(new THREE.CircleGeometry(240, 96)),
      this._track(
        applyMaps(
          new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }),
          earthMaps(),
          22,
          0.6,
        ),
      ),
    );
    earth.rotation.x = -Math.PI / 2;
    earth.position.y = -0.04;
    earth.receiveShadow = true;
    g.add(earth);

    // Paved courtyard. Square, matching the pendopo — a keraton plaza is laid out
    // on the building's axes, not as a circle around it.
    const PLAZA = 38;
    // One texture tile per fixed span of world space keeps the slab size constant
    // regardless of how the plaza is resized.
    const plaza = new THREE.Mesh(
      this._track(new THREE.PlaneGeometry(PLAZA * 2, PLAZA * 2)),
      this._track(
        applyMaps(
          new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }),
          courtyardMaps(),
          PLAZA / 4.75,
          1.25,
        ),
      ),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0;
    plaza.receiveShadow = true;
    g.add(plaza);

    // Kerb ringing the paving — a raised lip that catches the low sun and draws
    // the plaza's edge instead of letting the two surfaces blend into a smudge.
    const kerbMat = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }),
        stoneMaps(),
        [20, 1],
        1.1,
      ),
    );
    const kerbLong = this._track(new THREE.BoxGeometry(PLAZA * 2 + 1.2, 0.34, 0.6));
    for (let s = 0; s < 4; s++) {
      const k = new THREE.Mesh(kerbLong, kerbMat);
      k.rotation.y = (Math.PI / 2) * s;
      k.position.set(
        s === 1 ? PLAZA : s === 3 ? -PLAZA : 0,
        0.14,
        s === 0 ? PLAZA : s === 2 ? -PLAZA : 0,
      );
      k.receiveShadow = true;
      k.castShadow = true;
      g.add(k);
    }

    this.add(g);
    this.ground = g;
  }

  /**
   * Perimeter wall of the compound, with the entry left open on the +Z axis the
   * camera flies down.
   *
   * Its job is scale. Without an enclosure the pendopo reads as an object sitting
   * on an infinite plane; with one it reads as a building inside a compound, and
   * the trees beyond become "outside" rather than scattered scenery.
   */
  _buildWall() {
    const g = new THREE.Group();
    const R = 52;
    const H = 2.4;

    const mat = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(palette.cream).multiplyScalar(0.9),
          roughness: 1,
          metalness: 0,
        }),
        stoneMaps(),
        [26, 1],
        1.2,
      ),
    );

    const capMat = this._track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(sceneColors.stoneShadow),
        roughness: 0.85,
        metalness: 0,
      }),
    );

    /** One straight run of wall plus its coping. */
    const run = (len, x, z, ry) => {
      const body = new THREE.Mesh(this._track(new THREE.BoxGeometry(len, H, 0.7)), mat);
      body.position.set(x, H / 2, z);
      body.rotation.y = ry;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);

      const cap = new THREE.Mesh(this._track(new THREE.BoxGeometry(len, 0.26, 1.05)), capMat);
      cap.position.set(x, H + 0.13, z);
      cap.rotation.y = ry;
      cap.castShadow = true;
      g.add(cap);
    };

    // Back and sides are continuous.
    run(R * 2, 0, -R, 0);
    run(R * 2, -R, 0, Math.PI / 2);
    run(R * 2, R, 0, Math.PI / 2);

    // Front is split around the ceremonial entry.
    //
    // The gap is wide (34) for a compositional reason, not a historical one: the
    // hero camera sits at z=66, only 14 units behind this wall, so piers set at
    // the edge of a narrow opening loom into the bottom corners of the title shot.
    // At ±17 they fall outside the opening frustum and instead sweep into frame
    // during the approach beat, which is where a gate should announce itself.
    const GAP = 34;
    const half = (R * 2 - GAP) / 2;
    for (const side of [-1, 1]) run(half, side * (R - half / 2), R, 0);

    const pierGeo = this._track(new THREE.BoxGeometry(1.5, H + 1.4, 1.5));
    const capGeo = this._track(new THREE.ConeGeometry(1.2, 1.25, 4));
    for (const side of [-1, 1]) {
      const pier = new THREE.Mesh(pierGeo, mat);
      pier.position.set((side * GAP) / 2, (H + 1.4) / 2, R);
      pier.castShadow = true;
      g.add(pier);

      const finial = new THREE.Mesh(capGeo, mat);
      finial.rotation.y = Math.PI / 4;
      finial.position.set((side * GAP) / 2, H + 1.4 + 0.62, R);
      finial.castShadow = true;
      g.add(finial);
    }

    this.add(g);
    this.wall = g;
  }

  /**
   * Inner pagar — a low ornamental fence ringing the pendopo itself, inside the
   * compound wall. Cream masonry piers carry two dark timber rails over a stone
   * plinth, with a wider gold-topped gate on the +Z axis lining up with both the
   * compound gateway and the camera's approach path. The ring sits at ±24: clear
   * of the 32-wide deck and its stairs, but close enough that in the hero shot
   * it visibly belongs to the pendopo rather than to the plaza edge.
   *
   * The camera crosses z=24 at roughly y=4.2 on its way in, well above the
   * 1.9-high gate piers, so nothing here can clip into the lens.
   */
  _buildFence() {
    const g = new THREE.Group();
    const F = 24; // half-extent of the square ring
    const GATE = 10; // opening width on the +Z side
    const STEP = 4; // pier spacing

    const pierMat = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(palette.cream).multiplyScalar(0.94),
          roughness: 1,
          metalness: 0,
        }),
        stoneMaps(),
        [1, 1],
        1.1,
      ),
    );
    const capMat = this._track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(sceneColors.stoneShadow),
        roughness: 0.85,
        metalness: 0,
      }),
    );
    const railMat = this._track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(sceneColors.timberDark),
        roughness: 0.8,
        metalness: 0,
      }),
    );
    const goldMat = this._track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(sceneColors.goldWarm),
        roughness: 0.45,
        metalness: 0.6,
      }),
    );

    // ── piers ──────────────────────────────────────────────────────────────
    // Laid out first, then drawn as two InstancedMeshes (bodies + caps) so the
    // whole ring of ~48 posts costs two draw calls.
    const spots = [];
    const n = Math.round((F * 2) / STEP);
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i <= n; i++) {
        const u = -F + i * STEP;
        const [x, z] =
          side === 0 ? [u, F] : side === 1 ? [u, -F] : side === 2 ? [F, u] : [-F, u];
        // The front row leaves the gate span open; the side rows skip their end
        // posts because the front/back rows already placed the corners.
        if (side === 0 && Math.abs(x) < GATE / 2 + 0.01) continue;
        if (side >= 2 && Math.abs(u) === F) continue;
        spots.push([x, z]);
      }
    }

    const pierGeo = this._track(new THREE.BoxGeometry(0.42, 1.25, 0.42));
    const pierCapGeo = this._track(new THREE.ConeGeometry(0.36, 0.3, 4));
    const bodies = new THREE.InstancedMesh(pierGeo, pierMat, spots.length);
    const caps = new THREE.InstancedMesh(pierCapGeo, capMat, spots.length);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < spots.length; i++) {
      dummy.position.set(spots[i][0], 1.25 / 2, spots[i][1]);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      bodies.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 1.25 + 0.15;
      dummy.rotation.y = Math.PI / 4;
      dummy.updateMatrix();
      caps.setMatrixAt(i, dummy.matrix);
    }
    for (const inst of [bodies, caps]) {
      inst.instanceMatrix.needsUpdate = true;
      inst.castShadow = true;
      inst.receiveShadow = true;
      g.add(inst);
    }

    // ── rails and plinth ───────────────────────────────────────────────────
    /** One straight run: a low stone plinth with two timber rails above it. */
    const run = (len, x, z, ry) => {
      const plinth = new THREE.Mesh(
        this._track(new THREE.BoxGeometry(len, 0.22, 0.36)),
        pierMat,
      );
      plinth.position.set(x, 0.11, z);
      plinth.rotation.y = ry;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      g.add(plinth);

      for (const ry2 of [0.55, 0.98]) {
        const rail = new THREE.Mesh(
          this._track(new THREE.BoxGeometry(len, 0.09, 0.14)),
          railMat,
        );
        rail.position.set(x, ry2, z);
        rail.rotation.y = ry;
        rail.castShadow = true;
        g.add(rail);
      }
    };

    // Back and sides run the full length; the front splits around the gate.
    run(F * 2 + 0.4, 0, -F, 0);
    run(F * 2 + 0.4, -F, 0, Math.PI / 2);
    run(F * 2 + 0.4, F, 0, Math.PI / 2);
    const half = F - GATE / 2;
    for (const side of [-1, 1]) run(half, side * (GATE / 2 + half / 2), F, 0);

    // ── gate ───────────────────────────────────────────────────────────────
    // Two heavier piers with gold finials mark the entry, echoing the compound
    // gateway behind them at a smaller scale.
    const gatePierGeo = this._track(new THREE.BoxGeometry(0.7, 1.9, 0.7));
    const finialGeo = this._track(new THREE.ConeGeometry(0.5, 0.62, 4));
    for (const side of [-1, 1]) {
      const pier = new THREE.Mesh(gatePierGeo, pierMat);
      pier.position.set((side * GATE) / 2, 1.9 / 2, F);
      pier.castShadow = true;
      pier.receiveShadow = true;
      g.add(pier);

      const finial = new THREE.Mesh(finialGeo, goldMat);
      finial.rotation.y = Math.PI / 4;
      finial.position.set((side * GATE) / 2, 1.9 + 0.31, F);
      finial.castShadow = true;
      g.add(finial);
    }

    this.add(g);
    this.fence = g;
  }

  /**
   * Three ridgelines. Each is further, larger, paler and less contrasty than the
   * last — the whole depth cue in three meshes.
   *
   * Cone placement is art-directed, not random. The camera never yaws off the +Z
   * axis, so the skyline is a fixed composition: the big volcano sits well left
   * of centre and its companion right of centre, keeping both clear of the title
   * block and the pendopo's roofline in the hero shot. The near layer is
   * deliberately cone-free — from the kraton the volcanoes are far away, so they
   * belong on the palest, most distant layer, with only forested hills nearby.
   */
  _buildRidges() {
    this.ridges = [];
    const fogCol = new THREE.Color(sceneColors.skyLow);

    const specs = [
      // Near forested foothills — low, rolling, no cones.
      { z: -170, w: 900, h: 150, y: 14, seed: 11, base: 0.58, foothill: 0.15, rough: 0.022,
        cones: [{ u: 0.72, h: 0.24, w: 0.2 }],
        tint: sceneColors.forestDeep, mix: 0.4 },
      // Mid ridge — two gentle humps.
      { z: -260, w: 1300, h: 200, y: 26, seed: 27, base: 0.6, foothill: 0.13, rough: 0.016,
        cones: [{ u: 0.2, h: 0.36, w: 0.15 }, { u: 0.84, h: 0.28, w: 0.12 }],
        tint: palette.forest, mix: 0.62 },
      // Far volcano pair — Merapi left of centre, a lower companion to the right.
      { z: -360, w: 1800, h: 230, y: 40, seed: 43, base: 0.62, foothill: 0.09, rough: 0.01,
        cones: [{ u: 0.33, h: 0.5, w: 0.085 }, { u: 0.62, h: 0.34, w: 0.07 }],
        tint: palette.sage, mix: 0.78 },
    ];

    for (const s of specs) {
      const tex = this._track(ridgeTexture(s.seed, s.cones, s.base, s.foothill, s.rough));
      // Lerping the silhouette toward fog colour is what makes it read as distant.
      const col = new THREE.Color(s.tint).lerp(fogCol, s.mix);
      const mat = this._track(
        new THREE.MeshBasicMaterial({
          map: tex,
          color: col,
          transparent: true,
          depthWrite: false,
          fog: false,
        }),
      );
      const mesh = new THREE.Mesh(this._track(new THREE.PlaneGeometry(s.w, s.h)), mat);
      mesh.position.set(0, s.y, s.z);
      mesh.renderOrder = -10 + this.ridges.length;
      this.add(mesh);
      this.ridges.push(mesh);
    }
  }

  /**
   * Builds one tree.
   *
   * The first pass used three big spheres on a stick, which at any size reads as
   * broccoli — a smooth silhouette has no foliage in it. What makes a canopy look
   * like a canopy is a *broken* outline, so the leaf mass here is assembled from
   * ~20 small angular clumps scattered on an oblate envelope, each independently
   * scaled, squashed and rotated. Same polygon budget, completely different read.
   *
   * Trunks branch rather than going straight up: a forked trunk with a few limbs
   * carrying the clumps is what separates a tree from a lollipop.
   *
   * @param {'waringin'|'tall'|'low'} variant
   * @param {number} seed  deterministic — same variant always builds identically
   */
  _treeGeometry(variant = 'waringin', seed = 1, detail = 1) {
    const rnd = mulberry32(seed);
    // Wood and leaves are returned separately so each can take its own material.
    // One material across the whole tree meant either bark on the canopy or leaves
    // on the trunk; splitting costs one extra draw call per variant per ring.
    const wood = [];
    const leaves = [];

    // Per-variant proportions.
    const spec = {
      waringin: { h: 4.0, r0: 0.62, r1: 0.34, limbs: 5, clumps: 22, cw: 3.1, ch: 1.9, cy: 5.0 },
      tall:     { h: 6.4, r0: 0.42, r1: 0.22, limbs: 4, clumps: 16, cw: 2.0, ch: 2.4, cy: 7.4 },
      low:      { h: 2.2, r0: 0.5,  r1: 0.3,  limbs: 3, clumps: 13, cw: 2.3, ch: 1.4, cy: 3.0 },
    }[variant];

    // ── trunk ──────────────────────────────────────────────────────────────
    // Two stacked sections with a slight lean give a taper that isn't a cone.
    const sides = detail >= 1 ? 14 : 8;

    const lower = new THREE.CylinderGeometry(spec.r0 * 0.78, spec.r0, spec.h * 0.6, sides);
    lower.translate(0, spec.h * 0.3, 0);
    wood.push(lower);

    const upper = new THREE.CylinderGeometry(spec.r1, spec.r0 * 0.78, spec.h * 0.45, sides);
    upper.translate(0, spec.h * 0.6 + spec.h * 0.225, 0);
    wood.push(upper);

    // Root flare — a wider, very short skirt so the trunk meets the ground
    // instead of being stuck into it.
    const flare = new THREE.CylinderGeometry(spec.r0, spec.r0 * 1.5, 0.45, sides);
    flare.translate(0, 0.22, 0);
    wood.push(flare);

    // ── limbs ──────────────────────────────────────────────────────────────
    // Each limb angles out and up from the crown of the trunk. Their far ends are
    // where the foliage clumps get anchored, so the canopy hangs off structure.
    const limbEnds = [];
    for (let i = 0; i < spec.limbs; i++) {
      const a = (i / spec.limbs) * Math.PI * 2 + rnd() * 0.7;
      const tilt = 0.55 + rnd() * 0.45; // radians from vertical
      const len = spec.h * (0.42 + rnd() * 0.3);
      const base = spec.h * (0.62 + rnd() * 0.16);

      const limb = new THREE.CylinderGeometry(
        spec.r1 * 0.34,
        spec.r1 * 0.72,
        len,
        detail >= 1 ? 10 : 6,
      );
      // Cylinders are built centred on Y; shift up so it grows from the origin.
      limb.translate(0, len / 2, 0);
      limb.rotateZ(tilt);
      limb.rotateY(a);
      limb.translate(0, base, 0);
      wood.push(limb);

      limbEnds.push({
        x: Math.sin(tilt) * len * Math.cos(a),
        y: base + Math.cos(tilt) * len,
        z: -Math.sin(tilt) * len * Math.sin(a),
      });
    }

    // ── foliage ────────────────────────────────────────────────────────────
    for (let i = 0; i < spec.clumps; i++) {
      // Two thirds of the clumps sit on limb ends, the rest fill the envelope —
      // pure envelope-filling drifts back toward a smooth ball.
      let cx, cy, cz;
      if (i < limbEnds.length * 2 && limbEnds.length) {
        const e = limbEnds[i % limbEnds.length];
        cx = e.x + (rnd() - 0.5) * 1.5;
        cy = e.y + (rnd() - 0.3) * 1.0;
        cz = e.z + (rnd() - 0.5) * 1.5;
      } else {
        const a = rnd() * Math.PI * 2;
        // sqrt keeps the scatter area-uniform instead of crowding the centre.
        const rad = Math.sqrt(rnd()) * spec.cw;
        cx = Math.cos(a) * rad;
        cz = Math.sin(a) * rad;
        cy = spec.cy + (rnd() - 0.5) * spec.ch;
      }

      const r = 0.72 + rnd() * 0.85;
      // Subdivision is the LOD dial: 0 = 20 faces for the far rings where a clump
      // is a few pixels, 2 = 320 faces for the near ring the camera passes.
      const clump = new THREE.IcosahedronGeometry(r, detail);
      // Squash vertically — real canopies are wider than they are tall.
      clump.scale(1.0 + rnd() * 0.5, 0.62 + rnd() * 0.3, 1.0 + rnd() * 0.5);
      clump.rotateY(rnd() * Math.PI);
      clump.rotateX((rnd() - 0.5) * 0.8);
      clump.translate(cx, cy, cz);
      leaves.push(clump);
    }

    return { wood: mergeGeometries(wood), foliage: mergeGeometries(leaves) };
  }

  _buildTrees() {
    this.treeRings = [];

    const seeds = { waringin: 1201, tall: 3307, low: 5501 };

    // Geometry cache keyed by variant *and* LOD. Three silhouettes so the eye
    // can't pick out a repeat, three subdivision levels so the near ring can be
    // dense without paying for it 124 times.
    const geoCache = new Map();
    const geoFor = (variant, detail) => {
      const key = `${variant}:${detail}`;
      if (!geoCache.has(key)) {
        const built = this._treeGeometry(variant, seeds[variant], detail);
        this._track(built.wood);
        this._track(built.foliage);
        geoCache.set(key, built);
      }
      return geoCache.get(key);
    };

    const rings = [
      // detail = icosahedron subdivision for the leaf clumps. The near ring is what
      // the camera actually passes; the far ring is a few pixels per clump.
      { count: 30, radius: 56, spread: 14, scale: 0.85, seed: 5, detail: 2, mix: 0.1,
        weights: { waringin: 0.5, tall: 0.2, low: 0.3 } },
      { count: 44, radius: 96, spread: 26, scale: 1.3, seed: 91, detail: 1, mix: 0.34,
        weights: { waringin: 0.45, tall: 0.4, low: 0.15 } },
      { count: 50, radius: 152, spread: 34, scale: 1.75, seed: 77, detail: 0, mix: 0.56,
        weights: { waringin: 0.35, tall: 0.5, low: 0.15 } },
    ];

    const foliage = foliageMaps();
    const bark = timberMaps();
    const fogCol = new THREE.Color(sceneColors.skyLow);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();

    for (const r of rings) {
      const rnd = mulberry32(r.seed);
      // The leaf map supplies the green, so this is a tint, not the colour. Pulling
      // it toward the fog hue desaturates distant rings; the scene's exponential
      // fog then does the rest of the aerial perspective in the shader.
      const base = new THREE.Color(0xffffff).lerp(fogCol, r.mix);

      // Lay out every tree in the ring first, tagging each with its variant, then
      // group by variant. One InstancedMesh per variant per ring — nine draw calls
      // for 124 trees.
      const buckets = { waringin: [], tall: [], low: [] };
      const names = Object.keys(buckets);

      for (let i = 0; i < r.count; i++) {
        let a = rnd() * Math.PI * 2;

        // Keep the +Z approach corridor clear. The camera flies straight down it
        // from z=66 to the pendopo, so a near tree anywhere in front simply blocks
        // the hero shot. Position is (sin a, 0, cos a) — "in front" is cos a > 0.
        // Mirroring across the x-axis moves the offender to the far side without
        // disturbing the ring's overall density.
        if (r.radius < 70) {
          const inCorridor = Math.cos(a) > 0.1 && Math.abs(Math.sin(a)) < 0.66;
          if (inCorridor) a = Math.PI - a;
        }

        // Weighted variant pick.
        const roll = rnd();
        let acc = 0;
        let pick = names[0];
        for (const n of names) {
          acc += r.weights[n];
          if (roll <= acc) {
            pick = n;
            break;
          }
        }

        buckets[pick].push({
          rad: r.radius + (rnd() - 0.5) * r.spread,
          a,
          s: r.scale * (0.72 + rnd() * 0.62),
          ry: rnd() * Math.PI * 2,
          // Per-instance tint: a little lighter or darker, and a touch warmer or
          // cooler. Uniform colour across a stand of trees is a dead giveaway.
          shade: 0.82 + rnd() * 0.36,
          warm: (rnd() - 0.5) * 0.08,
        });
      }

      for (const name of names) {
        const items = buckets[name];
        if (!items.length) continue;

        // Tier can knock every ring down a LOD step on weak hardware.
        const detail = Math.max(0, r.detail + (this.tier.treeDetailBias || 0));
        const geo = geoFor(name, detail);

        // Smooth shading, deliberately. Flat shading was the loudest "low poly"
        // tell in the whole scene — it draws every triangle boundary as a hard
        // crease, which no amount of extra geometry hides. With smooth normals
        // plus the foliage normal map, the detail comes from surface relief
        // instead of from faceting.
        const leafMat = this._track(
          applyMaps(
            new THREE.MeshStandardMaterial({
              color: base,
              roughness: 1,
              metalness: 0,
            }),
            foliage,
            detail >= 2 ? 1.6 : 1,
            detail >= 1 ? 1.1 : 0.6,
          ),
        );

        const barkMat = this._track(
          applyMaps(
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x6b573a).lerp(fogCol, r.mix),
              roughness: 1,
              metalness: 0,
            }),
            bark,
            [1, 3],
            detail >= 1 ? 1.2 : 0.5,
          ),
        );

        const leaves = new THREE.InstancedMesh(geo.foliage, leafMat, items.length);
        const trunks = new THREE.InstancedMesh(geo.wood, barkMat, items.length);

        for (const inst of [leaves, trunks]) {
          // Only the near ring casts — shadow cost scales with what's in the map,
          // and trees 100m out contribute nothing the fog doesn't already hide.
          inst.castShadow = r.radius < 70;
          inst.receiveShadow = r.radius < 70;
        }

        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          dummy.position.set(Math.sin(it.a) * it.rad, 0, Math.cos(it.a) * it.rad);
          dummy.rotation.y = it.ry;
          dummy.scale.setScalar(it.s);
          dummy.updateMatrix();
          leaves.setMatrixAt(i, dummy.matrix);
          trunks.setMatrixAt(i, dummy.matrix);

          tint.setScalar(it.shade);
          tint.r = Math.min(1, tint.r + it.warm);
          tint.b = Math.max(0, tint.b - it.warm);
          leaves.setColorAt(i, tint);
        }

        for (const inst of [leaves, trunks]) {
          inst.instanceMatrix.needsUpdate = true;
          if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
          this.add(inst);
          this.treeRings.push(inst);
        }
      }
    }
  }

  /**
   * Deliberately empty.
   *
   * This layer originally held two oversized canopies hanging into the top corners,
   * echoing the moodboard's hero photograph. In practice, at that scale and that
   * close to the lens, the low-poly tree form reads as a flat black blob rather
   * than as foliage — it fought the title and cut into the nav.
   *
   * The near tree ring at r=56 already frames the shot, so the layer is dropped
   * rather than shrunk into irrelevance. If a foreground frame is wanted later, it
   * wants a proper branch/leaf asset (see the Higgsfield slots in
   * config/assets.manifest.js), not a scaled-up version of this geometry.
   */
  _buildForeground() {}

  /** Horizontal haze bands that sit between the depth layers and soften each seam. */
  _buildMist() {
    const tex = glowTexture();
    this.mist = [];
    // Kept low. Additive blending against the sun bloom turns anything stronger
    // into a hard diagonal streak that reads as a lens artefact, not as haze.
    const specs = [
      { z: -60, y: 5, w: 420, h: 46, o: 0.08 },
      { z: -130, y: 11, w: 700, h: 66, o: 0.11 },
      { z: -230, y: 20, w: 1000, h: 90, o: 0.13 },
    ];
    for (const s of specs) {
      const mat = this._track(
        new THREE.MeshBasicMaterial({
          map: tex,
          color: new THREE.Color(sceneColors.skyLow),
          transparent: true,
          opacity: s.o,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false,
        }),
      );
      const m = new THREE.Mesh(this._track(new THREE.PlaneGeometry(s.w, s.h)), mat);
      m.position.set(0, s.y, s.z);
      m.renderOrder = -5;
      this.add(m);
      this.mist.push(m);
    }
  }

  update(elapsed) {
    // Mist breathes very slowly — enough to keep the far field from looking frozen.
    for (let i = 0; i < this.mist.length; i++) {
      const m = this.mist[i];
      m.position.x = Math.sin(elapsed * 0.045 + i * 2.1) * 26;
      m.material.opacity = (0.08 + i * 0.025) * (0.82 + Math.sin(elapsed * 0.13 + i) * 0.18);
    }
  }

  dispose() {
    for (const d of this._disposables) d.dispose?.();
    this._disposables.length = 0;
  }
}

/**
 * Minimal BufferGeometry merge — avoids pulling in the whole examples/ addon just to
 * weld a handful of primitives into one tree.
 */
function mergeGeometries(geos) {
  const attrNames = ['position', 'normal', 'uv'];
  let vertexCount = 0;
  let indexCount = 0;

  for (const g of geos) {
    vertexCount += g.attributes.position.count;
    indexCount += g.index ? g.index.count : g.attributes.position.count;
  }

  const merged = new THREE.BufferGeometry();
  const arrays = {};
  for (const name of attrNames) {
    const size = geos[0].attributes[name].itemSize;
    arrays[name] = { array: new Float32Array(vertexCount * size), size, offset: 0 };
  }
  const indices = new Uint32Array(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const g of geos) {
    for (const name of attrNames) {
      const src = g.attributes[name];
      arrays[name].array.set(src.array, arrays[name].offset);
      arrays[name].offset += src.array.length;
    }
    const count = g.attributes.position.count;
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) indices[indexOffset++] = g.index.array[i] + vertexOffset;
    } else {
      for (let i = 0; i < count; i++) indices[indexOffset++] = i + vertexOffset;
    }
    vertexOffset += count;
    g.dispose();
  }

  for (const name of attrNames) {
    merged.setAttribute(name, new THREE.BufferAttribute(arrays[name].array, arrays[name].size));
  }
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}
