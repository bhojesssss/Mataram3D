import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resolveBeats } from '../config/tokens.js';
import { publishProgress, setSmoothScroll } from './scrollBus.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Ties page scroll to the 3D scene and to the DOM reveals.
 *
 * There is exactly one source of truth for "where are we": Lenis's smoothed scroll
 * position, normalised to 0→1. The camera, the lighting, and the nav all read
 * that same number. Nothing here observes raw wheel events, which is why the
 * 3D and the copy can never disagree about which beat is on screen.
 *
 * Lenis smooths the input; CameraRig damps the response. Two stages of smoothing
 * sounds like one too many, but they solve different problems — Lenis removes the
 * step quantisation of a wheel notch, and the rig's damping gives the camera weight
 * once it is moving. Together they are what "smooth" actually means here.
 */

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * SCRIM SUDAH TIDAK ADA — jangan dihidupkan lagi.
 *
 * Dulu di sini ada SCRIM_PATH: satu lapis krem sepenuh viewport yang
 * opacity-nya digerakkan scroll, dan yang memikul seluruh keterbacaan halaman.
 * Ia tidak pernah bisa benar, karena scrim itu seragam sementara render-nya
 * tidak — langit terang dan massa pendopo gelap ada di layar yang sama. Angka
 * yang cukup untuk teks di atas atap selalu kelewat pekat untuk teks di atas
 * langit. Terukur: pada 0.10, teks forest di atas sirap cuma 1.02:1 (hilang
 * total) sementara di atas langit sudah 7.93:1 dan tidak butuh apa-apa. Pada
 * 0.84 teksnya aman tapi pendoponya jadi hantu sepanjang halaman.
 *
 * Penggantinya <Band> (components/ui/Band.jsx): pelat paper yang menutupi
 * render hanya di sepanjang rentang baca, dan berhenti tepat di Palace. Karena
 * ia dipotong menurut narasi dan bukan digerakkan scroll, tidak ada lagi yang
 * perlu disamplingkan per frame di sini — dan halaman ini kehilangan satu
 * elemen fixed sepenuh layar beserta seluruh pekerjaan compositing-nya.
 *
 * Kalau nanti butuh menggelapkan atau meredupkan render pada beat tertentu,
 * tempatnya LIGHT_PATH di Scene.js (itu mengubah cahaya scene-nya sendiri),
 * bukan lapisan cat baru di atas canvas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class ScrollController {
  constructor(scene) {
    this.scene = scene;
    this.progress = 0;

    this.reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this._measure();
    this._initLenis();
    this._initReveals();
    this._initResize();
  }

  /**
   * Read the real section positions and push the resulting beat table into the
   * scene. Everything timed against scroll — camera and lighting — is anchored
   * from this one measurement.
   */
  _measure() {
    this.beats = resolveBeats();
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
