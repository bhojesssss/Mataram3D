import * as THREE from 'three';
import { beats } from '../config/tokens.js';

/**
 * The scroll-driven camera.
 *
 * Two things have to be true at once: the camera must hit exact narrative marks
 * (the beats in tokens.js), and it must move through them without a visible kink.
 * Keyframe-lerping gives the first and fails the second; a raw spline gives the
 * second and fails the first.
 *
 * So both: positions and look-targets go into CatmullRom splines for C1-continuous
 * motion, and scroll progress is remapped through the beat table before sampling.
 * Keyframe i sits at spline u = i/(n-1) and at scroll t = beats[i]; `_remap` is the
 * piecewise-linear bridge. Move a beat and the timing changes without the path
 * shape changing at all.
 *
 * On top of the spline sit three smaller motions, each damped independently:
 * a critically-damped follow toward the sampled pose (the thing that actually feels
 * "smooth"), a low-amplitude idle breath, and mouse parallax.
 */

/**
 * The path. Order matters — the spline runs through these in sequence.
 *
 * Each entry names a beat rather than carrying a hardcoded scroll fraction; the
 * timings are supplied by `retime()` from measured DOM positions. Geometry here,
 * schedule there.
 */
const PATH = [
  // beat         position                     look-at                    fov
  // The hero tilts up rather than sitting level: aiming above the mustaka drops the
  // whole pendopo into the lower half of frame and leaves the title clear sky to
  // sit in. The approach then tilts back down, which reads as lowering your eyes
  // as you get close.
  { beat: 'hero',      pos: [0, 7.0, 66],   look: [0, 17.0, 0],      fov: 47 },
  { beat: 'approach',  pos: [0, 5.2, 43],   look: [0, 9.5, 0],       fov: 46 },
  // From here the dancer at the centre of the deck is the subject, not the
  // architecture. The threshold beat brings her into view down the entry axis;
  // `interior` is a near-full-body shot of her, offset so she sits in the left
  // third with the Palace panel clear on the right; `ascend` then rises past her
  // and tilts up, which is where the tumpang sari reveal now happens.
  { beat: 'threshold', pos: [0, 3.0, 15],    look: [0, 2.5, 0],       fov: 46 },
  { beat: 'interior',  pos: [0, 2.25, 4.3],  look: [1.35, 2.0, 0],    fov: 45 },
  { beat: 'ascend',    pos: [0, 5.4, 4.6],   look: [0, 10.6, -0.6],   fov: 56 },
  { beat: 'compound',  pos: [0, 36, 48],    look: [0, 6, 0],         fov: 44 },
  { beat: 'horizon',   pos: [0, 30, 92],    look: [0, 30, -240],     fov: 38 },
  { beat: 'end',       pos: [0, 24, 124],   look: [0, 28, -320],     fov: 36 },
];

// Scratch vectors — the update loop runs every frame and must not allocate.
const TMP_POS = new THREE.Vector3();
const TMP_LOOK = new THREE.Vector3();

export class CameraRig {
  constructor(camera, beatTable = beats) {
    this.camera = camera;

    this.positionCurve = new THREE.CatmullRomCurve3(
      PATH.map((k) => new THREE.Vector3(...k.pos)),
      false,
      'catmullrom',
      0.5,
    );
    this.targetCurve = new THREE.CatmullRomCurve3(
      PATH.map((k) => new THREE.Vector3(...k.look)),
      false,
      'catmullrom',
      0.5,
    );

    this.retime(beatTable);

    this.progress = 0; // raw scroll 0→1, written by ScrollController
    this.interiority = 0; // 0 outside → 1 fully under the roof

    // Damped state.
    this._pos = new THREE.Vector3(...PATH[0].pos);
    this._look = new THREE.Vector3(...PATH[0].look);
    this._fov = PATH[0].fov;

    this._pointer = new THREE.Vector2();
    this._pointerDamped = new THREE.Vector2();

    this.reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this._onPointerMove = this._onPointerMove.bind(this);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
  }

  /**
   * Re-anchor the path to a new beat table. The spline shape is untouched — only
   * when each keyframe is reached changes. Safe to call on resize or after content
   * changes the page height.
   */
  retime(beatTable) {
    this.beats = beatTable;
    this.keys = PATH.map((k) => ({ ...k, t: beatTable[k.beat] ?? beats[k.beat] }));
  }

  _onPointerMove(e) {
    // -1..1, origin at viewport centre.
    this._pointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    );
  }

  /** Scroll progress → spline u, honouring the beat table. */
  _remap(t) {
    const keys = this.keys;
    const n = keys.length;
    if (t <= keys[0].t) return 0;
    if (t >= keys[n - 1].t) return 1;
    for (let i = 0; i < n - 1; i++) {
      const a = keys[i].t;
      const b = keys[i + 1].t;
      if (t >= a && t <= b) {
        const local = (t - a) / (b - a);
        return (i + local) / (n - 1);
      }
    }
    return 1;
  }

  /** FOV rides the same remap, lerped between the bracketing keys. */
  _sampleFov(t) {
    const keys = this.keys;
    const n = keys.length;
    if (t <= keys[0].t) return keys[0].fov;
    if (t >= keys[n - 1].t) return keys[n - 1].fov;
    for (let i = 0; i < n - 1; i++) {
      if (t >= keys[i].t && t <= keys[i + 1].t) {
        const local = (t - keys[i].t) / (keys[i + 1].t - keys[i].t);
        const eased = local * local * (3 - 2 * local); // smoothstep
        return keys[i].fov + (keys[i + 1].fov - keys[i].fov) * eased;
      }
    }
    return keys[n - 1].fov;
  }

  /**
   * Frame-rate independent damping. `lambda` is roughly "how many e-foldings per
   * second" — higher converges faster. Using an exponential rather than a fixed lerp
   * keeps the feel identical at 60Hz and 144Hz.
   */
  static damp(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }

  static dampVec(out, target, lambda, dt) {
    const f = 1 - Math.exp(-lambda * dt);
    out.x += (target.x - out.x) * f;
    out.y += (target.y - out.y) * f;
    out.z += (target.z - out.z) * f;
    return out;
  }

  update(dt, elapsed) {
    const t = THREE.MathUtils.clamp(this.progress, 0, 1);
    const u = this._remap(t);

    const targetPos = this.positionCurve.getPoint(u, TMP_POS);
    const targetLook = this.targetCurve.getPoint(u, TMP_LOOK);
    const targetFov = this._sampleFov(t);

    // How enclosed the camera is — drives lantern intensity and fog density.
    // Ramps up crossing the threshold, holds under the roof, falls off on ascent.
    const b = this.beats;
    const enter = THREE.MathUtils.smoothstep(t, b.approach, b.interior);
    const exit = 1 - THREE.MathUtils.smoothstep(t, b.ascend, b.compound);
    this.interiority = Math.min(enter, exit);

    if (this.reducedMotion) {
      // Honour the OS setting: land exactly on the pose, skip breath and parallax.
      this._pos.copy(targetPos);
      this._look.copy(targetLook);
      this._fov = targetFov;
      this.camera.position.copy(this._pos);
      this.camera.lookAt(this._look);
      this.camera.fov = this._fov;
      this.camera.updateProjectionMatrix();
      return;
    }

    // 1 — the main follow. This is the "smooth" the brief asks for: the camera
    // chases the scroll rather than being pinned to it, so flicks settle instead
    // of snapping.
    CameraRig.dampVec(this._pos, targetPos, 3.2, dt);
    CameraRig.dampVec(this._look, targetLook, 2.6, dt);
    this._fov = CameraRig.damp(this._fov, targetFov, 3.0, dt);

    // 2 — idle breath. Fades out once inside, where the tight framing would
    // otherwise make it read as drift rather than life.
    const breathAmt = 1 - this.interiority * 0.75;
    const breathY = Math.sin(elapsed * 0.36) * 0.16 * breathAmt;
    const breathX = Math.sin(elapsed * 0.24 + 1.3) * 0.22 * breathAmt;

    // 3 — mouse parallax, damped hard so it never feels twitchy. Scaled down at the
    // wide beats where a big offset would swing the horizon.
    this._pointerDamped.x = CameraRig.damp(this._pointerDamped.x, this._pointer.x, 2.2, dt);
    this._pointerDamped.y = CameraRig.damp(this._pointerDamped.y, this._pointer.y, 2.2, dt);
    const parallaxScale =
      1.1 * (1 - THREE.MathUtils.smoothstep(t, b.compound, b.horizon) * 0.8);

    this.camera.position.set(
      this._pos.x + breathX + this._pointerDamped.x * parallaxScale,
      this._pos.y + breathY - this._pointerDamped.y * parallaxScale * 0.55,
      this._pos.z,
    );
    this.camera.lookAt(this._look);

    // A whisper of roll through the interior turn keeps the move from feeling
    // mechanical. Never enough to notice directly.
    this.camera.rotation.z += Math.sin(elapsed * 0.21) * 0.006 * breathAmt;

    if (Math.abs(this.camera.fov - this._fov) > 0.001) {
      this.camera.fov = this._fov;
      this.camera.updateProjectionMatrix();
    }
  }

  dispose() {
    window.removeEventListener('pointermove', this._onPointerMove);
  }
}

export const CAMERA_PATH = PATH;
