import { createProjectInquiry } from '../../domain/inquiries/project-inquiry.js';

export function createPrepareProjectEmail({ recipient, translate }) {
  return function prepareProjectEmail(input) {
    const inquiry = createProjectInquiry(input);
    const selectedServices = inquiry.serviceIds.map((id) => translate(`form.${id}`));
    const subject = translate('email.subject');
    const body = [
      `${translate('form.name')}: ${inquiry.name}`,
      `${translate('form.email')}: ${inquiry.email}`,
      `${translate('form.interest')}: ${selectedServices.join(', ') || '—'}`,
      '',
      inquiry.message,
    ].join('\n');

    return Object.freeze({
      subject,
      body,
      href: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    });
  };
}
