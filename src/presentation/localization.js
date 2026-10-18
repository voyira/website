import { requireElement } from './dom.js';

export function initializeLocalization(document, languageService) {
  const { translate, changeLanguage, getLanguage, subscribe } = languageService;
  const textElements = document.querySelectorAll('[data-i18n]');
  const richTextElements = document.querySelectorAll('[data-i18n-html]');
  const placeholders = document.querySelectorAll('[data-placeholder]');
  const accessibleLabels = document.querySelectorAll('[data-i18n-aria]');
  const languageButtons = document.querySelectorAll('[data-lang]');
  const description = requireElement(document, 'meta[name="description"]');
  const socialTitle = requireElement(document, 'meta[property="og:title"]');
  const socialDescription = requireElement(document, 'meta[property="og:description"]');

  function render() {
    document.documentElement.lang = getLanguage();
    textElements.forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    // Rich text comes only from the source-controlled locale files, never from visitors.
    richTextElements.forEach((element) => {
      element.innerHTML = translate(element.dataset.i18nHtml);
    });
    placeholders.forEach((element) => {
      element.placeholder = translate(element.dataset.placeholder);
    });
    accessibleLabels.forEach((element) => {
      element.setAttribute('aria-label', translate(element.dataset.i18nAria));
    });
    languageButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === getLanguage()));
    });
    document.title = translate('meta.title');
    description.content = translate('meta.description');
    socialTitle.content = document.title;
    socialDescription.content = description.content;
  }

  languageButtons.forEach((button) =>
    button.addEventListener('click', () => changeLanguage(button.dataset.lang)),
  );
  subscribe(render);
  render();
}
