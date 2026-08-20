/**
 * Royal Archive — search and category filter.
 *
 * Every record is in the HTML; filtering hides rows rather than rebuilding the
 * grid, so the page is a full, crawlable list of the collection before any
 * script runs.
 */
import { initShell } from './shell.js';

initShell();

function initArchive() {
  const grid = document.getElementById('arch-grid');
  const input = document.getElementById('arch-search');
  if (!grid || !input) return;

  const records = Array.from(grid.querySelectorAll('.record'));
  const chips = Array.from(document.querySelectorAll('#arch-cats .chip'));
  const countEl = document.getElementById('arch-count');
  const emptyEl = document.getElementById('arch-empty');
  const resetBtns = Array.from(document.querySelectorAll('[data-arch-reset]'));

  // Built once — reading textContent per keystroke across every card is work
  // the browser does not need to repeat.
  const haystacks = new Map(
    records.map((r) => [r, `${r.dataset.cat} ${r.dataset.era} ${r.textContent}`.toLowerCase()]),
  );

  let cat = 'All';

  function apply() {
    const q = input.value.trim().toLowerCase();
    let shown = 0;

    records.forEach((r) => {
      const okCat = cat === 'All' || r.dataset.cat === cat;
      const okQ = !q || haystacks.get(r).includes(q);
      const on = okCat && okQ;
      r.hidden = !on;
      if (on) shown += 1;
    });

    if (countEl) countEl.textContent = `${shown} ${shown === 1 ? 'record' : 'records'}`;
    if (emptyEl) emptyEl.hidden = shown > 0;
    grid.hidden = shown === 0;
  }

  input.addEventListener('input', apply);

  // Filtering is live, so submitting would only reload the page and lose it.
  document.getElementById('arch-form')?.addEventListener('submit', (e) => e.preventDefault());

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      cat = chip.dataset.cat || 'All';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      apply();
    });
  });

  resetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = '';
      cat = 'All';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === 'All')));
      apply();
      input.focus();
    });
  });

  apply();
}

initArchive();
