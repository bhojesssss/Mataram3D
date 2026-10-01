import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { palette, sceneColors, beats } from '../config/tokens.js';
import { detectTier, pixelRatioFor, ResolutionAdaptor } from '../config/quality.js';
import { Pendopo } from './Pendopo.js';
import { Dancer } from './Dancer.js';
import { Environment } from './Environment.js';
import { Particles } from './Particles.js';
import { CameraRig } from './CameraRig.js';
import { disposeTextures } from './textures.js';

/**
 * Owns the renderer, the lighting, and the frame loop; assembles the other scene
 * modules and drives them from one scroll value.
 *
 * The lighting is on a schedule of its own. Scroll doesn't just move the camera —
 * it moves the sun. The page opens in flat morning haze, warms as the camera crosses
 * the threshold, drops to near-dusk under the roof where the lanterns take over, and
 * comes back out into low gold for the compound and horizon beats. That arc is what
 * makes the descent inside feel like somewhere else rather than the same room from
 * a different angle.
 */

/**
 * Where the sun is, as a single source of truth.
 *
 * The sky shader draws a bloom around its own `uSunDir` while the DirectionalLight
 * casts shadows from its own position, and in the first pass those two disagreed —
 * the glare sat toward -Z while the shadows fell as though the sun were off to the
 * side and much higher. Nobody consciously notices the mismatch; everybody reads
 * the result as fake. Both now derive from this vector.
 *
 * Angled low (~24° elevation) on purpose: a high sun flattens everything into
 * top-down ambient, while a raking one crosses the shingle courses and throws the
 * long shadows that make the compound legible.
 *
 * Placed to the SIDE rather than behind. The camera flies down the +Z axis, so a
 * sun near -Z backlights the pendopo and the entire face the viewer sees falls
 * into flat shadow — technically correct, and it looked like an unlit model. From
 * the left the building gets a lit flank and a shadowed one, shadows rake across
 * the courtyard toward the camera, and the sky's glare still sits in frame.
 */
export const SUN_DIR = new THREE.Vector3(-0.82, 0.4, -0.41).normalize();
const SUN_DISTANCE = 120;

/**
 * Hemisphere light is scaled down hard now that `scene.environment` exists.
 *
 * The IBL probe and the hemisphere light do the same job — fill from the sky — so
 * running both at their original strengths double-counts the ambient and flattens
 * everything to an even wash. The per-beat `ambI` curve is still what shapes the
 * lighting arc across the scroll; this only rescales it.
 */
const AMBIENT_SCALE = 0.26;

/**
 * Sun/ambient state at each beat, interpolated per frame. Timings come from the
 * resolved beat table via `retime`, same as the camera path.
 */
const LIGHT_PATH = [
  // fogD was cut roughly a third across the outdoor beats once the lighting was
  // rebalanced: with less ambient wash there is no longer haze to hide, and the
  // heavier values were flattening the courtyard into a single bright field.
  { beat: 'hero',      sun: '#FFF3D6', sunI: 2.5, amb: '#DDE4DA', ambI: 0.95, fog: '#EFE7D2', fogD: 0.0021, sky: 0.55 },
  { beat: 'approach',  sun: '#FFEBC4', sunI: 2.7, amb: '#D9E0D4', ambI: 0.88, fog: '#EBE1CA', fogD: 0.0025, sky: 0.62 },
  { beat: 'threshold', sun: '#FBD79A', sunI: 2.3, amb: '#C6CFC2', ambI: 0.70, fog: '#DCD2BC', fogD: 0.0042, sky: 0.7 },
  // Under the roof. Dimmer and warmer than open daylight, but not the near-black
  // the first pass produced — the tumpang sari is the payoff of the whole scroll
  // and it has to be legible as architecture, not just a dark mass overhead.
  { beat: 'interior',  sun: '#E8BE7C', sunI: 1.9, amb: '#A8AF9E', ambI: 0.78, fog: '#C6C0A6', fogD: 0.0065, sky: 0.5 },
  { beat: 'ascend',    sun: '#F2CD8C', sunI: 1.8, amb: '#AAB3A4', ambI: 0.62, fog: '#CFC7AE', fogD: 0.0054, sky: 0.66 },
  { beat: 'compound',  sun: '#FFD79B', sunI: 2.9, amb: '#D4DBCF', ambI: 0.90, fog: '#E6DCC4', fogD: 0.0027, sky: 0.78 },
  { beat: 'horizon',   sun: '#FFC98A', sunI: 3.1, amb: '#DCE2D6', ambI: 0.98, fog: '#EDE3CD', fogD: 0.0018, sky: 0.92 },
  { beat: 'end',       sun: '#FFC178', sunI: 3.2, amb: '#E2E7DC', ambI: 1.02, fog: '#F1E8D4', fogD: 0.0014, sky: 1.0 },
];

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.progress = 0;
    this._running = false;
    this._frame = null;
    this._shadowTick = 0;

    this._initRenderer();
    // Before _initPost: the composer copies the renderer's pixel ratio when it
    // builds its targets, so the ratio has to be final by then.
    this._applyResolution();
    this._initScene();
    this._initLights();
    this._initContent();
    // Both depend on content existing: the probe is prefiltered from the sky mesh,
    // and the composer's RenderPass needs the populated scene.
    this._initEnvironmentMap();
    this._initPost();

    this.rig = new CameraRig(this.camera);
    this.retime(beats);

    // Scratch colours, reused every frame so the loop allocates nothing.
    this._cSun = new THREE.Color();
    this._cAmb = new THREE.Color();
    this._cFog = new THREE.Color();
    this._cA = new THREE.Color();
    this._cB = new THREE.Color();

    this._onResize = this._onResize.bind(this);
    this._onVisibility = this._onVisibility.bind(this);
    window.addEventListener('resize', this._onResize);
    document.addEventListener('visibilitychange', this._onVisibility);

    this._onResize();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      // The composer resolves its own MSAA, so the default framebuffer doesn't
      // need it as well — that would be paying for antialiasing twice.
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });

    // Everything below is sized from this. Detected once, then the adaptor trims
    // resolution from here based on what the machine actually manages.
    this.tier = detectTier(this.renderer);
    this.renderScale = 1;
    this.adaptor = new ResolutionAdaptor({
      onChange: (scale, median) => {
        this.renderScale = scale;
        this._applyResolution();
        console.info(
          `[mataram] render scale → ${scale.toFixed(2)} (median ${median.toFixed(1)}ms, tier ${this.tier.name})`,
        );
      },
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Filmic roll-off keeps the gilt highlights from clipping to flat white.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Slightly under 1: the IBL probe raised overall scene brightness, and pulling
    // exposure back restores the filmic shoulder instead of letting the cream
    // courtyard and pale sky clip together into one flat field.
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Shadows are refreshed on a cadence rather than every frame. The sun never
    // moves and the architecture never moves, so re-rendering the whole map from
    // ~200 casters at 60Hz was costing more than the entire rest of the frame.
    // The dancer *does* move, which is why this is throttled in _tick rather than
    // baked exactly once. `needsUpdate` self-clears after each pass.
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(new THREE.Color(sceneColors.skyLow), 0.0032);

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    // Matches CAMERA_KEYS[0] so the very first frame is already the hero pose.
    this.camera.position.set(0, 7.0, 66);
  }

  _initLights() {
    // Sky/ground bounce — does most of the ambient work and keeps shadow interiors
    // from going dead grey.
    this.hemi = new THREE.HemisphereLight(
      new THREE.Color(palette.paper),
      new THREE.Color(palette.forest),
      0.95,
    );
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(new THREE.Color('#FFF3D6'), 2.5);
    // Derived from SUN_DIR so the shadows and the sky's glare agree.
    this.sun.position.copy(SUN_DIR).multiplyScalar(SUN_DISTANCE);
    this.sun.castShadow = true;
    // Per tier. 2048 over the 116-unit frustum is still ~18 texels/unit, which
    // holds a clean edge on anything the size of a column; 4096 only pays off for
    // the rafter tails, and only on a GPU that can spare it.
    const sm = this.tier.shadowMap;
    this.sun.shadow.mapSize.set(sm, sm);
    // Tight near/far around the actual occluders. A loose range wastes depth
    // precision and is the usual cause of shadow acne that bias then has to hide.
    this.sun.shadow.camera.near = SUN_DISTANCE - 90;
    this.sun.shadow.camera.far = SUN_DISTANCE + 90;
    // Wide enough to take in the compound wall at r=52, so the enclosure casts
    // inward at low sun.
    const ext = 58;
    this.sun.shadow.camera.left = -ext;
    this.sun.shadow.camera.right = ext;
    this.sun.shadow.camera.top = ext;
    this.sun.shadow.camera.bottom = -ext;
    // normalBias does the heavy lifting on curved/instanced geometry; constant
    // bias stays small so contact shadows don't detach from their objects.
    this.sun.shadow.bias = -0.00015;
    this.sun.shadow.normalBias = 0.045;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Cool counter-fill from the opposite side so the shadowed faces of the roof
    // keep some form instead of crushing. Placed opposite the sun in plan.
    this.fill = new THREE.DirectionalLight(new THREE.Color(palette.sage), 0.38);
    this.fill.position.set(-SUN_DIR.x * 90, 30, -SUN_DIR.z * 90);
    this.scene.add(this.fill);
  }

  /**
   * Image-based lighting from the sky itself.
   *
   * Without an environment map every PBR material has nothing to reflect, so metal
   * renders as flat coloured plastic and even rough surfaces lose the faint sky
   * gradient across them that says "outdoors". This is the cheapest large step
   * toward realism available — one prefilter at startup, then free every frame.
   *
   * Prefiltered from a copy of the real sky shader rather than a generic studio
   * probe, so the gilt picks up this scene's cream horizon and green-cast zenith
   * instead of some neutral grey room.
   */
  _initEnvironmentMap() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    const skyMat = this.environment.sky.material.clone();
    // Mid-warmth: the sky's own sun strength animates across the scroll, but
    // re-prefiltering per frame would be far too expensive for the payoff.
    skyMat.uniforms.uSunStrength.value = 0.7;
    skyMat.fog = false;
    const probe = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 20), skyMat);
    envScene.add(probe);

    const target = pmrem.fromScene(envScene, 0, 1, 200);
    this.scene.environment = target.texture;
    // Held deliberately low. IBL fills shadow the same way ambient does, and at
    // 0.55 it lit the shadowed side of every surface almost as brightly as the lit
    // side — the shadows were being cast correctly and then erased. Realism here
    // is a contrast ratio, not a light count.
    this.scene.environmentIntensity = 0.3;
    this._envTarget = target;

    probe.geometry.dispose();
    skyMat.dispose();
    pmrem.dispose();
  }

  /**
   * Post chain: linear render → ambient occlusion → tone map to screen.
   *
   * GTAO is the other half of "realistic". Direct light plus a hemisphere fill
   * leaves every crevice as bright as the surface around it, so the eye gets no
   * contact cues and the model reads as assembled from floating parts. Darkening
   * where surfaces meet — under the eaves, between the tumpang sari tiers, where
   * a column meets its umpak — is what visually welds them together.
   *
   * Tone mapping moves to OutputPass: three.js skips it when rendering into a
   * render target, so applying it at the end of the chain avoids grading the image
   * twice.
   *
   * Wrapped in a try/catch — post-processing is an enhancement, and a driver that
   * can't give us the depth/normal targets should cost the effect, not the page.
   */
  _initPost() {
    // On the low tier there is no chain at all: GTAO is three extra full-screen
    // passes and MSAA on a half-float target is pure bandwidth, which is precisely
    // what an integrated GPU has least of. Rendering straight to the canvas with
    // the driver's own antialiasing is both faster and, at that resolution,
    // barely distinguishable.
    if (!this.tier.gtao) {
      this.composer = null;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      return;
    }

    try {
      const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      const target = new THREE.WebGLRenderTarget(size.x, size.y, {
        type: THREE.HalfFloatType,
        samples: this.tier.msaa, // MSAA, which the composer would otherwise lose
      });

      this.composer = new EffectComposer(this.renderer, target);
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const gtao = new GTAOPass(this.scene, this.camera, size.x, size.y);
      gtao.output = GTAOPass.OUTPUT.Default;
      gtao.updateGtaoMaterial({
        // ~1.4m of gather radius: catches column-to-floor and beam-to-roof
        // contacts without smearing a grey haze over open ground.
        radius: 1.4,
        distanceExponent: 1.6,
        thickness: 1.0,
        scale: 0.85,
        samples: this.tier.gtaoSamples,
        screenSpaceRadius: false,
      });
      this.composer.addPass(gtao);
      this.gtao = gtao;

      this.composer.addPass(new OutputPass());
    } catch (err) {
      console.warn('[mataram] post-processing unavailable, rendering direct:', err);
      this.composer = null;
    }
  }

  /**
   * Resize the drawing buffer to the current tier and adaptive scale.
   *
   * The canvas's CSS size never changes — only how many pixels are rendered into
   * it. Because the budget is applied to *area*, a 0.7 scale halves the shaded
   * pixel count, and on a fill-rate-bound machine that is close to halving the
   * frame time.
   */
  _applyResolution() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = pixelRatioFor(this.tier, w, h, this.renderScale);

    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);

    if (this.composer) {
      this.composer.setPixelRatio(ratio);
      this.composer.setSize(w, h);
      const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      this.gtao?.setSize(size.x, size.y);
    }

    this.particles?.onResize(ratio);
  }

  _initContent() {
    this.environment = new Environment(this.tier);
    this.scene.add(this.environment);
    // Single source of truth: the sky's glare must sit where the shadows say it is.
    this.environment.skyUniforms.uSunDir.value.copy(SUN_DIR);

    this.pendopo = new Pendopo();
    this.scene.add(this.pendopo);

    // Centre of the deck — the spot a pendopo exists to frame.
    this.dancer = new Dancer();
    this.dancer.position.set(0, 1.2, 0);
    this.scene.add(this.dancer);
    window.__scene = this; // TEMP: screenshot hook, remove

    this.particles = new Particles(900);
    this.scene.add(this.particles);
  }

  /**
   * Re-anchor both the lighting schedule and the camera path to a measured beat
   * table. Called by ScrollController once the DOM has been laid out, and again on
   * resize when section positions move.
   */
  retime(beatTable) {
    this.lightKeys = LIGHT_PATH.map((k) => ({
      ...k,
      t: beatTable[k.beat] ?? beats[k.beat],
    }));
    this.rig.retime(beatTable);
  }

  /** Piecewise-linear-with-smoothstep sample of the lighting schedule at scroll t. */
  _sampleLight(t) {
    const keys = this.lightKeys;
    const n = keys.length;
    let a = keys[0];
    let b = keys[0];
    let local = 0;

    if (t >= keys[n - 1].t) {
      a = b = keys[n - 1];
    } else if (t > keys[0].t) {
      for (let i = 0; i < n - 1; i++) {
        if (t >= keys[i].t && t <= keys[i + 1].t) {
          a = keys[i];
          b = keys[i + 1];
          local = (t - a.t) / (b.t - a.t);
          break;
        }
      }
    }

    const e = local * local * (3 - 2 * local);
    this._cSun.copy(this._cA.set(a.sun)).lerp(this._cB.set(b.sun), e);
    this._cAmb.copy(this._cA.set(a.amb)).lerp(this._cB.set(b.amb), e);
    this._cFog.copy(this._cA.set(a.fog)).lerp(this._cB.set(b.fog), e);

    return {
      sunI: a.sunI + (b.sunI - a.sunI) * e,
      ambI: a.ambI + (b.ambI - a.ambI) * e,
      fogD: a.fogD + (b.fogD - a.fogD) * e,
      sky: a.sky + (b.sky - a.sky) * e,
    };
  }

  setProgress(t) {
    this.progress = THREE.MathUtils.clamp(t, 0, 1);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.clock.start();
    const loop = () => {
      this._frame = requestAnimationFrame(loop);
      this._tick();
    };
    this._frame = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = null;
  }

  _tick() {
    // Clamp dt so a backgrounded tab doesn't return and fling the damped camera.
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 1 / 20);
    const elapsed = this.clock.elapsedTime;

    // Unclamped delta — the adaptor needs the true cost of the frame, including
    // the slow ones, or it would never see the problem it exists to fix.
    this.adaptor.sample(raw);

    // No shadow-map refresh here, deliberately.
    //
    // The dancer moves, so at first this refreshed the map on a cadence to keep
    // her shadow attached. Measured, that cost more than everything else in the
    // frame put together — a 2048² pass over ~200 casters is not something to run
    // on any cadence for one moving object. She is excluded from the sun's map
    // entirely and carries her own contact shadow instead (see Dancer), which is
    // what the shot actually needs: grounding, not a cast silhouette.

    this.rig.progress = this.progress;
    this.rig.update(dt, elapsed);

    const L = this._sampleLight(this.progress);
    this.sun.color.copy(this._cSun);
    this.sun.intensity = L.sunI;
    this.hemi.color.copy(this._cAmb);
    this.hemi.intensity = L.ambI * AMBIENT_SCALE;
    this.scene.fog.color.copy(this._cFog);
    this.scene.fog.density = L.fogD;
    this.environment.skyUniforms.uSunStrength.value = L.sky;

    this.pendopo.update(elapsed, this.rig.interiority);
    // Two phrases across the page — enough that the dance reads as continuous,
    // few enough that no movement is over before the reader has seen it.
    //
    // The +0.25 offset is deliberate: it lands pose 2, the raised-selendang pose
    // from the reference photograph, exactly on the Palace beat where the camera
    // holds her in a near-full-body shot. The signature pose should happen in the
    // one frame built to show it, not somewhere in between.
    this.dancer.update(this.progress * 2 + 0.25, elapsed);
    this.particles.update(elapsed, this.rig.interiority);
    this.environment.update(elapsed);

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this._applyResolution();
  }

  _onVisibility() {
    // Pause offscreen: no point burning a GPU on a hidden tab.
    if (document.hidden) this.stop();
    else this.start();
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.rig.dispose();
    this.pendopo.dispose();
    this.dancer.dispose();
    this.environment.dispose();
    this.particles.dispose();
    disposeTextures();
    this._envTarget?.dispose();
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
