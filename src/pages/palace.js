/**
 * Palace — the compound plan.
 *
 * Two controls select the same thing: the plots on the schematic and the chip
 * list beneath the detail card. Both route through one selector so they can
 * never disagree about which space is open.
 */
import { initShell } from './shell.js';

initShell();

function initPlan() {
  const board = document.getElementById('plan');
  if (!board) return;

  const plots = Array.from(board.querySelectorAll('.plot'));
  const chips = Array.from(document.querySelectorAll('#space-chips .chip'));
  const panels = Array.from(document.querySelectorAll('.space__panel'));
  if (!plots.length || !panels.length) return;

  function select(id) {
    if (!panels.some((p) => p.dataset.space === id)) return;

    plots.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.space === id)));
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.space === id)));
    panels.forEach((p) => {
      p.hidden = p.dataset.space !== id;
    });
  }

  [...plots, ...chips].forEach((btn) => {
    btn.addEventListener('click', () => select(btn.dataset.space));
  });
}

initPlan();
