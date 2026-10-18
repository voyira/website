import { inquiryConstraints, InvalidProjectInquiry } from '../domain/inquiries/project-inquiry.js';
import { requireElement } from './dom.js';

export function initializeProjectContact({
  document,
  languageService,
  prepareEmail,
  copyText,
  openDraft,
}) {
  const form = requireElement(document, '.contact-form');
  const status = requireElement(form, '.form-status');
  const serviceInputs = new Map(
    [...form.querySelectorAll('input[name="service"]')].map((input) => [input.value, input]),
  );
  const { translate } = languageService;

  Object.entries(inquiryConstraints).forEach(([field, { min, max }]) => {
    const input = form.elements.namedItem(field);
    input.minLength = min;
    input.maxLength = max;
  });

  function clearFeedback() {
    status.hidden = true;
    form.querySelectorAll('input, textarea').forEach((input) => input.setCustomValidity(''));
  }

  function showInvalidInquiry(error) {
    if (!(error instanceof InvalidProjectInquiry)) throw error;
    const message = translate(`form.validation.${error.field}`);
    const input = form.elements.namedItem(error.field);
    if (input?.setCustomValidity) {
      input.setCustomValidity(message);
      input.reportValidity();
      return;
    }
    status.textContent = message;
    status.hidden = false;
  }

  function renderDraftFallback(draft) {
    const link = document.createElement('a');
    link.href = draft.href;
    link.textContent = translate('form.fallbackLink');
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-brief';
    copyButton.textContent = translate('form.copy');
    copyButton.addEventListener('click', async () => {
      try {
        await copyText(draft.body);
        status.textContent = translate('form.copied');
      } catch {
        status.textContent = translate('form.copyFailed');
      }
    });
    status.replaceChildren(
      document.createTextNode(`${translate('form.fallback')} `),
      link,
      document.createTextNode(' · '),
      copyButton,
    );
    status.hidden = false;
  }

  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const input = serviceInputs.get(link.dataset.service);
      if (!input) throw new Error(`Unknown contact service: ${link.dataset.service}`);
      input.checked = true;
      clearFeedback();
    });
  });

  form.addEventListener('input', clearFeedback);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    let draft;
    try {
      draft = prepareEmail({
        name: data.get('name'),
        email: data.get('email'),
        message: data.get('message'),
        serviceIds: data.getAll('service'),
      });
    } catch (error) {
      showInvalidInquiry(error);
      return;
    }
    renderDraftFallback(draft);
    openDraft(draft.href);
  });
  languageService.subscribe(clearFeedback);
}
