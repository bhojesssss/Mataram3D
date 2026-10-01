import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resolveBeats } from '../config/tokens.js';
import { publishProgress } from './scrollBus.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Ties page scroll to the 3D scene and to the DOM reveals.
 *
 * There is exactly one source of truth for "where are we": the page's native
 * scroll position, normalised to 0→1. The camera, the lighting, and the nav all
 * read that same number, so the 3D and the copy can never disagree about which
 * beat is on screen.
 *
 * Scroll itself is the browser's own. This used to run through Lenis, and on
 * phones that was the cause of the homepage scroll freezing just below the hero:
 * Lenis listens to touchstart/touchmove with { passive: false } even when it
 * leaves touch alone (syncTouch: false), so every gesture had to wait for the
 * main thread — and a few seconds after load the main thread is busy taking in
 * the dancer model. On the desktop the same dependency meant any main-thread
 * stall stopped the wheel scroll dead. Native scroll keeps moving regardless.
 *
 * The smoothing Lenis gave the 3D now lives in the scene instead: Scene damps the
 * progress it is handed (removing the step of a wheel notch), and CameraRig damps
 * the camera on top of that (giving it weight once moving). Both stages are kept
 * for the reason they always existed; only the page scroll stopped depending on
 * JavaScript.
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
    this._initScroll();
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
   *
   * On touch devices a resize that leaves the width alone is the browser toolbar
   * collapsing or returning as the reader scrolls. That is not a layout change
   * worth re-measuring every section for in the middle of a gesture (ScrollTrigger
   * ignores it for the same reason); only the progress is re-read.
   */
  _initResize() {
    let timer = null;
    let width = window.innerWidth;
    const touch = ScrollTrigger.isTouch === 1;

    this._onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (touch && window.innerWidth === width) {
          this._onScroll();
          return;
        }
        width = window.innerWidth;
        this._measure();
        ScrollTrigger.refresh();
        this._onScroll();
      }, 180);
    };
    window.addEventListener('resize', this._onResize);
  }

  /**
   * Passive, so the browser never waits on this handler before scrolling. The
   * limit is read fresh each time rather than cached: images and late fonts
   * change the page height without a resize, and a stale limit would make the
   * camera finish its path before the page does.
   */
  _initScroll() {
    this._onScroll = () => {
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      this.progress = limit > 0 ? Math.min(Math.max(window.scrollY / limit, 0), 1) : 0;
      this._apply();
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this._onScroll();
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
    this._onScroll();
  }

  dispose() {
    // Nav membaca ini untuk memutuskan kapan jadi padat; tanpa reset, nilai
    // terakhir dari homepage akan terbawa saat pembaca kembali ke sana.
    publishProgress(0);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onScroll);
    ScrollTrigger.getAll().forEach((t) => t.kill());
    // Killing the triggers does not wipe the scroll positions ScrollTrigger
    // caches per scroller. In the MPA those died with the page; in an SPA they
    // outlive the route change and the next refresh() restores them, dropping
    // the reader back where they left the homepage instead of at the hero.
    ScrollTrigger.clearScrollMemory();
  }
}
