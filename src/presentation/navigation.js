import { requireElement } from './dom.js';

const desktopMediaQuery = '(min-width: 701px)';

export function initializeNavigation(document, window, languageService) {
  const button = requireElement(document, '.menu-toggle');
  const navigation = requireElement(document, '#mobile-nav');
  const header = requireElement(document, '.header');
  let isOpen = false;

  function renderMenu() {
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute(
      'aria-label',
      languageService.translate(isOpen ? 'a11y.menuClose' : 'a11y.menuOpen'),
    );
    navigation.hidden = !isOpen;
  }

  function closeMenu() {
    isOpen = false;
    renderMenu();
  }

  button.addEventListener('click', () => {
    isOpen = !isOpen;
    renderMenu();
  });
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      closeMenu();
      button.focus();
    }
  });
  window.matchMedia(desktopMediaQuery).addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', updateHeader, { passive: true });
  languageService.subscribe(renderMenu);
  renderMenu();
  updateHeader();
}
