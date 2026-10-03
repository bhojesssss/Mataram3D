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

/**
 * Geser ke elemen yang cocok dengan `hash` (mis. '#culture'), menyisakan
 * `offset` untuk navbar yang fixed.
 *
 * Scroll native yang dihaluskan browser. Kamera 3D tidak perlu diantar: scene
 * meredam progress yang diterimanya, jadi lompatan jauh tetap jadi sapuan.
 * Mengembalikan false kalau targetnya belum ada di DOM — pemanggil boleh
 * mencoba lagi di frame berikutnya.
 */
export function scrollToHash(hash, { offset = -70 } = {}) {
  const target = hash && hash !== '#' ? document.querySelector(hash) : null;
  if (!target) return false;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY + offset,
    behavior: reduce ? 'auto' : 'smooth',
  });
  return true;
}
