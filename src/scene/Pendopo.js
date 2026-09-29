import * as THREE from 'three';
import { sceneColors } from '../config/tokens.js';
import {
  timberMaps,
  stoneMaps,
  roofMaps,
  batikMaps,
  ornamentMaps,
  floorMaps,
  applyMaps,
} from './textures.js';

/**
 * A Javanese joglo pendopo, built to the real structural vocabulary.
 *
 * The parts are named as they are in Javanese architecture, because the layout rules
 * come from that vocabulary and not from arbitrary modelling choices:
 *
 *   umpak          stone footing under every pillar
 *   soko guru      the four central pillars — they carry the tall inner roof
 *   soko penanggap the twelve-pillar middle ring
 *   soko penitih   the outer ring, lowest and widest
 *   tumpang sari   the corbelled, stepped ceiling above the soko guru
 *   brunjung       the steep upper roof mass
 *   mustaka        the crowning finial
 *
 * The vertical plan below is what the camera path in CameraRig.js is written
 * against, so the two files have to move together.
 *
 *     16.2  ┬ mustaka tip
 *     14.6  ┼ brunjung apex
 *     12.5  ┼ tumpang sari ceiling top
 *     11.0  ┼ soko guru head
 *     10.4  ┼ penanggap roof top
 *      8.4  ┼ soko penanggap head
 *      7.8  ┼ penitih roof top
 *      6.0  ┼ soko penitih head
 *      1.2  ┼ platform deck  ← camera walks in at ~2.6
 *      0.0  ┴ ground
 */

const Y = {
  ground: 0,
  deck: 1.2,
  penitihHead: 6.0,
  penitihRoofTop: 7.8,
  penanggapHead: 8.4,
  penanggapRoofTop: 10.4,
  sokoGuruHead: 11.0,
  ceilingTop: 12.5,
  brunjungApex: 14.6,
  mustakaTip: 16.2,
};

const SQRT2 = Math.SQRT2;

/**
 * Concavity of the roof slopes. Read by both the tier shells and the hip ridges
 * that cap their corners — if these two ever disagree the ridges float off the
 * surface halfway up, so it lives here rather than being passed around.
 */
const ROOF_CURVE = 1.75;

/**
 * CylinderGeometry with 4 radial segments gives a square frustum, but its `radius`
 * is the circumradius. Callers think in half-widths, so convert here and rotate 45°
 * so the flat faces square up with the world axes.
 *
 * `openEnded` defaults to TRUE, and that default is load-bearing. A capped frustum
 * is a closed solid: the bottom cap of each roof tier becomes a slab spanning the
 * entire pendopo directly overhead, and a camera standing inside sees the underside
 * of that slab instead of the tumpang sari. Every roof and soffit piece here wants
 * a shell, never a solid. The openings never show from outside because the tier
 * above always covers the one below, and the mustaka caps the topmost.
 */
function squareFrustum(halfBottom, halfTop, height, openEnded = true, curve = 1) {
  // Height segments exist so the profile can be bent below; a single segment can
  // only ever be a straight cone.
  const segments = curve === 1 ? 1 : 10;
  const geo = new THREE.CylinderGeometry(
    halfTop * SQRT2,
    halfBottom * SQRT2,
    height,
    4,
    segments,
    openEnded,
  );

  if (curve !== 1) {
    // A real joglo roof is concave, not a straight cone: shallow where it meets
    // the eave, steepening as it climbs. Straight slopes are one of the strongest
    // "this is a 3D model" cues on a tiered roof, and the curve costs nine extra
    // rings of vertices.
    //
    // Radius follows f(t) = 1 - (1-t)^curve instead of t. f'(0) is large (shallow
    // at the eave) and f'(1) is zero (steep at the crown), which is exactly the
    // profile. Each vertex's x/z is rescaled from the linear radius it was built
    // with to the curved one.
    const pos = geo.attributes.position;
    const rb = halfBottom * SQRT2;
    const rt = halfTop * SQRT2;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Clamped, and not defensively. Floating-point error puts the cap-ring
      // vertices a hair outside [0,1]; with t = 1.0000001, `1 - t` is negative and
      // Math.pow(negative, 1.75) is NaN, which poisons the position buffer and
      // makes the whole geometry's bounding sphere NaN — the mesh then either
      // vanishes or never culls.
      const t = Math.min(Math.max((y + height / 2) / height, 0), 1);
      const linear = rb + (rt - rb) * t;
      if (linear <= 1e-6) continue;
      const curved = rb + (rt - rb) * (1 - Math.pow(1 - t, curve));
      const k = curved / linear;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  geo.rotateY(Math.PI / 4);
  return geo;
}

export class Pendopo extends THREE.Group {
  constructor() {
    super();
    this.name = 'pendopo';
    this._disposables = [];

    this.materials = this._buildMaterials();
    this._buildPlatform();
    this._buildPillars();
    this._buildBeams();
    this._buildBalustrade();
    this._buildTumpangSari();
    this._buildRoof();
    this._buildLanterns();

    /** World-space anchors the camera path steers by. */
    this.anchors = {
      // Just outside the outer ring, at standing height on the approach axis.
      approach: new THREE.Vector3(0, 3.4, 34),
      // Between two soko penitih — the moment of crossing the threshold.
      threshold: new THREE.Vector3(0, 2.9, 14.5),
      // Dead centre, under the tumpang sari.
      interior: new THREE.Vector3(0, 2.7, 1.5),
      // Looking straight up into the corbelled ceiling.
      ceiling: new THREE.Vector3(0, Y.ceilingTop, 0),
      // High above, for the compound reveal.
      apex: new THREE.Vector3(0, Y.mustakaTip, 0),
    };
  }

  /**
   * Every lit surface carries albedo + normal + roughness.
   *
   * `roughness` is left at 1.0 wherever a roughnessMap is present — three.js
   * multiplies the two, so any other value silently scales the whole map down and
   * flattens the variation it was added for. The per-material character comes from
   * the map's range (set in textures.js), not from this number.
   */
  _buildMaterials() {
    const timber = applyMaps(
      new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0.04 }),
      timberMaps(),
      [1, 5],
      1.1,
    );

    const stone = applyMaps(
      new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }),
      stoneMaps(),
      6,
      1.0,
    );

    // Template only — never rendered directly. Each tier clones this and sets its
    // own UV repeat in _roofMaterialFor(), because one repeat cannot be correct
    // for three tiers of very different proportions.
    const roof = applyMaps(
      new THREE.MeshStandardMaterial({
        roughness: 1,
        metalness: 0.05,
        // The tiers are open shells (see squareFrustum), so the inner face has to
        // render too — otherwise the camera inside looks straight out through the
        // roof at the sky.
        side: THREE.DoubleSide,
      }),
      roofMaps(),
      1,
      1.35,
    );

    // Template only, like `roof` above — never rendered directly. Each panel
    // clones it in `_batikMaterialFor` and fixes its own repeat at 1x1.
    const batik = applyMaps(
      new THREE.MeshStandardMaterial({
        roughness: 1,
        metalness: 0.06,
        side: THREE.DoubleSide,
      }),
      batikMaps(),
      1,
      0.7,
    );

    const ornament = applyMaps(
      new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0.72 }),
      ornamentMaps(),
      [10, 1],
      1.5,
    );

    const gold = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sceneColors.goldWarm),
      roughness: 0.28,
      metalness: 0.8,
    });

    const mats = { timber, stone, roof, batik, ornament, gold };
    this._disposables.push(...Object.values(mats));
    return mats;
  }

  _track(geo) {
    this._disposables.push(geo);
    return geo;
  }

  _buildPlatform() {
    const g = new THREE.Group();
    const { stone, ornament } = this.materials;

    // Deck.
    const deck = new THREE.Mesh(
      this._track(new THREE.BoxGeometry(32, Y.deck, 32)),
      stone,
    );
    deck.position.y = Y.deck / 2;
    deck.receiveShadow = true;
    deck.castShadow = true;
    g.add(deck);

    // Gilded frieze around the deck edge — catches the low sun on the approach.
    const frieze = new THREE.Mesh(
      this._track(new THREE.BoxGeometry(32.5, 0.34, 32.5)),
      ornament,
    );
    frieze.position.y = Y.deck - 0.24;
    g.add(frieze);

    // Tiled floor laid over the deck's top face. A separate plane rather than a
    // sixth material on the box, so the platform's sides keep plain cut stone
    // while the walking surface gets the pattern it's actually seen with.
    // Polished, so the roughness map's low end does real work here — it is what
    // lets the lantern light streak across the tiles at the interior beat.
    const floorMat = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0.08 }),
        floorMaps(),
        4,
        0.85,
      ),
    );
    const floor = new THREE.Mesh(
      this._track(new THREE.PlaneGeometry(31.6, 31.6)),
      floorMat,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = Y.deck + 0.008; // just proud, to beat z-fighting with the box
    floor.receiveShadow = true;
    g.add(floor);

    // Three entry steps on the +Z approach axis.
    for (let i = 0; i < 3; i++) {
      const w = 14 - i * 0.9;
      const step = new THREE.Mesh(
        this._track(new THREE.BoxGeometry(w, 0.4, 1.5)),
        stone,
      );
      step.position.set(0, 0.2 + i * 0.4, 16 + (3 - i) * 1.4);
      step.receiveShadow = true;
      step.castShadow = true;
      g.add(step);
    }

    this.add(g);
    this.platform = g;
  }

  /**
   * One ring of pillars, as instanced parts.
   *
   * The first pass built three fresh geometries per pillar and a Mesh for each —
   * 150 geometries and 150 draw calls for 50 columns, which left no headroom to
   * add the detail those columns actually needed at close range. Here each ring
   * emits one InstancedMesh per part instead, so the whole colonnade is six draw
   * calls per ring however many columns it has, and the extra articulation below
   * is effectively free.
   *
   * A real soko sits on a stepped stone umpak, tapers slightly toward its head,
   * and is collared with metal bands. All three are what the eye reads as "carved"
   * rather than "extruded".
   */
  _pillarRing(positions, height, radius) {
    const { timber, stone, gold } = this.materials;
    const n = positions.length;
    const meshes = [];

    // Vertical breakdown, base of pillar at y=0 (the deck).
    const plinthH = 0.34;
    const umpakH = 0.5;
    const capH = 0.42;
    const shaftBase = plinthH + umpakH;
    const shaftH = height - shaftBase - capH * 0.5;

    const parts = [
      // Stone plinth — the widest step, meeting the deck.
      {
        geo: new THREE.CylinderGeometry(radius * 2.0, radius * 2.35, plinthH, 4),
        mat: stone,
        y: plinthH / 2,
        spin: Math.PI / 4,
      },
      // Umpak proper — the moulded block the timber actually stands on.
      {
        geo: new THREE.CylinderGeometry(radius * 1.35, radius * 1.95, umpakH, 4),
        mat: stone,
        y: plinthH + umpakH / 2,
        spin: Math.PI / 4,
      },
      // Shaft. 16 sides rather than 12 — at the threshold beat the camera passes
      // within two metres of these and 12 reads as faceted.
      {
        geo: new THREE.CylinderGeometry(radius * 0.88, radius * 1.04, shaftH, 48),
        mat: timber,
        y: shaftBase + shaftH / 2,
      },
      // Two metal collars. Off-centre spacing looks deliberate; evenly split
      // thirds look like a default.
      {
        geo: new THREE.CylinderGeometry(radius * 1.12, radius * 1.14, 0.15, 48),
        mat: gold,
        y: shaftBase + shaftH * 0.22,
      },
      {
        geo: new THREE.CylinderGeometry(radius * 1.05, radius * 1.07, 0.11, 48),
        mat: gold,
        y: shaftBase + shaftH * 0.62,
      },
      // Capital, flaring out to meet the beam above.
      {
        geo: new THREE.CylinderGeometry(radius * 1.55, radius * 0.95, capH, 32),
        mat: gold,
        y: height - capH * 0.3,
      },
    ];

    const d = new THREE.Object3D();
    for (const p of parts) {
      if (p.spin) p.geo.rotateY(p.spin);
      this._track(p.geo);
      const inst = new THREE.InstancedMesh(p.geo, p.mat, n);
      inst.castShadow = true;
      inst.receiveShadow = true;
      for (let i = 0; i < n; i++) {
        d.position.set(positions[i][0], Y.deck + p.y, positions[i][1]);
        d.rotation.set(0, 0, 0);
        d.updateMatrix();
        inst.setMatrixAt(i, d.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
      meshes.push(inst);
    }

    return meshes;
  }

  _buildPillars() {
    const g = new THREE.Group();

    // Soko guru — four, at the centre, carrying the brunjung.
    const guru = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) guru.push([sx * 4.2, sz * 4.2]);
    this.sokoGuruPositions = guru;

    const rings = [
      { pos: guru, height: Y.sokoGuruHead - Y.deck, radius: 0.52 },
      { pos: this._ringPositions(10, 4), height: Y.penanggapHead - Y.deck, radius: 0.4 },
      { pos: this._ringPositions(14.5, 6), height: Y.penitihHead - Y.deck, radius: 0.33 },
    ];

    for (const r of rings) g.add(...this._pillarRing(r.pos, r.height, r.radius));

    this.add(g);
    this.pillars = g;
  }

  /**
   * Positions on a square ring, `perSide` pillars along each edge plus the corners.
   * Skips the two mid-points on the +Z edge to leave the entry bay open, so the
   * camera dolly passes through a gap rather than clipping a pillar.
   */
  _ringPositions(span, perSide) {
    const out = [];
    const step = (span * 2) / (perSide + 1);
    // Corners.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push([sx * span, sz * span]);
    // Edges.
    for (let i = 1; i <= perSide; i++) {
      const t = -span + step * i;
      out.push([t, -span]); // back edge
      out.push([-span, t]); // left edge
      out.push([span, t]); // right edge
      // Front (+Z) edge: leave the two central bays clear for the entry.
      const isCentreBay = Math.abs(t) < step * 0.75;
      if (!isCentreBay) out.push([t, span]);
    }
    return out;
  }

  /**
   * Blandar and pengeret — the tie beams that ring each set of columns at their
   * heads and carry the roof above.
   *
   * Structurally these are the whole point of the column rings, and their absence
   * was the loudest thing wrong with the first pass: pillars rose to a capital and
   * then nothing, with the roof floating unsupported above the gap. Adding the
   * beams closes the frame, and the deep horizontal shadow they throw is what
   * finally separates roof from columns at a distance.
   */
  _buildBeams() {
    const g = new THREE.Group();
    const { timber, gold } = this.materials;

    const rings = [
      { span: 14.5, y: Y.penitihHead, w: 0.34, h: 0.52 },
      { span: 10.0, y: Y.penanggapHead, w: 0.4, h: 0.6 },
      { span: 4.2, y: Y.sokoGuruHead, w: 0.46, h: 0.72 },
    ];

    for (const r of rings) {
      // Overrun the span so beams lap at the corners rather than leaving a notch.
      const len = r.span * 2 + r.w * 2;
      const beamGeo = this._track(new THREE.BoxGeometry(len, r.h, r.w));
      // Thin gilt bead along the lower edge — catches light and reads the run of
      // the beam even where it sits in the roof's shadow.
      const beadGeo = this._track(new THREE.BoxGeometry(len, 0.09, r.w + 0.07));

      for (let s = 0; s < 4; s++) {
        const rot = (Math.PI / 2) * s;
        const px = s === 1 ? r.span : s === 3 ? -r.span : 0;
        const pz = s === 0 ? r.span : s === 2 ? -r.span : 0;

        const beam = new THREE.Mesh(beamGeo, timber);
        beam.rotation.y = rot;
        beam.position.set(px, r.y - r.h / 2, pz);
        beam.castShadow = true;
        beam.receiveShadow = true;
        g.add(beam);

        const bead = new THREE.Mesh(beadGeo, gold);
        bead.rotation.y = rot;
        bead.position.set(px, r.y - r.h + 0.045, pz);
        g.add(bead);
      }
    }

    this.add(g);
    this.beams = g;
  }

  /**
   * Low balustrade between the outer columns.
   *
   * Kept deliberately low — a pendopo is an open pavilion, and a full railing
   * would both be wrong and wall off the interior shot. At roughly a metre it
   * adds a band of fine detail exactly where the camera passes at the threshold
   * beat without ever entering the sightline into the tumpang sari.
   *
   * The two centre bays on the +Z face are skipped so the entry stays open on the
   * axis the camera flies down.
   */
  _buildBalustrade() {
    const g = new THREE.Group();
    const { timber, gold } = this.materials;

    const span = 14.5;
    const top = Y.deck + 1.05;
    const railGeo = this._track(new THREE.BoxGeometry(span * 2, 0.16, 0.22));
    const kerbGeo = this._track(new THREE.BoxGeometry(span * 2, 0.24, 0.3));

    // Balusters: one instanced mesh for all four sides.
    const balusters = [];
    const perSide = 26;

    for (let s = 0; s < 4; s++) {
      const rot = (Math.PI / 2) * s;
      const isEntry = s === 0; // +Z face

      const rail = new THREE.Mesh(railGeo, gold);
      rail.rotation.y = rot;
      rail.position.set(
        s === 1 ? span : s === 3 ? -span : 0,
        top,
        s === 0 ? span : s === 2 ? -span : 0,
      );
      const kerb = new THREE.Mesh(kerbGeo, timber);
      kerb.rotation.y = rot;
      kerb.position.copy(rail.position).setY(Y.deck + 0.12);

      if (isEntry) {
        // Split the rail and kerb into two, leaving the middle open.
        for (const side of [-1, 1]) {
          const w = span * 0.58;
          const r2 = new THREE.Mesh(this._track(new THREE.BoxGeometry(w, 0.16, 0.22)), gold);
          r2.position.set(side * (span - w / 2), top, span);
          g.add(r2);
          const k2 = new THREE.Mesh(this._track(new THREE.BoxGeometry(w, 0.24, 0.3)), timber);
          k2.position.set(side * (span - w / 2), Y.deck + 0.12, span);
          g.add(k2);
        }
      } else {
        rail.castShadow = true;
        g.add(rail, kerb);
      }

      for (let i = 0; i < perSide; i++) {
        const u = ((i + 0.5) / perSide) * 2 - 1;
        const along = u * span * 0.97;
        if (isEntry && Math.abs(u) < 0.42) continue; // entry gap
        balusters.push({
          x: along * Math.cos(rot) + span * Math.sin(rot),
          z: -along * Math.sin(rot) + span * Math.cos(rot),
          ry: rot,
        });
      }
    }

    // Turned baluster rather than a plain dowel. It is one geometry shared by ~100
    // instances, so the profile is essentially free, and a repeated element with a
    // silhouette is worth far more than the same element smoothed — the eye reads
    // the row of shapes, not any single one.
    const profile = [
      [0.0, 0.0],
      [0.105, 0.0],
      [0.105, 0.07],
      [0.075, 0.11],
      [0.062, 0.2],
      [0.098, 0.3], // lower swell
      [0.108, 0.37],
      [0.082, 0.45],
      [0.052, 0.55],
      [0.058, 0.63],
      [0.086, 0.7], // upper collar
      [0.07, 0.75],
      [0.098, 0.78],
      [0.0, 0.78],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const balGeo = this._track(new THREE.LatheGeometry(profile, 24));
    const inst = new THREE.InstancedMesh(balGeo, timber, balusters.length);
    inst.castShadow = true;
    const d = new THREE.Object3D();
    for (let i = 0; i < balusters.length; i++) {
      const b = balusters[i];
      // LatheGeometry's origin is at the profile's base, not its centre like the
      // CylinderGeometry this replaced — so this is the foot, sitting on the kerb.
      d.position.set(b.x, Y.deck + 0.23, b.z);
      d.rotation.set(0, b.ry, 0);
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);

    this.add(g);
    this.balustrade = g;
  }

  /**
   * A batik material for one tumpang-sari panel.
   *
   * `batikMaps()` is a gradient wash now, not a repeating print (see its own
   * comment for why: a print, however small or blurred, still aliases once a
   * panel is viewed close to edge-on, which is exactly the `ascend` beat).
   * A gradient has no period to lose, but tiling it with `repeat > 1` would
   * reintroduce one — a hard seam every time it wraps — so every panel gets
   * exactly one tile, one smooth wash top to bottom, regardless of size.
   * Each panel still gets its own material (not the shared template) so nothing
   * here depends on panels sharing GPU state they don't actually share.
   */
  _batikMaterialFor() {
    const mat = this.materials.batik.clone();
    for (const slot of ['map', 'normalMap', 'roughnessMap']) {
      const src = this.materials.batik[slot];
      if (!src) continue;
      const tex = src.clone();
      tex.needsUpdate = true;
      tex.repeat.set(1, 1);
      mat[slot] = tex;
      this._disposables.push(tex);
    }
    mat.needsUpdate = true;
    this._disposables.push(mat);
    return mat;
  }

  /**
   * Tumpang sari — the corbelled ceiling. Successively smaller square frames stacked
   * above the soko guru, each rotated slightly, with batik-faced soffits between.
   * This is the payoff shot when the camera looks up at the `interior` beat.
   */
  _buildTumpangSari() {
    const g = new THREE.Group();
    const { timber, gold } = this.materials;

    const tiers = 7;
    const baseHalf = 6.4;
    const topHalf = 1.6;
    const y0 = Y.sokoGuruHead - 0.3;
    const total = Y.ceilingTop - y0;

    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const half = baseHalf + (topHalf - baseHalf) * t;
      const y = y0 + total * t;

      // Open frame of four beams.
      const frame = new THREE.Group();
      const beamGeo = this._track(new THREE.BoxGeometry(half * 2 + 0.7, 0.34, 0.42));
      for (let s = 0; s < 4; s++) {
        const beam = new THREE.Mesh(beamGeo, i % 2 === 0 ? timber : gold);
        beam.rotation.y = (Math.PI / 2) * s;
        const d = half;
        beam.position.set(
          s === 1 ? d : s === 3 ? -d : 0,
          0,
          s === 0 ? d : s === 2 ? -d : 0,
        );
        beam.castShadow = true;
        frame.add(beam);
      }
      frame.position.y = y;
      g.add(frame);

      // Batik soffit panel filling the step between this tier and the next.
      if (i < tiers - 1) {
        const nextHalf = baseHalf + (topHalf - baseHalf) * ((i + 1) / (tiers - 1));
        const panel = new THREE.Mesh(
          this._track(squareFrustum(half, nextHalf, total / (tiers - 1))),
          this._batikMaterialFor(),
        );
        panel.position.y = y + total / (tiers - 1) / 2;
        g.add(panel);
      }
    }

    /*
     * Centre boss — a gilded rosette right overhead.
     *
     * NOT the shared `gold` material (roughness 0.28) — that's tuned for trim
     * far from any light source, where a tight mirror-like highlight reads as
     * a sheen. This boss sits only 2.4 units above `ceilingLight` below, and
     * at full interiority that light peaks near intensity 30. A near-mirror
     * surface that close to a point light doesn't shade like gilt catching
     * light — it blows the specular lobe out into a small, hard, near-white
     * sphere, which is exactly the "glowing ball" the `ascend` beat kept
     * showing instead of a rosette. A rougher clone spreads that same light
     * into a broad, soft glow — still bright, still reads as gold, but as an
     * illuminated surface rather than a blown-out point reflection.
     */
    const bossGold = this._track(gold.clone());
    bossGold.roughness = 0.62;
    const boss = new THREE.Mesh(
      this._track(new THREE.CylinderGeometry(1.3, 0.85, 0.4, 32)),
      bossGold,
    );
    boss.position.y = Y.ceilingTop + 0.1;
    g.add(boss);

    this.add(g);
    this.tumpangSari = g;
  }

  /**
   * A roof material sized to one specific tier.
   *
   * All three tiers sharing a single material was why the shingles read as flat
   * colour. A tier is long around and short up the slope — the penitih is ~130
   * units of perimeter over 2.4 units of pitch — so any single UV repeat that
   * looks right in one axis is badly wrong in the other. At (12, 3) each course
   * was squashed to about 25mm of world space and dissolved into a grey smear.
   *
   * Instead the repeat is derived per tier from a target real-world shingle size,
   * so courses come out the same physical size on every tier. `u` is rounded to
   * an integer because it wraps the perimeter and a fractional value leaves a
   * visible seam; `v` runs up the slope and doesn't wrap, so it stays fractional.
   */
  _roofMaterialFor(halfBottom, halfTop, height) {
    const SHINGLE_W = 0.62; // metres across
    const COURSE_H = 0.34; // metres up the slope
    const TILE_COLS = 23; // shingles per texture tile, from roofTexture()
    const TILE_ROWS = 26;

    const perimeter = 4 * (halfBottom + halfTop); // mean square perimeter
    const slope = Math.hypot(height, halfBottom - halfTop);

    const u = Math.max(1, Math.round(perimeter / (TILE_COLS * SHINGLE_W)));
    const v = Math.max(0.12, slope / (TILE_ROWS * COURSE_H));

    const mat = this.materials.roof.clone();
    // All three maps must move together — a normal map at a different repeat than
    // its albedo puts the shingle relief out of register with the shingle colour,
    // which looks worse than having no relief at all.
    for (const slot of ['map', 'normalMap', 'roughnessMap']) {
      const src = this.materials.roof[slot];
      if (!src) continue;
      const tex = src.clone();
      tex.needsUpdate = true;
      tex.repeat.set(u, v);
      mat[slot] = tex;
      this._disposables.push(tex);
    }
    mat.needsUpdate = true;
    this._disposables.push(mat);
    return mat;
  }

  /**
   * An ornament material sized to one fascia band.
   *
   * Same problem as `_batikMaterialFor`, one size down: `_buildMaterials()`
   * bakes a single UV repeat (10 around the wrap) for the `ornament` map,
   * tuned against the penitih tier's fascia — by far the widest, at a
   * half-width plus flare of roughly 17. The brunjung fascia is less than
   * half that circumference and, unmodified, packs the same ten repeats of
   * the rosette print into it — denser still than the batik panels were,
   * and on the one band closest to the `ascend` camera. Scaling the repeat
   * with the band's own half-width keeps the print's physical size constant
   * tier to tier instead of just its repeat count.
   */
  _fasciaMaterialFor(half) {
    const BASE_HALF = 17.1; // penitih's fascia — where repeat 10 was tuned to look right
    const BASE_REPEAT = 10;
    const repeat = Math.max(2, Math.round((BASE_REPEAT * half) / BASE_HALF));

    const mat = this.materials.ornament.clone();
    for (const slot of ['map', 'normalMap', 'roughnessMap']) {
      const src = this.materials.ornament[slot];
      if (!src) continue;
      const tex = src.clone();
      tex.needsUpdate = true;
      tex.repeat.set(repeat, 1);
      mat[slot] = tex;
      this._disposables.push(tex);
    }
    mat.needsUpdate = true;
    this._disposables.push(mat);
    return mat;
  }

  /** One roof tier: a main slope plus a shallower flared eave, and a gold fascia. */
  _roofTier(halfBottom, halfTop, yBottom, height, flare = 0.75) {
    const g = new THREE.Group();
    const roof = this._roofMaterialFor(halfBottom, halfTop, height);

    const eaveH = height * 0.22;
    const mainH = height - eaveH;

    // Flared eave — wider at its foot, which gives the joglo its lifted edge.
    const eave = new THREE.Mesh(
      this._track(squareFrustum(halfBottom + flare, halfBottom, eaveH)),
      roof,
    );
    eave.position.y = yBottom + eaveH / 2;
    eave.castShadow = true;
    eave.receiveShadow = true;
    g.add(eave);

    const main = new THREE.Mesh(
      this._track(squareFrustum(halfBottom, halfTop, mainH, true, ROOF_CURVE)),
      roof,
    );
    main.position.y = yBottom + eaveH + mainH / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    g.add(main);

    // Gold fascia band wrapping the eave lip.
    const fascia = new THREE.Mesh(
      this._track(
        squareFrustum(halfBottom + flare + 0.12, halfBottom + flare + 0.05, 0.3),
      ),
      this._fasciaMaterialFor(halfBottom + flare),
    );
    fascia.position.y = yBottom + 0.05;
    g.add(fascia);

    return g;
  }

  /**
   * Hip ridges (wuwung) — the capped diagonal seams running corner to corner up
   * each tier.
   *
   * These do more for the silhouette than anything else on the roof. Without them
   * a tiered joglo is four smooth planes meeting at invisible edges, which is
   * exactly why the first pass read as untextured massing; with them the roof has
   * structure you can trace from any angle, and the corners catch a gold highlight
   * against the dark shingle.
   *
   * Derived from the same tier specs as the shells, so they can't drift.
   */
  _buildHipRidges(tiers) {
    const g = new THREE.Group();
    const { gold } = this.materials;

    for (const t of tiers) {
      // Trace the corner of the *curved* shell rather than a straight chord: with
      // ROOF_CURVE applied, a straight ridge would lift clear of the roof through
      // the middle of its run and sink into it at the ends.
      const pts = [];
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        // Same profile function as squareFrustum, in half-widths.
        const r =
          (t.hb + (t.ht - t.hb) * (1 - Math.pow(1 - u, ROOF_CURVE))) * 1.008;
        pts.push(new THREE.Vector3(r, t.y + t.h * u, r));
      }

      const path = new THREE.CatmullRomCurve3(pts);
      // radialSegments 4 gives a square cap, which is what a ridge tile is.
      const geo = this._track(new THREE.TubeGeometry(path, 28, 0.23, 4, false));

      // The base tube sits on the +X+Z corner; the other three are 90° rotations,
      // which keeps winding intact (mirroring with a negative scale would not).
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(geo, gold);
        m.rotation.y = (Math.PI / 2) * i;
        m.castShadow = true;
        g.add(m);
      }
    }

    return g;
  }

  /**
   * Exposed rafter tails (usuk) poking out under every eave.
   *
   * A bare eave edge is the single flattest part of a roof at close range, and the
   * camera passes directly under one at the threshold beat. A row of small timber
   * ends breaks that line into repeating light and shadow and gives the eave real
   * thickness.
   *
   * 132 of them across three tiers, so this is one InstancedMesh — as separate
   * meshes it would nearly double the scene's draw calls on its own.
   */
  _buildRafterEnds(tiers) {
    const { timber } = this.materials;
    const placements = [];

    for (const t of tiers) {
      const R = t.hb + t.flare; // eave lip
      for (let side = 0; side < 4; side++) {
        const ang = (Math.PI / 2) * side;
        for (let i = 0; i < t.rafters; i++) {
          // Centre of each bay, and pulled in from the corners so tails from
          // adjacent sides don't intersect.
          const u = ((i + 0.5) / t.rafters) * 2 - 1;
          placements.push({ along: u * R * 0.9, R, y: t.y - 0.02, ang });
        }
      }
    }

    const geo = this._track(new THREE.BoxGeometry(0.17, 0.22, 1.0));
    const inst = new THREE.InstancedMesh(geo, timber, placements.length);
    inst.castShadow = true;
    inst.receiveShadow = true;

    const d = new THREE.Object3D();
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const out = p.R + 0.28;
      // Lay the tail out on the +Z face, then swing the whole placement — position
      // and orientation together — around Y to its side.
      d.position.set(
        p.along * Math.cos(p.ang) + out * Math.sin(p.ang),
        p.y,
        -p.along * Math.sin(p.ang) + out * Math.cos(p.ang),
      );
      d.rotation.set(-0.22, p.ang, 0); // nose down, following the roof pitch
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;

    return inst;
  }

  _buildRoof() {
    const g = new THREE.Group();
    const { gold } = this.materials;

    // One spec per tier, kept as data so the hip ridges and rafter ends below can
    // be derived from the same numbers instead of being re-typed and drifting.
    const tiers = [
      // penitih — lowest, widest, shallowest
      { hb: 16.2, ht: 11.6, y: Y.penitihHead, h: Y.penitihRoofTop - Y.penitihHead, flare: 0.9, rafters: 15 },
      // penanggap — middle
      { hb: 11.6, ht: 6.6, y: Y.penanggapHead, h: Y.penanggapRoofTop - Y.penanggapHead, flare: 0.8, rafters: 11 },
      // brunjung — the steep crown
      { hb: 6.6, ht: 1.1, y: Y.penanggapRoofTop, h: Y.brunjungApex - Y.penanggapRoofTop, flare: 0.6, rafters: 7 },
    ];
    this.roofTiers = tiers;

    for (const t of tiers) g.add(this._roofTier(t.hb, t.ht, t.y, t.h, t.flare));
    g.add(this._buildHipRidges(tiers));
    g.add(this._buildRafterEnds(tiers));

    /*
     * Cap over the brunjung's open top.
     *
     * Every roof tier is a hollow shell (see squareFrustum's `openEnded` note) —
     * that's fine everywhere else because the next tier up always covers the
     * opening below it. The brunjung is the last tier, so nothing does that job
     * for *its* top: the tier's opening there has half-width `ht` (1.1), which
     * in world space is a square with corners reaching out to `ht * SQRT2`
     * (≈1.56), and the mustaka disc sitting on top of it has bottom radius 1.0 —
     * smaller than even the square's flat-edge half-width, let alone its
     * corners. The gap was invisible from outside (the disc/bulb/spire hide it
     * in silhouette) but wide open from directly beneath, which is exactly the
     * camera angle at the `ascend` beat: it read as a glowing hole straight
     * through the roof to the gilt finial lit in full sun, not as a ceiling.
     * A simple axis-aligned plate closes it without touching the exterior read.
     */
    const brunjung = tiers[tiers.length - 1];
    const capHalf = brunjung.ht * SQRT2 + 0.15;
    const cap = new THREE.Mesh(
      this._track(new THREE.BoxGeometry(capHalf * 2, 0.1, capHalf * 2)),
      gold,
    );
    cap.position.y = Y.brunjungApex - 0.05;
    cap.castShadow = true;
    cap.receiveShadow = true;
    g.add(cap);

    // Mustaka — the finial: stacked disc, bulb, and spire.
    const mustaka = new THREE.Group();
    const disc = new THREE.Mesh(
      this._track(new THREE.CylinderGeometry(1.35, 1.0, 0.3, 32)),
      gold,
    );
    disc.position.y = 0.15;
    mustaka.add(disc);

    const bulb = new THREE.Mesh(
      // Highest point on the building and dead centre of the hero frame — this
      // one silhouette is worth the segments.
      this._track(new THREE.SphereGeometry(0.72, 48, 32)),
      gold,
    );
    bulb.position.y = 0.85;
    mustaka.add(bulb);

    const spire = new THREE.Mesh(
      this._track(new THREE.ConeGeometry(0.34, 1.15, 32)),
      gold,
    );
    spire.position.y = 1.85;
    mustaka.add(spire);

    mustaka.position.y = Y.brunjungApex;
    mustaka.traverse((o) => (o.castShadow = true));
    g.add(mustaka);
    this.mustaka = mustaka;

    this.add(g);
    this.roof = g;
  }

  /**
   * Hanging brass lanterns between the penanggap pillars. Their point lights are the
   * only warm sources inside the roof shadow, so the interior beat has something to
   * resolve to as the daylight falls away.
   */
  _buildLanterns() {
    const g = new THREE.Group();
    const { gold } = this.materials;
    this.lanternLights = [];

    const spots = [
      [-10, -10],
      [10, -10],
      [-10, 10],
      [10, 10],
    ];

    for (const [x, z] of spots) {
      const l = new THREE.Group();

      const cord = new THREE.Mesh(
        this._track(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6)),
        gold,
      );
      cord.position.y = 0.75;
      l.add(cord);

      const body = new THREE.Mesh(
        this._track(new THREE.CylinderGeometry(0.42, 0.3, 0.85, 6)),
        gold,
      );
      l.add(body);

      // Range has to clear the diagonal from a lantern up to the far side of the
      // tumpang sari — roughly 12 units — or the ceiling stays unlit.
      const flame = new THREE.PointLight(
        new THREE.Color(sceneColors.goldWarm),
        0,
        28,
        2.0,
      );
      flame.position.y = -0.05;
      l.add(flame);
      this.lanternLights.push(flame);

      l.position.set(x, Y.penanggapHead - 1.9, z);
      g.add(l);
    }

    this.add(g);
    this.lanterns = g;

    /**
     * A dedicated uplight for the corbelled ceiling.
     *
     * The four lanterns alone leave the tumpang sari reading as a flat dark mass —
     * they sit below it and their falloff eats the difference. This sits at soko
     * guru head height pointing straight up, so the stepped tiers catch light on
     * their undersides and the depth of the corbelling actually shows.
     */
    this.ceilingLight = new THREE.PointLight(
      new THREE.Color(sceneColors.goldWarm),
      0,
      22,
      1.7,
    );
    this.ceilingLight.position.set(0, Y.sokoGuruHead - 0.8, 0);
    this.add(this.ceilingLight);
  }

  /**
   * Per-frame life. `interiority` (0→1) is how far the camera has moved inside; the
   * lanterns only earn their brightness once the roof is actually overhead.
   */
  update(elapsed, interiority = 0) {
    for (let i = 0; i < this.lanternLights.length; i++) {
      const flicker = 0.86 + Math.sin(elapsed * 2.4 + i * 1.9) * 0.09
        + Math.sin(elapsed * 7.1 + i * 3.3) * 0.05;
      this.lanternLights[i].intensity = interiority * 42 * flicker;
    }
    // Steadier than the lanterns — it is doing structural reveal, not atmosphere,
    // and a flickering ceiling reads as a fault rather than as candlelight.
    this.ceilingLight.intensity =
      interiority * 30 * (0.94 + Math.sin(elapsed * 1.3) * 0.06);
  }

  dispose() {
    for (const d of this._disposables) d.dispose?.();
    this._disposables.length = 0;
  }
}

export const PENDOPO_LEVELS = Y;
