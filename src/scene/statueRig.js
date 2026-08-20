import * as THREE from 'three';

/**
 * Fits a small skeleton to the reference statue mesh and skins it on the CPU.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * referensi/dancin_statue.glb is a good figure and an awkward asset: 2406 verts,
 * Z-up, **no skin, no bones, no animation** — a single frozen pose. Dropping it in
 * as-is would fix the body shape and throw away the scroll-driven dance.
 *
 * So the rig is fitted here from the geometry itself. Landmarks were measured off
 * the vertex cloud (waist pinch at 60% of height, shoulder line where width jumps
 * from 0.27 to 0.87, head mass near the axis at 73-85%, and the two arm tips) and
 * hard-coded below as fractions of height, so the same numbers still hold if the
 * mesh is re-exported at a different scale.
 *
 * ── The rest pose is the sculpted pose ──────────────────────────────────────
 * The statue already stands in a dance pose: left arm raised high, right arm
 * extended. That pose is better than anything a rotation of mine would produce,
 * so it is treated as the zero. dance.js poses are applied as *deltas from pose 2*
 * (the raised-selendang pose it most resembles), which means the figure sits in
 * its own sculpted pose at that beat and only deviates from it elsewhere.
 *
 * Deltas are also damped. Simple two-bone weights cannot survive a 90° shoulder
 * swing without pinching, and Javanese court dance is small-amplitude anyway —
 * so the choreography reads without the mesh ever tearing.
 */

/** Landmarks as fractions of the crown height, measured from the mesh. */
const LM = {
  hip: 0.66, //  waist pinch — everything below is skirt
  spine: 0.72,
  chest: 0.78, // shoulder line
  neck: 0.83,
  head: 0.9,
  crown: 1.0,
  shoulderX: 0.055, // half the shoulder width, as a fraction of crown height
};

/** Bone list. `parent` indexes earlier entries, so a single forward pass solves. */
const BONES = [
  { name: 'hips', parent: -1 },
  { name: 'spine', parent: 0 },
  { name: 'chest', parent: 1 },
  { name: 'neck', parent: 2 },
  { name: 'head', parent: 3 },
  { name: 'upperArmL', parent: 2 },
  { name: 'forearmL', parent: 5 },
  { name: 'handL', parent: 6 },
  { name: 'upperArmR', parent: 2 },
  { name: 'forearmR', parent: 8 },
  { name: 'handR', parent: 9 },
];

const NAME_TO_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i]));

/** Shortest distance from a point to a line segment, plus where along it. */
function distToSegment(p, a, b, out) {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
  const denom = abx * abx + aby * aby + abz * abz;
  let t = denom > 1e-9 ? (apx * abx + apy * aby + apz * abz) / denom : 0;
  t = Math.min(1, Math.max(0, t));
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  out.t = t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class StatueRig {
  /**
   * @param {THREE.BufferGeometry} geometry  raw geometry straight from the GLB
   * @param {number} targetHeight            desired crown height in world metres
   */
  constructor(geometry, targetHeight = 1.68) {
    this.geometry = geometry;
    this._prepareGeometry(targetHeight);
    this._buildSkeleton();
    this._computeWeights();

    this._rest = this.bind.map((m) => m.clone());
    this._world = BONES.map(() => new THREE.Matrix4());
    this._skin = BONES.map(() => new THREE.Matrix4());
    this._local = BONES.map(() => new THREE.Matrix4());
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._tA = new THREE.Matrix4();
    this._tB = new THREE.Matrix4();
    /** All bone matrices flattened, so the skinning loop touches one array. */
    this._flat = new Float32Array(BONES.length * 16);
  }

  /**
   * Converts the mesh into the scene's conventions: Y-up, feet on y=0, crown at
   * `targetHeight`, and facing +Z.
   *
   * The source is Z-up (Sketchfab/OBJ export). "Crown" is deliberately not the
   * bounding-box top — the raised hand reaches well above the head, and scaling
   * to the bbox would produce a figure a head too short.
   */
  _prepareGeometry(targetHeight) {
    const g = this.geometry;
    const pos = g.attributes.position;
    const nrm = g.attributes.normal;

    // Up-axis is detected, not assumed.
    //
    // The source is a Sketchfab export and its raw accessor data is Z-up — but
    // the glTF node tree *also* carries the -90° X rotation that corrects it. So
    // whether the data arrives Z-up or Y-up depends entirely on whether the
    // caller baked the node transforms in. Assuming Z-up unconditionally rotated
    // an already-corrected mesh a second time and left the figure lying on its
    // back, 8 metres long.
    //
    // A standing figure's tallest axis is its height, so measuring settles it and
    // both call paths (GLTFLoader in the browser, raw accessors in
    // tools/rig-preview.mjs) work from the same code.
    g.computeBoundingBox();
    const pre = g.boundingBox;
    const spanY = pre.max.y - pre.min.y;
    const spanZ = pre.max.z - pre.min.z;

    if (spanZ > spanY * 1.2) {
      // Z-up: (x, y, z) -> (x, z, -y)
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        pos.setXYZ(i, x, z, -y);
        if (nrm) {
          const nx = nrm.getX(i), ny = nrm.getY(i), nz = nrm.getZ(i);
          nrm.setXYZ(i, nx, nz, -ny);
        }
      }
    }

    g.computeBoundingBox();
    const bb = g.boundingBox;

    // Crown = the top of the head mass near the central axis, not the fingertip.
    const cx = (bb.min.x + bb.max.x) / 2;
    let crown = -Infinity;
    const axisBand = Math.max(bb.max.x - bb.min.x, 0.001) * 0.14;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getX(i) - cx) < axisBand) crown = Math.max(crown, pos.getY(i));
    }
    if (!Number.isFinite(crown)) crown = bb.max.y;

    const floor = bb.min.y;
    const scale = targetHeight / (crown - floor);

    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        (pos.getX(i) - cx) * scale,
        (pos.getY(i) - floor) * scale,
        pos.getZ(i) * scale,
      );
    }
    pos.needsUpdate = true;
    if (nrm) nrm.needsUpdate = true;
    g.computeBoundingBox();

    this.height = targetHeight;
    this.restPositions = new Float32Array(pos.array);
    this.restNormals = nrm ? new Float32Array(nrm.array) : null;
    pos.setUsage(THREE.DynamicDrawUsage);
    if (nrm) nrm.setUsage(THREE.DynamicDrawUsage);
  }

  /**
   * Places bone heads by landmark, then finds each arm's real direction from the
   * vertex cloud rather than assuming one — the whole point of fitting to this
   * mesh is that its arms are already somewhere specific.
   */
  _buildSkeleton() {
    const H = this.height;
    const pos = this.geometry.attributes.position;
    const P = (x, y, z) => new THREE.Vector3(x, y, z);

    const chestY = H * LM.chest;
    const sx = H * LM.shoulderX;

    // Farthest upper-body vertex on each side is that hand.
    let handL = P(-sx, chestY, 0);
    let handR = P(sx, chestY, 0);
    let bestL = 0, bestR = 0;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < chestY - H * 0.06) continue;
      const x = pos.getX(i), z = pos.getZ(i);
      const reach = Math.hypot(x, y - chestY, z);
      if (x < 0 && reach > bestL) { bestL = reach; handL.set(x, y, z); }
      if (x > 0 && reach > bestR) { bestR = reach; handR.set(x, y, z); }
    }

    const heads = {
      hips: P(0, H * LM.hip, 0),
      spine: P(0, H * LM.spine, 0),
      chest: P(0, chestY, 0),
      neck: P(0, H * LM.neck, 0),
      head: P(0, H * LM.head, 0),
      upperArmL: P(-sx, chestY, 0),
      upperArmR: P(sx, chestY, 0),
    };

    // Split each arm into upper/fore/hand along the shoulder→hand line. Real
    // elbows bend off that line, but with soft weights the visual difference is
    // far smaller than the cost of trying to detect them in a 2400-vert cloud.
    const lerp = (a, b, t) => a.clone().lerp(b, t);
    heads.forearmL = lerp(heads.upperArmL, handL, 0.46);
    heads.handL = lerp(heads.upperArmL, handL, 0.84);
    heads.forearmR = lerp(heads.upperArmR, handR, 0.46);
    heads.handR = lerp(heads.upperArmR, handR, 0.84);

    this.handTipL = handL.clone();
    this.handTipR = handR.clone();

    // Each bone's segment runs from its own head to its first child's head; leaf
    // bones extend along their parent's direction.
    this.boneHead = BONES.map((b) => heads[b.name]);
    this.boneTail = BONES.map((b, i) => {
      const child = BONES.findIndex((c) => c.parent === i);
      if (child >= 0) return heads[BONES[child].name].clone();
      const parent = b.parent >= 0 ? heads[BONES[b.parent].name] : heads.hips;
      return heads[b.name].clone().add(
        heads[b.name].clone().sub(parent).multiplyScalar(0.6),
      );
    });

    // Bind matrices: world transform of each bone at rest (translation only —
    // the rig rotates about the sculpted pose, it does not re-orient it).
    this.bind = this.boneHead.map((h) => new THREE.Matrix4().makeTranslation(h.x, h.y, h.z));
    this.bindInverse = this.bind.map((m) => m.clone().invert());
  }

  /**
   * Two-bone weights by distance to each bone's segment.
   *
   * The skirt is forced wholly onto `hips`. A jarit is wound tight enough to be
   * structurally rigid, so letting stray leg or spine influence reach it would
   * ripple the hem for no reason — and there are no leg bones here precisely
   * because nothing below the waist should articulate.
   */
  _computeWeights() {
    const pos = this.geometry.attributes.position;
    const n = pos.count;
    this.boneIndex = new Uint8Array(n * 2);
    this.boneWeight = new Float32Array(n * 2);

    const p = new THREE.Vector3();
    const scratch = { t: 0 };
    const hipY = this.height * LM.hip;
    const hipsIdx = NAME_TO_INDEX.hips;
    const dists = new Float32Array(BONES.length);

    for (let i = 0; i < n; i++) {
      p.set(pos.getX(i), pos.getY(i), pos.getZ(i));

      if (p.y < hipY) {
        this.boneIndex[i * 2] = hipsIdx;
        this.boneIndex[i * 2 + 1] = hipsIdx;
        this.boneWeight[i * 2] = 1;
        this.boneWeight[i * 2 + 1] = 0;
        continue;
      }

      let b0 = 0, b1 = 0, d0 = Infinity, d1 = Infinity;
      for (let b = 0; b < BONES.length; b++) {
        const d = distToSegment(p, this.boneHead[b], this.boneTail[b], scratch);
        dists[b] = d;
        if (d < d0) { d1 = d0; b1 = b0; d0 = d; b0 = b; }
        else if (d < d1) { d1 = d; b1 = b; }
      }

      // Inverse-square falloff, so the nearest bone dominates and the second only
      // softens the seam.
      const w0 = 1 / (d0 * d0 + 1e-5);
      const w1 = 1 / (d1 * d1 + 1e-5);
      const sum = w0 + w1;
      this.boneIndex[i * 2] = b0;
      this.boneIndex[i * 2 + 1] = b1;
      this.boneWeight[i * 2] = w0 / sum;
      this.boneWeight[i * 2 + 1] = w1 / sum;
    }
  }

  /**
   * Applies a set of per-bone Euler deltas and re-skins the mesh.
   * @param {Record<string, [number, number, number]>} deltas  radians, from rest
   */
  apply(deltas) {
    // 1 — local matrices: rotate in place about each bone's head.
    for (let b = 0; b < BONES.length; b++) {
      const d = deltas[BONES[b].name];
      const h = this.boneHead[b];
      const m = this._local[b];
      if (!d || (d[0] === 0 && d[1] === 0 && d[2] === 0)) {
        m.identity();
      } else {
        this._e.set(d[0], d[1], d[2], 'XYZ');
        this._q.setFromEuler(this._e);
        m.makeRotationFromQuaternion(this._q);
        // Rotate about the head rather than the origin. Scratch matrices are
        // reused — this runs every frame for every bone.
        this._tA.makeTranslation(h.x, h.y, h.z);
        this._tB.makeTranslation(-h.x, -h.y, -h.z);
        m.premultiply(this._tA);
        m.multiply(this._tB);
      }
    }

    // 2 — accumulate down the hierarchy. BONES is ordered parents-first, so one
    // forward pass is enough.
    for (let b = 0; b < BONES.length; b++) {
      const parent = BONES[b].parent;
      if (parent < 0) this._world[b].copy(this._local[b]);
      else this._world[b].multiplyMatrices(this._world[parent], this._local[b]);
      this._skin[b].copy(this._world[b]);
    }

    // 3 — skin. Linear blend of two bones per vertex.
    //
    // The matrices are flattened into one Float32Array and the transform is
    // written out longhand rather than going through Vector3.applyMatrix4. At
    // ~2400 vertices this loop runs 60 times a second, and the per-call overhead
    // of the object API was the bulk of its cost; the arithmetic itself is
    // trivial. No allocation, no property lookups through three.js objects.
    const flat = this._flat;
    for (let b = 0; b < BONES.length; b++) flat.set(this._skin[b].elements, b * 16);

    const pos = this.geometry.attributes.position;
    const arr = pos.array;
    const rest = this.restPositions;
    const n = pos.count;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const rx = rest[i3], ry = rest[i3 + 1], rz = rest[i3 + 2];

      const o0 = this.boneIndex[i * 2] * 16;
      const w0 = this.boneWeight[i * 2];
      // Column-major, as three.js stores them.
      let x = (flat[o0] * rx + flat[o0 + 4] * ry + flat[o0 + 8] * rz + flat[o0 + 12]) * w0;
      let y = (flat[o0 + 1] * rx + flat[o0 + 5] * ry + flat[o0 + 9] * rz + flat[o0 + 13]) * w0;
      let z = (flat[o0 + 2] * rx + flat[o0 + 6] * ry + flat[o0 + 10] * rz + flat[o0 + 14]) * w0;

      const w1 = this.boneWeight[i * 2 + 1];
      if (w1 > 0.001) {
        const o1 = this.boneIndex[i * 2 + 1] * 16;
        x += (flat[o1] * rx + flat[o1 + 4] * ry + flat[o1 + 8] * rz + flat[o1 + 12]) * w1;
        y += (flat[o1 + 1] * rx + flat[o1 + 5] * ry + flat[o1 + 9] * rz + flat[o1 + 13]) * w1;
        z += (flat[o1 + 2] * rx + flat[o1 + 6] * ry + flat[o1 + 10] * rz + flat[o1 + 14]) * w1;
      }

      arr[i3] = x; arr[i3 + 1] = y; arr[i3 + 2] = z;
    }
    pos.needsUpdate = true;
  }

  /** World-space position of a bone head after the last `apply`. */
  boneWorld(name, out) {
    const b = NAME_TO_INDEX[name];
    const h = this.boneHead[b];
    return out.set(h.x, h.y, h.z).applyMatrix4(this._skin[b]);
  }
}

/**
 * Replaces the mesh's UVs with a cylindrical projection about the vertical axis.
 *
 * The statue was exported from a scan/sculpt and its UVs are not laid out for
 * tiling anything: applying the batik through them left most of the skirt flat
 * brown with one stretched band of pattern across it. A skirt is very close to a
 * cylinder, so wrapping the texture around the body axis puts the motif on at a
 * consistent scale everywhere.
 *
 * There is a seam at the back where the angle wraps. It is one triangle wide and
 * it faces away from every camera beat, which is cheaper than splitting vertices
 * to hide it.
 */
export function generateCylindricalUVs(rig) {
  const geo = rig.geometry;
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const H = rig.height;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    uv[i * 2] = (Math.atan2(z, x) / (Math.PI * 2)) + 0.5;
    uv[i * 2 + 1] = y / H;
  }

  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Costume regions, in the order their materials are attached. */
export const REGION = { SKIRT: 0, KEBAYA: 1, SKIN: 2, HAIR: 3 };
export const REGION_COUNT = 4;

/**
 * Labels every vertex with the garment covering it.
 *
 * The statue is a single undivided mesh, so the costume has to be inferred from
 * geometry. Rules are written against the same measured landmarks as the
 * skeleton, and against distance along each arm — a kebaya has full-length
 * sleeves, so only the hands emerge, and using a fraction of arm length rather
 * than an absolute x keeps that true whatever the arm is doing.
 *
 * @returns {Uint8Array} one REGION per vertex
 */
export function computeRegions(rig) {
  const pos = rig.geometry.attributes.position;
  const H = rig.height;
  const out = new Uint8Array(pos.count);

  const hipY = H * LM.hip;
  const shoulderY = H * LM.chest;
  const armInner = H * 0.072; // beyond this half-width, above the waist, is arm
  const headY = H * 0.845;
  const headHalf = H * 0.115;

  const shoulderL = new THREE.Vector3(-H * LM.shoulderX, shoulderY, 0);
  const shoulderR = new THREE.Vector3(H * LM.shoulderX, shoulderY, 0);
  const armLenL = shoulderL.distanceTo(rig.handTipL);
  const armLenR = shoulderR.distanceTo(rig.handTipR);
  const p = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i));

    if (p.y < hipY) {
      out[i] = REGION.SKIRT;
      continue;
    }

    // Head: compact mass near the axis, above the neck — and actually weighted to
    // the head or neck bone.
    //
    // The position test alone is not enough: the raised arm passes right beside
    // the head, so a purely spatial rule painted a bare patch onto the upper
    // sleeve. The bone assignment already knows which is which, having been fitted
    // to this geometry, so it arbitrates.
    const primary = BONES[rig.boneIndex[i * 2]].name;
    const onHead = primary === 'head' || primary === 'neck';

    if (onHead && p.y > headY && Math.abs(p.x) < headHalf) {
      // Hair covers the crown and the back of the skull; the face is the front
      // of the lower half. The horizontal cut sits at the upper forehead — any
      // lower and it draws a dark band straight across the eyes.
      out[i] = p.y > H * 0.952 || p.z < -H * 0.004 ? REGION.HAIR : REGION.SKIN;
      continue;
    }

    // Arm, by bone rather than by x: an arm folded across the body sits near the
    // axis and would otherwise be mistaken for torso.
    const onArm = primary.startsWith('upperArm') || primary.startsWith('forearm') || primary.startsWith('hand');
    if (onArm || Math.abs(p.x) > armInner) {
      const left = p.x < 0;
      const sh = left ? shoulderL : shoulderR;
      const len = left ? armLenL : armLenR;
      const along = p.distanceTo(sh) / Math.max(len, 1e-4);
      // Sleeve to the wrist; only the last sixth is bare hand.
      out[i] = along > 0.84 ? REGION.SKIN : REGION.KEBAYA;
      continue;
    }

    out[i] = REGION.KEBAYA;
  }

  return out;
}

/**
 * Reorders the index buffer so each region's triangles are contiguous, and adds
 * one geometry group per region.
 *
 * Grouping rather than vertex colours because the skirt needs the batik *texture*
 * — a colour attribute could not carry it. A triangle takes the region of its
 * most common vertex, which puts the seam on a whole-triangle boundary instead of
 * dithering it.
 */
export function applyRegionGroups(rig, regions) {
  const geo = rig.geometry;
  const idx = geo.index;
  const triCount = idx.count / 3;

  const buckets = Array.from({ length: REGION_COUNT }, () => []);
  const tally = new Uint8Array(REGION_COUNT);

  for (let t = 0; t < triCount; t++) {
    tally.fill(0);
    const a = idx.getX(t * 3), b = idx.getX(t * 3 + 1), c = idx.getX(t * 3 + 2);
    tally[regions[a]]++;
    tally[regions[b]]++;
    tally[regions[c]]++;
    let best = 0;
    for (let r = 1; r < REGION_COUNT; r++) if (tally[r] > tally[best]) best = r;
    buckets[best].push(a, b, c);
  }

  const flat = new Uint32Array(idx.count);
  let cursor = 0;
  geo.clearGroups();
  for (let r = 0; r < REGION_COUNT; r++) {
    const list = buckets[r];
    flat.set(list, cursor);
    if (list.length) geo.addGroup(cursor, list.length, r);
    cursor += list.length;
  }

  geo.setIndex(new THREE.BufferAttribute(flat, 1));
  return buckets.map((b) => b.length / 3);
}

export { BONES, LM };
