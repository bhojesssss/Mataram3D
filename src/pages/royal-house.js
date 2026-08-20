/**
 * Royal House — the member sheet.
 *
 * Each node in the genealogy already carries its own profile in data
 * attributes, so opening a member is a read off the button that was clicked;
 * there is no parallel dataset to keep aligned with the markup.
 */
import { initShell } from './shell.js';

initShell();

function initMemberSheet() {
  const sheet = document.getElementById('member-sheet');
  const nodes = document.querySelectorAll('.node');
  if (!sheet || !nodes.length) return;

  // Without showModal the buttons would open nothing, so unhide the profile
  // line each node already carries and let the tree read as static cards.
  if (typeof sheet.showModal !== 'function') {
    nodes.forEach((node) => {
      node.querySelector('.node__role')?.classList.remove('sr-only');
      node.disabled = true;
    });
    return;
  }

  const nameEl = document.getElementById('member-name');
  const reignEl = document.getElementById('member-reign');
  const roleEl = document.getElementById('member-role');
  const closeBtn = sheet.querySelector('.sheet__close');

  nodes.forEach((node) => {
    node.addEventListener('click', () => {
      if (nameEl) nameEl.textContent = node.dataset.name || '';
      if (reignEl) reignEl.textContent = node.dataset.reign || '';
      if (roleEl) roleEl.textContent = node.dataset.role || '';
      sheet.showModal();
    });
  });

  closeBtn?.addEventListener('click', () => sheet.close());

  // Clicking the backdrop lands on the dialog element itself, never on its
  // contents, which is what makes this a reliable click-outside test.
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });
}

initMemberSheet();
