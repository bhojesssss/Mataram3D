import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { beats, resolveBeats } from '../config/tokens.js';
import { publishProgress, setSmoothScroll } from './scrollBus.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Ties page scroll to the 3D scene and to the DOM reveals.
 *
 * There is exactly one source of truth for "where are we": Lenis's smoothed scroll
 * position, normalised to 0→1. The camera, the lighting, the scrim, and the nav all
 * read that same number. Nothing here observes raw wheel events, which is why the
 * 3D and the copy can never disagree about which beat is on screen.
 *
 * Lenis smooths the input; CameraRig damps the response. Two stages of smoothing
 * sounds like one too many, but they solve different problems — Lenis removes the
 * step quantisation of a wheel notch, and the rig's damping gives the camera weight
 * once it is moving. Together they are what "smooth" actually means here.
 */

/**
 * Scrim opacity per beat.
 *
 * A mid-range scrim is the worst of both worlds: it greys the render into mush
 * while still leaving body copy hard to read. So this commits in both directions.
 * The 3D gets two moments where it is the page — the hero and the Palace section —
 * and everywhere else it drops back to a faint ghost behind clean cream editorial,
 * which is what PDF §8 asks for ("homepage sebagai teaser", modern editorial
 * layout). The swing from 0.84 down to 0.10 at `interior` is the reveal, and it is
 * the reason the payoff shot lands at all.
 */
const SCRIM_PATH = [
  { beat: 'hero', v: 0.0 },
  { beat: 'approach', v: 0.3 },
  // Eased back from 0.84 once the dancer became the subject. At that value she
  // was a ghost everywhere except the Palace beat, and a dance the reader only
  // sees one frame of is not a dance. The copy keeps its legibility from the
  // per-element halos (the `halo` utility in index.css) instead of a blanket wash.
  { beat: 'threshold', v: 0.6 },
  { beat: 'interior', v: 0.1 },
  { beat: 'ascend', v: 0.6 },
  { beat: 'compound', v: 0.72 },
  { beat: 'horizon', v: 0.78 },
  { beat: 'end', v: 0.82 },
];

function sampleKeys(keys, t) {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  for (let i = 0; i < n - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) {
      const local = (t - keys[i].t) / (keys[i + 1].t - keys[i].t);
      const eased = local * local * (3 - 2 * local);
      return keys[i].v + (keys[i + 1].v - keys[i].v) * eased;
    }
  }
  return keys[n - 1].v;
}

export class ScrollController {
  constructor(scene) {
    this.scene = scene;
    this.progress = 0;

    this.reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.scrim = document.getElementById('scrim');

    this._measure();
    this._initLenis();
    this._initReveals();
    this._initResize();
  }

  /**
   * Read the real section positions and push the resulting beat table into the
   * scene. Everything timed against scroll — camera, lighting, scrim — is anchored
   * from this one measurement.
   */
  _measure() {
    this.beats = resolveBeats();
    this.scrimKeys = SCRIM_PATH.map((k) => ({
      v: k.v,
      t: this.beats[k.beat] ?? beats[k.beat],
    }));
    this.scene.retime(this.beats);
  }

  /**
   * Section offsets move when the viewport changes, so the beat table has to be
   * rebuilt. Debounced — resize fires in bursts and re-measuring mid-drag is both
   * wasteful and visibly jumpy.
   */
  _initResize() {
    let timer = null;
    this._onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this._measure();
        ScrollTrigger.refresh();
        this._apply();
      }, 180);
    };
    window.addEventListener('resize', this._onResize);
  }

  _initLenis() {
    this.lenis = new Lenis({
      // ~1s to settle. Long enough to feel weighted, short enough not to lag intent.
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Leave touch on the platform's own momentum — hijacking it fights the OS
      // and feels broken. (Lenis calls this `syncTouch`; false is also its default,
      // set explicitly so the intent survives a version bump.)
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });

    // Supaya <HashLink> bisa menggeser halaman lewat smoothing yang sama.
    setSmoothScroll(this.lenis);

    this.lenis.on('scroll', ({ scroll, limit }) => {
      this.progress = limit > 0 ? Math.min(scroll / limit, 1) : 0;
      this._apply();
      ScrollTrigger.update();
    });

    // Drive Lenis from GSAP's ticker so both run on one RAF, in a fixed order.
    this._tick = (time) => this.lenis.raf(time * 1000);
    gsap.ticker.add(this._tick);
    gsap.ticker.lagSmoothing(0);

    this._apply();
  }

  /** Push the current progress into everything that depends on it. */
  _apply() {
    this.scene.setProgress(this.progress);

    if (this.scrim) {
      this.scrim.style.opacity = sampleKeys(this.scrimKeys, this.progress).toFixed(3);
    }

    // The navbar reads this to decide when it goes solid; see scrollBus.js.
    publishProgress(this.progress);
  }

  _initReveals() {
    const items = gsap.utils.toArray('[data-reveal]');

    if (this.reducedMotion) {
      // CSS already leaves these visible under reduced motion; make it explicit so
      // the state cannot depend on stylesheet load order.
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    for (const el of items) {
      const delay = parseFloat(el.dataset.revealDelay || '0');
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.05,
        delay,
        // PDF §8: "Slow & dignified motion" — a long ease-out, never a bounce.
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          // Fires a little before the element is fully in view so the motion has
          // finished by the time the reader's eye arrives.
          start: 'top 88%',
          once: true,
        },
      });
    }
  }

  refresh() {
    this._measure();
    ScrollTrigger.refresh();
    this._apply();
  }

  dispose() {
    setSmoothScroll(null);
    // Nav membaca ini untuk memutuskan kapan jadi padat; tanpa reset, nilai
    // terakhir dari homepage akan terbawa saat pembaca kembali ke sana.
    publishProgress(0);
    window.removeEventListener('resize', this._onResize);
    gsap.ticker.remove(this._tick);
    ScrollTrigger.getAll().forEach((t) => t.kill());
    // Killing the triggers does not wipe the scroll positions ScrollTrigger
    // caches per scroller. In the MPA those died with the page; in an SPA they
    // outlive the route change and the next refresh() restores them, dropping
    // the reader back where they left the homepage instead of at the hero.
    ScrollTrigger.clearScrollMemory();
    this.lenis.destroy();
  }
}
