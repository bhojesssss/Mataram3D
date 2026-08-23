/**
 * History — the era rail.
 *
 * All nine eras ship in the HTML; this only swaps which panel is visible. That
 * keeps the page a complete document without JS, and means there is no second
 * copy of the content living in a JS array to drift out of sync.
 */
import { initShell } from './shell.js';

initShell();

function initRail() {
  const rail = document.getElementById('era-rail');
  if (!rail) return;

  const tabs = Array.from(rail.querySelectorAll('.rail__marker'));
  const panels = Array.from(document.querySelectorAll('.era__panel'));
  const progress = document.getElementById('era-progress');
  const prev = document.getElementById('era-prev');
  const next = document.getElementById('era-next');
  const track = rail.querySelector('.rail__track');
  const inner = rail.querySelector('.rail__inner');
  const line = rail.querySelector('.rail__line');
  if (!tabs.length || tabs.length !== panels.length) return;

  const last = tabs.length - 1;
  let index = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  if (index < 0) index = 0;

  /** Centre of a marker's diamond, relative to the top-left of .rail__inner. */
  function dotCentre(tab, origin) {
    const box = tab.querySelector('.rail__dot').getBoundingClientRect();
    return { x: box.left - origin.left + box.width / 2, y: box.top - origin.top + box.height / 2 };
  }

  /**
   * Lays the hairline between the first and last node, and runs the gold fill
   * from the first node out to the active one.
   *
   * Measured, not interpolated. A plain index/count fraction assumes the nodes
   * are evenly spread across the full width, which they are not: the last node
   * sits a whole node-width short of the right edge, so the fill always
   * overshot or fell short of the diamond it was supposed to reach.
   *
   * The vertical position is measured too, so any padding or spacing added to
   * .rail__list moves the line along with the nodes instead of stranding it.
   */
  function drawRail() {
    if (!inner) return;
    const origin = inner.getBoundingClientRect();
    const start = dotCentre(tabs[0], origin);
    const end = dotCentre(tabs[last], origin);

    if (line) {
      line.style.left = `${start.x}px`;
      line.style.top = `${start.y}px`;
      line.style.width = `${end.x - start.x}px`;
    }
    if (progress) {
      progress.style.left = `${start.x}px`;
      progress.style.top = `${start.y}px`;
      progress.style.width = `${dotCentre(tabs[index], origin).x - start.x}px`;
    }
  }

  /**
   * Scrolls the rail only far enough to bring a marker fully into view.
   *
   * Centring on every selection meant the first click yanked the timeline
   * sideways and clipped the earliest years for no reason. This leaves the rail
   * alone whenever the target is already readable.
   */
  function revealTab(tab) {
    if (!track || track.scrollWidth <= track.clientWidth) return;
    const t = track.getBoundingClientRect();
    const b = tab.getBoundingClientRect();
    const margin = 24;

    if (b.left < t.left + margin) {
      track.scrollBy({ left: b.left - t.left - margin, behavior: 'smooth' });
    } else if (b.right > t.right - margin) {
      track.scrollBy({ left: b.right - t.right + margin, behavior: 'smooth' });
    }
  }

  /**
   * @param {number} i      era to show
   * @param {boolean} focus whether to move keyboard focus onto the new marker
   */
  function select(i, focus = false) {
    index = Math.max(0, Math.min(last, i));

    tabs.forEach((tab, n) => {
      const on = n === index;
      tab.setAttribute('aria-selected', String(on));
      // Roving tabindex: only the selected marker is a tab stop, so Tab moves
      // past the whole rail and the arrow keys walk within it.
      tab.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
    });

    drawRail();
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === last;
    revealTab(tabs[index]);

    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, n) => {
    tab.addEventListener('click', () => select(n));
  });

  rail.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) {
      e.preventDefault();
      select(index + step, true);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      select(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      select(last, true);
    }
  });

  prev?.addEventListener('click', () => select(index - 1));
  next?.addEventListener('click', () => select(index + 1));

  select(index);

  // The line's width is in px, so it has to be re-measured whenever the markers
  // move: a late webfont changes their widths, and so does a resize. Scrolling
  // the rail does not — the line scrolls with the nodes inside .rail__inner.
  document.fonts?.ready.then(drawRail);
  window.addEventListener('resize', drawRail);
}

initRail();
