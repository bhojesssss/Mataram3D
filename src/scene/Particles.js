import * as THREE from 'three';
import { sceneColors } from '../config/tokens.js';
import { glowTexture } from './textures.js';

/**
 * Airborne dust.
 *
 * This is a depth instrument, not decoration. Motes are scattered through the full
 * volume the camera travels, so as it dollies, near ones streak past while far ones
 * barely shift. That differential is one of the strongest depth cues available and
 * it costs one draw call.
 *
 * Drift is done on the GPU from a time uniform — 900 points animated on the CPU
 * would show up in the frame budget for no benefit.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aPhase;
  attribute float aDrift;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Slow, non-repeating wander: three incommensurate frequencies per axis.
    p.x += sin(uTime * 0.13 + aPhase) * aDrift;
    p.y += sin(uTime * 0.09 + aPhase * 1.7) * aDrift * 0.55
         + sin(uTime * 0.21 + aPhase * 0.6) * aDrift * 0.2;
    p.z += cos(uTime * 0.11 + aPhase * 1.3) * aDrift;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // Fade motes that are nearly on top of the lens; a mote filling the frame reads
    // as a bug, not as dust.
    float dist = -mv.z;
    vAlpha = smoothstep(0.6, 5.0, dist) * (1.0 - smoothstep(70.0, 150.0, dist));

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (30.0 / max(dist, 0.6));
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float a = tex.a * vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor * tex.rgb, a);
  }
`;

export class Particles extends THREE.Points {
  constructor(count = 900) {
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const drifts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Concentrated in the pendopo volume, thinning outward along the approach so
      // the hero shot is clean and the interior is thick with it.
      const inInterior = Math.random() < 0.62;
      const spread = inInterior ? 17 : 52;
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread * 2;
      positions[i * 3 + 1] = 0.6 + Math.random() * (inInterior ? 12 : 24);
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 2 + (inInterior ? 0 : 16);

      scales[i] = 0.35 + Math.random() * 1.0;
      phases[i] = Math.random() * Math.PI * 2;
      drifts[i] = 0.4 + Math.random() * 1.9;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 5.5 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMap: { value: glowTexture() },
        uColor: { value: new THREE.Color(sceneColors.goldWarm) },
        uOpacity: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    super(geo, mat);
    this.name = 'dust';
    this.frustumCulled = false;
  }

  /** `interiority` fades the dust in — it only catches light under the roof. */
  update(elapsed, interiority = 0) {
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uOpacity.value = 0.12 + interiority * 0.72;
  }

  /**
   * Point size is computed in device pixels, so it has to track the *renderer's*
   * ratio rather than the display's. Under adaptive resolution those diverge, and
   * reading devicePixelRatio here would make the motes jump in size every time the
   * quality adaptor moved the scale.
   */
  onResize(pixelRatio = Math.min(window.devicePixelRatio, 2)) {
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
