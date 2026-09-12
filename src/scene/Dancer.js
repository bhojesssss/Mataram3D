import * as THREE from 'three';
import { fabricMaps, applyMaps } from './textures.js';

/**
 * The dancer in the pendopo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The body is public/models/dancer_detail.glb — a Meshy-generated figure that
 * arrives fully made: baked clothing textures, a 27-joint mixamorig skeleton
 * and its own ~10s dance clip.
 *
 * This replaces the earlier pipeline that took an unrigged statue mesh and
 * fitted a skeleton to it at runtime (statueRig.js + dance.js). That existed
 * because the statue had no bones; this model does. The clip is not played,
 * though: she holds a single frame of it (POSE_TIME), chosen to match the
 * reference photograph of a bedhaya dancer mid-phrase. The selendang ribbon
 * stays time-driven, so the held pose still reads as alive.
 *
 * Two procedural pieces survive from the old dancer, because the GLB has
 * neither: the trailing selendang ribbon (pinned to the model's LeftHand bone)
 * and the blob contact shadow (she is excluded from the sun's shadow map for
 * performance — see the note on _buildContactShadow).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SELENDANG = '#F5326E';

const MODEL_URL = '/models/dancer_detail.glb';

/** Target height in metres; the GLB is normalised to this on load. */
const HEIGHT = 1.68;

/**
 * Where in the baked clip she is frozen, in seconds. The clip is never played —
 * this frame was picked because it matches the reference photograph: right arm
 * extended, left hand carrying the selendang, weight settled in mendhak.
 */
const POSE_TIME = 0.4;

export class Dancer extends THREE.Group {
  constructor() {
    super();
    this.name = 'dancer';
    this._disposables = [];
    this.ready = false;
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

    const model = gltf.scene;

    // Normalise from the bind pose: scale to HEIGHT, feet on y=0, centred on
    // the group origin. The group itself is placed by Scene at deck height.
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(HEIGHT / size.y);
    model.updateMatrixWorld(true);
    box.setFromObject(model);
    model.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false; // see the contact-shadow note below
        o.receiveShadow = true;
        o.frustumCulled = false; // skinned verts move outside the bind bounds
      }
    });

    this.add(model);
    this.body = model;

    // Two clips ship in the file; the short one is a rest pose. Play the dance.
    const clip = gltf.animations.reduce((a, b) => (a.duration >= b.duration ? a : b));

    // The clip carries root motion that walks her metres across the deck — and
    // out of the interior camera framing, which is composed around her holding
    // the centre. Pin the hips' XZ to their first keyframe so she dances in
    // place; Y is kept, it carries the crouches.
    for (const track of clip.tracks) {
      if (!track.name.endsWith('Hips.position')) continue;
      const v = track.values;
      for (let i = 3; i < v.length; i += 3) {
        v[i] = v[0];
        v[i + 2] = v[2];
      }
    }
    this._mixer = new THREE.AnimationMixer(model);
    this._mixer.clipAction(clip).play();
    // Frozen, not played: she holds one pose (see POSE_TIME).
    this._mixer.setTime(POSE_TIME);

    // The selendang hangs from her hand; both ends track these bones. The GLB
    // names them mixamorig:LeftHand etc., but GLTFLoader strips the colon —
    // ':' is reserved in animation track paths (PropertyBinding.sanitizeNodeName).
    this._handBone = model.getObjectByName('mixamorigLeftHand');
    this._hipBone = model.getObjectByName('mixamorigHips');

    this.ready = true;
  }

  _buildMaterials() {
    this.mSelendang = this._track(
      applyMaps(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(SELENDANG),
          roughness: 0.34,
          metalness: 0.04,
          side: THREE.DoubleSide,
        }),
        fabricMaps(),
        [2, 8],
        0.35,
      ),
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
    ribbon.visible = false; // until the model exists and can supply a hand
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

    group.scale.set(1.15, 1, 1);
    this.add(group);
    this.contactShadow = group;
  }

  /**
   * @param {number} phrase   scroll position within the dance, 0→1 per cycle
   *                          (kept for API compatibility; the baked clip is
   *                          clock-driven, not scroll-driven)
   * @param {number} elapsed  seconds since the scene started
   */
  update(phrase, elapsed) {
    this.phrase = phrase;
    if (!this.ready) return;

    this.updateMatrixWorld(true);
    this._updateSelendang(elapsed);
  }

  _updateSelendang(elapsed) {
    if (!this._handBone || !this._hipBone) return;

    // Bone positions come out in world space; the ribbon's vertices live in the
    // group's local space, so both ends are pulled back through worldToLocal.
    this._handBone.getWorldPosition(this._sHand);
    this.worldToLocal(this._sHand);
    this._hipBone.getWorldPosition(this._sHip);
    this.worldToLocal(this._sHip);
    this._sHip.x -= 0.14;
    this._sHip.z += 0.1;

    this.selendang.visible = true;

    const span = this._sHand.distanceTo(this._sHip);
    const targetSag = 0.5 - span * 0.22;
    // Eased: cloth has inertia, and the hand teleports on animation loop.
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

    this._mixer?.stopAllAction();
    this.body?.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        m.map?.dispose();
        m.normalMap?.dispose();
        m.metalnessMap?.dispose();
        m.roughnessMap?.dispose();
        m.dispose();
      }
    });
  }
}
