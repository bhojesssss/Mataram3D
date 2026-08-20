/**
 * Shared chrome for every page: mobile menu, image fallbacks, scroll reveals.
 *
 * Runs on the inner pages *and* on the homepage — the homepage previously had a
 * hamburger with nothing behind it, which left phones with no navigation at all
 * once .nav__links drops out at 760px.
 *
 * Everything here is progressive enhancement. If this module never executes the
 * pages stay fully readable: the reveal styles are gated behind .has-js, and the
 * menu overlay is inert markup until it is opened.
 */

/** Full-screen navigation overlay: open/close, focus handling, scroll lock. */
function initMenu() {
  const menu = document.getElementById('menu');
  const openBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  if (!menu || !openBtn) return;

  // Remembered so focus can return to the hamburger when the overlay closes.
  let lastFocused = null;

  const open = () => {
    lastFocused = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('is-menu-open');
    openBtn.setAttribute('aria-expanded', 'true');
    closeBtn?.focus();
  };

  const close = () => {
    menu.hidden = true;
    document.body.classList.remove('is-menu-open');
    openBtn.setAttribute('aria-expanded', 'false');
    lastFocused instanceof HTMLElement ? lastFocused.focus() : openBtn.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  // Clicking the veil itself — not a link inside it — dismisses the overlay.
  menu.addEventListener('click', (e) => {
    if (e.target === menu) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) close();
  });

  // Leaving a breakpoint with the overlay still open would strand the scroll
  // lock on a desktop layout that has no way to dismiss it.
  const wide = window.matchMedia('(min-width: 761px)');
  wide.addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) close();
  });
}

/**
 * Reveals a frame's photograph once it has actually loaded.
 *
 * Photography for these pages is dropped into public/img/ separately, so every
 * frame ships marked empty and shows its labelled placeholder plate. Clearing
 * the flag on load — rather than setting it on error — means a missing file is
 * the quiet default and no frame ever flashes a broken-image icon on the way to
 * the fallback.
 */
function initFrames() {
  document.querySelectorAll('.frame').forEach((frame) => {
    const img = frame.querySelector('img');
    if (!img || !img.getAttribute('src')) return;

    const show = () => frame.removeAttribute('data-empty');

    // complete && naturalWidth > 0 catches images already decoded before this
    // module ran; the listener catches the ones still in flight.
    if (img.complete && img.naturalWidth > 0) show();
    img.addEventListener('load', show, { once: true });
  });

  // The Royal House header art is pure decoration behind a gradient — if the
  // file is missing, drop it and let the header read as a flat panel.
  document.querySelectorAll('.phead__art img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) img.remove();
    img.addEventListener('error', () => img.remove(), { once: true });
  });
}

/** Fades sections in as they enter the viewport. */
function initReveals() {
  const targets = document.querySelectorAll('[data-rise]');
  if (!targets.length) return;

  // Without IntersectionObserver, show everything rather than nothing.
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );

  targets.forEach((el) => io.observe(el));
}

export function initShell() {
  document.documentElement.classList.add('has-js');
  initMenu();
  initFrames();
  initReveals();
}
