import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

/**
 * Shafts of sunlight under the roof, ray-marched against the sun's own shadow map.
 *
 * The interior beat already had the light — bright stripes across the deck
 * between the pillar shadows — but nothing in the air between the openings and
 * the floor, so it read as a pattern painted on the tiles. Real light under a
 * joglo roof is seen *in the air*: dust catching the low sun through the gaps
 * in the colonnade and between the roof tiers.
 *
 * Billboards placed by hand can't line up with those stripes, and a misaligned
 * shaft is worse than none. So this marches each view ray through the pendopo's
 * volume and asks the sun's shadow map, at every step, whether that point of air
 * is lit. The shafts therefore come out exactly where the geometry lets light
 * through, and nowhere else.
 *
 * Cheap enough to afford because of where it runs:
 *  - half resolution, into its own target, then blurred and added back;
 *  - only inside the pendopo's bounding box — the ray is clipped to it, and to
 *    the scene depth (borrowed from GTAO's depth pass, so no extra render);
 *  - only while the camera is under the roof — the pass disables itself at zero
 *    intensity, so the outdoor beats pay nothing;
 *  - the shadow map is static (rendered once, see Scene), so the march samples
 *    a texture that never changes.
 */

/**
 * Air volume the shafts can occupy: inside the outer colonnade (±14.5), from the
 * deck to the ceiling. Not the whole deck — the strip outside the columns is open
 * air in full sun, and marching it turned everything seen past the columns into
 * an even white haze instead of shafts.
 */
const BOX_MIN = new THREE.Vector3(-14.5, 1.2, -14.5);
const BOX_MAX = new THREE.Vector3(14.5, 11.0, 14.5);

/** March steps per ray. Jittered per pixel, and the blur below hides the jitter. */
const STEPS = 28;

const MARCH_FRAG = /* glsl */ `
  #include <packing>

  uniform sampler2D tDepth;
  uniform sampler2D tShadow;
  uniform mat4 shadowMatrix;
  uniform mat4 projInverse;
  uniform mat4 cameraWorld;
  uniform vec3 cameraPos;
  uniform vec3 boxMin;
  uniform vec3 boxMax;
  uniform vec3 sunDir;      // toward the sun
  uniform float density;
  varying vec2 vUv;

  // Interleaved gradient noise — decorrelates the start offset between
  // neighbouring pixels, so banding turns into fine grain the blur removes.
  float ign(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }

  float lit(vec3 p) {
    vec4 sc = shadowMatrix * vec4(p, 1.0);
    sc.xyz /= sc.w;
    if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0) return 1.0;
    float occluder = unpackRGBAToDepth(texture2D(tShadow, sc.xy));
    return step(sc.z - 0.0015, occluder);
  }

  void main() {
    float depth = texture2D(tDepth, vUv).x;
    vec4 view = projInverse * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    view /= view.w;
    vec3 world = (cameraWorld * view).xyz;

    vec3 ray = world - cameraPos;
    float sceneT = length(ray);
    vec3 dir = ray / sceneT;

    // Slab test against the air volume.
    vec3 inv = 1.0 / dir;
    vec3 t0 = (boxMin - cameraPos) * inv;
    vec3 t1 = (boxMax - cameraPos) * inv;
    vec3 tNear = min(t0, t1);
    vec3 tFar = max(t0, t1);
    float a = max(max(max(tNear.x, tNear.y), tNear.z), 0.0);
    float b = min(min(min(tFar.x, tFar.y), tFar.z), sceneT);

    if (b <= a) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float stepLen = (b - a) / float(${STEPS});
    float t = a + stepLen * ign(gl_FragCoord.xy);
    float sum = 0.0;
    for (int i = 0; i < ${STEPS}; i++) {
      vec3 p = cameraPos + dir * t;
      // Thicker near the floor, where the dust settles and the shafts land.
      float h = 1.0 - smoothstep(1.2, 11.0, p.y) * 0.65;
      // Thin out the air right at the lens. The Palace shot holds the dancer
      // ~4m away, and a shaft crossing that gap veiled her face in light.
      float near = smoothstep(1.0, 7.0, t);
      sum += lit(p) * h * near;
      t += stepLen;
    }

    // Mostly forward scattering (Henyey–Greenstein, g = 0.45) with an isotropic
    // floor, so the shafts are brighter looking toward the sun but never vanish
    // looking away from it.
    float mu = dot(dir, sunDir);
    float g = 0.45;
    float hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5);
    float phase = 0.35 + 0.65 * hg;

    gl_FragColor = vec4(vec3(sum * stepLen * density * phase), 1.0);
  }
`;

const COMPOSITE_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tBeams;
  uniform vec2 texel;       // of tBeams
  uniform vec3 color;
  varying vec2 vUv;

  void main() {
    // 9-tap tent over the half-res march: removes the jitter grain and the
    // stair-step of the upsample in one go.
    vec3 s = texture2D(tBeams, vUv).rgb * 4.0;
    s += texture2D(tBeams, vUv + vec2( texel.x, 0.0)).rgb * 2.0;
    s += texture2D(tBeams, vUv + vec2(-texel.x, 0.0)).rgb * 2.0;
    s += texture2D(tBeams, vUv + vec2(0.0,  texel.y)).rgb * 2.0;
    s += texture2D(tBeams, vUv + vec2(0.0, -texel.y)).rgb * 2.0;
    s += texture2D(tBeams, vUv + texel).rgb;
    s += texture2D(tBeams, vUv - texel).rgb;
    s += texture2D(tBeams, vUv + vec2(texel.x, -texel.y)).rgb;
    s += texture2D(tBeams, vUv + vec2(-texel.x, texel.y)).rgb;
    s /= 16.0;

    vec4 base = texture2D(tDiffuse, vUv);
    gl_FragColor = vec4(base.rgb + s * color, base.a);
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export class SunbeamsPass extends Pass {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.DirectionalLight} sun   must cast shadows
   * @param {THREE.DepthTexture} depthTexture  scene depth, any resolution
   * @param {THREE.Vector3} sunDir  unit vector toward the sun
   */
  constructor(camera, sun, depthTexture, sunDir) {
    super();
    this.camera = camera;
    this.sun = sun;
    this.needsSwap = true;
    this.enabled = false;
    this.intensity = 0;

    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });

    this.marchMaterial = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: MARCH_FRAG,
      uniforms: {
        tDepth: { value: depthTexture },
        tShadow: { value: null },
        shadowMatrix: { value: sun.shadow.matrix },
        projInverse: { value: camera.projectionMatrixInverse },
        cameraWorld: { value: camera.matrixWorld },
        cameraPos: { value: new THREE.Vector3() },
        boxMin: { value: BOX_MIN },
        boxMax: { value: BOX_MAX },
        sunDir: { value: sunDir.clone().normalize() },
        density: { value: 0.085 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tDiffuse: { value: null },
        tBeams: { value: this.target.texture },
        texel: { value: new THREE.Vector2() },
        color: { value: new THREE.Color() },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.fsQuad = new FullScreenQuad(this.marchMaterial);
  }

  /**
   * @param {number} intensity  0 disables the pass entirely
   * @param {THREE.Color} sunColor  current sun colour (linear)
   */
  update(intensity, sunColor) {
    this.intensity = intensity;
    this.enabled = intensity > 0.002;
    this.compositeMaterial.uniforms.color.value.copy(sunColor).multiplyScalar(intensity);
  }

  setSize(width, height) {
    const w = Math.max(1, Math.round(width / 2));
    const h = Math.max(1, Math.round(height / 2));
    this.target.setSize(w, h);
    this.compositeMaterial.uniforms.texel.value.set(1 / w, 1 / h);
  }

  render(renderer, writeBuffer, readBuffer) {
    const shadowMap = this.sun.shadow.map;
    if (!shadowMap) {
      // Before the first shadow render there is nothing to march against.
      this._copy(renderer, writeBuffer, readBuffer, 0);
      return;
    }

    const u = this.marchMaterial.uniforms;
    u.tShadow.value = shadowMap.texture;
    u.cameraPos.value.setFromMatrixPosition(this.camera.matrixWorld);

    renderer.setRenderTarget(this.target);
    this.fsQuad.material = this.marchMaterial;
    this.fsQuad.render(renderer);

    this._copy(renderer, writeBuffer, readBuffer);
  }

  _copy(renderer, writeBuffer, readBuffer, strength) {
    const c = this.compositeMaterial.uniforms;
    c.tDiffuse.value = readBuffer.texture;
    if (strength === 0) c.color.value.setScalar(0);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.fsQuad.material = this.compositeMaterial;
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.target.dispose();
    this.marchMaterial.dispose();
    this.compositeMaterial.dispose();
    this.fsQuad.dispose();
  }
}
