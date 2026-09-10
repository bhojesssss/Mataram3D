/**
 * Jembatan tipis antara ScrollController — yang imperatif dan hidup di luar
 * React — dengan komponen yang perlu tahu posisi scroll atau ingin menggeser
 * halaman.
 *
 * Dulu ScrollController menyentuh DOM langsung (`nav.classList.toggle`) dan
 * memasang listener klik global untuk anchor. Dua-duanya sekarang lewat sini,
 * jadi React tetap satu-satunya yang menulis ke DOM-nya sendiri.
 */

const listeners = new Set();
let progress = 0;

/** Instance Lenis yang aktif — hanya ada selama homepage terpasang. */
let smooth = null;

export function publishProgress(value) {
  progress = value;
  for (const fn of listeners) fn(value);
}

/** Panggil `fn` tiap frame scroll. Mengembalikan fungsi berhenti berlangganan. */
export function subscribeProgress(fn) {
  listeners.add(fn);
  fn(progress);
  return () => listeners.delete(fn);
}

export function setSmoothScroll(instance) {
  smooth = instance;
}

/**
 * Geser ke elemen yang cocok dengan `hash` (mis. '#culture').
 *
 * Lewat Lenis kalau homepage sedang aktif; scroll native akan berkelahi dengan
 * smoothing-nya. Mengembalikan false kalau geseran tidak jadi dilakukan —
 * targetnya belum ada di DOM, atau `requireSmooth` diminta sementara Lenis
 * belum hidup. Pemanggil boleh mencoba lagi di frame berikutnya.
 */
export function scrollToHash(hash, { offset = -70, requireSmooth = false } = {}) {
  const target = hash && hash !== '#' ? document.querySelector(hash) : null;
  if (!target) return false;

  if (smooth) {
    smooth.scrollTo(target, { offset, duration: 1.5 });
    return true;
  }

  if (requireSmooth) return false;

  target.scrollIntoView({ behavior: 'smooth' });
  return true;
}
