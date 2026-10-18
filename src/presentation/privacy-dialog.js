import { requireElement } from './dom.js';

export function initializePrivacyDialog(document) {
  const dialog = requireElement(document, '#privacy-dialog');
  requireElement(document, '.privacy-trigger').addEventListener('click', () => dialog.showModal());
  dialog.querySelectorAll('.close-dialog, .close-privacy').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    const isOutside =
      event.clientX < left ||
      event.clientX > right ||
      event.clientY < top ||
      event.clientY > bottom;
    if (isOutside) dialog.close();
  });
}
