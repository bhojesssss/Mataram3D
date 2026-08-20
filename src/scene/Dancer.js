import * as THREE from 'three';
import { jaritMaps, fabricMaps, applyMaps } from './textures.js';
import { JOINTS, POSES, samplePose, makePoseBuffer } from './dance.js';
import {
  StatueRig,
  BONES,
  REGION,
  REGION_COUNT,
  computeRegions,
  applyRegionGroups,
  generateCylindricalUVs,
} from './statueRig.js';

/**
 * The dancer in the pendopo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The body is referensi/dancin_statue.glb, not primitives.
 *
 * The earlier figure was assembled from cylinders and spheres, and no amount of
 * proportion-tuning was going to make that read as a person. This loads the
 * supplied statue instead and fits a skeleton to it at runtime (see statueRig.js)
 * — the mesh arrives with no bones, no skin and no animation, so keeping the
 * scroll-driven dance meant rigging it rather than just placing it.
 *
 * ── The sculpted pose is the anchor ─────────────────────────────────────────
 * The statue already stands in a good dance pose: left arm raised, right extended.
 * dance.js poses are applied as deltas measured *from pose 2* — the raised-
 * selendang pose it most resembles — so at that beat the figure sits in exactly
 * the shape it was sculpted in, and the rest of the phrase moves around it.
 *
 * Deltas are damped by DAMP. Two-bone linear weights cannot take a 90° shoulder
 * swing without pinching, and Javanese court dance is small-amplitude anyway.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SKIN = '#C89A72';
const KEBAYA = '#2FBF4F';
const SELENDANG = '#F5326E';
const HAIR = '#171310';

/** How much of dance.js's range survives onto the fitted rig. */
const DAMP = 0.5;

const MODEL_URL = '/models/dancer.glb';

export class Dancer extends THREE.Group {
  constructor() {
    super();
    this.name = 'dancer';
    this._disposables = [];
    this.ready = false;

    this._pose = makePoseBuffer();
    this._delta = Object.fromEntries(BONES.map((b) => [b.name, [0, 0, 0]]));
    this.phrase = 0;

    this._buildMaterials();
    this._buildSelendang();
    this._buildContactShadow();

    // Kicked off here rather than awaited: Scene builds synchronously, and the
    // loader screen in main.js already covers the gap.
    this.loaded = this._load().catch((err) => {
      console.warn('[mataram] dancer model failed to load:', err);
    });
  }

  _track(x) {
    this._disposables.push(x);
    return x;
  }

  async _load() {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);

    let source = null;
    gltf.scene.traverse((o) => {
      if (o.isMesh && !source) source = o;
    });
    if (!source) throw new Error('no mesh in ' + MODEL_URL);

    // Detach from the glTF's own node transforms — the rig works in its own
    // normalised space and applies scale and orientation itself.
    const geo = source.geometry.clone();
    geo.applyMatrix4(source.matrixWorld);

    this.rig = new StatueRig(geo, 1.68);
    // Must come before the materials are attached: the export's own UVs cannot
    // tile the batik, so they are replaced with a cylindrical wrap.
    generateCylindricalUVs(this.rig);
    const regions = computeRegions(this.rig);
    applyRegionGroups(this.rig, regions);

    const mats = new Array(REGION_COUNT);
    mats[REGION.SKIRT] = this.mJarit;
    mats[REGION.KEBAYA] = this.mKebaya;
    mats[REGION.SKIN] = this.mSkin;
    mats[REGION.HAIR] = this.mHair;

    const body = new THREE.Mesh(geo, mats);
    body.castShadow = false; // see the contact-shadow note below
    body.receiveShadow = true;
    body.frustumCulled = false; // vertices are rewritten every frame
    this.add(body);
    this.body = body;

    this._handWorld = new THREE.Vector3();
    this.ready = true;
  }

  _buildMaterials() {
    const fabric = fabricMaps();

    this.mSkin = this._track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(SKIN),
        roughness: 0.68,
        metalness: 0,
        flatShading: false,
      }),
    );

    this.mKebaya = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(KEBAYA),
          roughness: 1,
          metalness: 0,
        }),
        fabric,
        [3, 4],
        0.7,
      ),
    );

    this.mSelendang = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(SELENDANG),
          roughness: 0.34,
          metalness: 0.04,
          side: THREE.DoubleSide,
        }),
        fabric,
        [2, 8],
        0.35,
      ),
    );

    // The statue's skirt has no UVs worth trusting, so the batik is projected
    // by triplanar-ish repeat rather than by the mesh's own mapping.
    this.mJarit = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }),
        jaritMaps(),
        [3, 4],
        0.85,
      ),
    );

    this.mHair = this._track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(HAIR),
        roughness: 0.4,
        metalness: 0.02,
      }),
    );
  }

  /**
   * The trailing selendang: a strip spanning the raised hand and the hip.
   *
   * A selendang runs *from* the hand *to* the waist and its shape is the sag
   * between — a strip with no span has nothing to sag, which is why an earlier
   * version hanging straight down from the fist read as a stiff slab. Rebuilt
   * each frame along a quadratic Bézier, with the control point below the chord.
   */
  _buildSelendang() {
    this.SEG_U = 5;
    this.SEG_V = 30;
    const geo = this._track(new THREE.PlaneGeometry(1, 1, this.SEG_U, this.SEG_V));
    geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
    geo.attributes.normal.setUsage(THREE.DynamicDrawUsage);

    const ribbon = new THREE.Mesh(geo, this.mSelendang);
    ribbon.castShadow = false;
    ribbon.frustumCulled = false;
    ribbon.visible = false; // until the rig exists and can supply a hand
    this.add(ribbon);
    this.selendang = ribbon;

    this._sHand = new THREE.Vector3();
    this._sHip = new THREE.Vector3();
    this._sCtrl = new THREE.Vector3();
    this._sP = new THREE.Vector3();
    this._sPrev = new THREE.Vector3();
    this._sTan = new THREE.Vector3();
    this._sSide = new THREE.Vector3();
    this._sUp = new THREE.Vector3(0, 1, 0);
    this._handPrev = new THREE.Vector3();
    this._handVel = new THREE.Vector3();
    this._sag = 0;
  }

  /**
   * Soft blob shadow, built from concentric discs.
   *
   * She is excluded from the sun's shadow map: she is the only thing in the scene
   * that moves, and keeping her in it forces the whole 2048² pass over ~200
   * casters to re-run — measured at more than the rest of the frame put together.
   *
   * The falloff is stacked `material.opacity` rather than a texture because
   * sampled alpha does not survive this pipeline: a black texture with the
   * gradient in its own alpha fed to `map` rendered as nothing, the same gradient
   * as `alphaMap` rendered as nothing, and per-vertex alpha rendered as a hard
   * opaque disc. Only `material.opacity` works, so the gradient is built from it.
   */
  _buildContactShadow() {
    // Seven closely-spaced rings rather than four. At four the steps between
    // radii were far enough apart to read as concentric circles instead of as a
    // penumbra; more rings at lower individual opacity blur into a gradient.
    const RINGS = 7;
    this._shadowRings = [];
    const group = new THREE.Group();

    for (let i = 0; i < RINGS; i++) {
      const t = i / (RINGS - 1);
      // Radii bunched toward the outside, where a real penumbra fades slowest.
      const geo = this._track(new THREE.CircleGeometry(0.16 + Math.pow(t, 0.75) * 0.36, 32));
      const mat = this._track(
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          depthWrite: false,
          opacity: 0.07,
        }),
      );
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = -Math.PI / 2;
      // 25mm of clearance: at 4mm the depth buffer lost the gap at this distance
      // and the discs failed the depth test outright.
      ring.position.y = 0.025 - i * 0.0008;
      ring.renderOrder = 1 + i;
      group.add(ring);
      this._shadowRings.push(mat);
    }

    this.add(group);
    this.contactShadow = group;
  }

  /**
   * Converts a sampled dance.js pose into bone deltas for the fitted rig.
   *
   * dance.js writes rotations for a figure whose limbs hang along -Y; the statue's
   * do not. Subtracting pose 2 turns those absolute rotations into differences,
   * which are meaningful against any rest pose.
   */
  _toDeltas(pose) {
    const ref = POSES[2];
    const ZERO = [0, 0, 0];

    for (const name of BONES.map((b) => b.name)) {
      // dance.js calls the root `pelvis`; the rig calls it `hips`.
      const src = name === 'hips' ? 'pelvis' : name;
      const d = this._delta[name];

      if (!JOINTS.includes(src)) {
        d[0] = d[1] = d[2] = 0;
        continue;
      }

      const now = pose[src] ?? ZERO;
      const base = ref[src] ?? ZERO;
      // Z is the abduction axis and dance.js mirrors it on the right so one
      // positive number opens both arms outward. The rig has no such convention,
      // so the flip is applied here.
      const sign = name.endsWith('R') ? -1 : 1;
      d[0] = (now[0] - base[0]) * DAMP;
      d[1] = (now[1] - base[1]) * DAMP;
      d[2] = (now[2] - base[2]) * DAMP * sign;
    }

    return this._delta;
  }

  /**
   * @param {number} phrase   scroll position within the dance, 0→1 per cycle
   * @param {number} elapsed  seconds, for the motion that must not freeze
   */
  update(phrase, elapsed) {
    this.phrase = phrase;
    if (!this.ready) return;

    // Scroll sets the choreography; time adds a breath on top, so a reader who
    // stops scrolling sees a dancer holding a pose rather than a frozen model.
    samplePose(phrase, this._pose);
    const breath = Math.sin(elapsed * 0.9) * 0.006;
    this._pose.lift += breath;
    this._pose.chest[0] += breath * 1.6;
    this._pose.neck[2] += Math.sin(elapsed * 0.55 + 1.1) * 0.012;

    this.rig.apply(this._toDeltas(this._pose));

    // No leg bones — the jarit is rigid, as a real one is — so mendhak is
    // expressed by lowering the whole figure rather than by bending knees.
    const depth = -this._pose.lift;
    this.body.position.y = this._pose.lift * 0.8;

    this.updateMatrixWorld(true);
    this._updateSelendang(elapsed);

    const spread = 1.25 - depth * 0.9;
    this.contactShadow.scale.set(spread, 1, spread * 0.86);
    for (const m of this._shadowRings) m.opacity = 0.055 + depth * 0.2;
  }

  _updateSelendang(elapsed) {
    // Held in the raised hand, as in the reference photograph.
    this.rig.boneWorld('handL', this._sHand);
    this._sHand.y += this.body.position.y;
    this.rig.boneWorld('hips', this._sHip);
    this._sHip.y += this.body.position.y;
    this._sHip.x -= 0.14;
    this._sHip.z += 0.1;

    this.selendang.visible = true;

    const span = this._sHand.distanceTo(this._sHip);
    const targetSag = 0.5 - span * 0.22;
    // Eased: cloth has inertia, and scrubbing the scroll teleports the hand.
    this._sag += (targetSag - this._sag) * 0.12;

    this._handVel.subVectors(this._sHand, this._handPrev);
    const speed = Math.min(this._handVel.length() * 30, 1.6);
    this._handPrev.copy(this._sHand);

    this._sCtrl
      .addVectors(this._sHand, this._sHip)
      .multiplyScalar(0.5)
      .addScaledVector(this._sUp, -Math.max(this._sag, 0.12) * 1.5);
    this._sCtrl.z += 0.14 + speed * 0.1;

    const WIDTH = 0.32;
    const cols = this.SEG_U + 1;
    const pos = this.selendang.geometry.attributes.position;

    for (let r = 0; r <= this.SEG_V; r++) {
      const t = r / this.SEG_V;
      const mt = 1 - t;

      this._sP.set(
        mt * mt * this._sHand.x + 2 * mt * t * this._sCtrl.x + t * t * this._sHip.x,
        mt * mt * this._sHand.y + 2 * mt * t * this._sCtrl.y + t * t * this._sHip.y,
        mt * mt * this._sHand.z + 2 * mt * t * this._sCtrl.z + t * t * this._sHip.z,
      );

      // Ripple, pinned where the cloth is held at either end.
      const pinned = Math.sin(Math.PI * t);
      this._sP.z += Math.sin(elapsed * 1.9 - t * 6.5) * pinned * (0.035 + speed * 0.05);
      this._sP.y += Math.cos(elapsed * 1.4 - t * 5.0) * pinned * 0.02;

      if (r === 0) this._sPrev.copy(this._sP);
      this._sTan.subVectors(this._sP, this._sPrev);
      if (this._sTan.lengthSq() < 1e-8) this._sTan.set(0, -1, 0);
      this._sTan.normalize();
      this._sPrev.copy(this._sP);

      this._sSide.crossVectors(this._sTan, this._sUp);
      if (this._sSide.lengthSq() < 1e-6) this._sSide.set(1, 0, 0);
      this._sSide.normalize();

      const w = WIDTH * (0.42 + pinned * 0.75);
      const twist = Math.sin(elapsed * 1.2 + t * 3.4) * 0.16 * pinned;

      for (let c = 0; c < cols; c++) {
        const u = c / this.SEG_U - 0.5;
        pos.setXYZ(
          r * cols + c,
          this._sP.x + this._sSide.x * u * w,
          this._sP.y + this._sSide.y * u * w + u * twist * 0.3,
          this._sP.z + this._sSide.z * u * w + u * twist,
        );
      }
    }

    pos.needsUpdate = true;
    this.selendang.geometry.computeVertexNormals();
  }

  dispose() {
    for (const d of this._disposables) d.dispose?.();
    this._disposables.length = 0;
    this.body?.geometry.dispose();
  }
}
