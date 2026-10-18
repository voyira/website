import { site } from './config/site.js';
import { locales } from './content/index.js';
import { createLanguageService } from './application/localization/create-language-service.js';
import { createPrepareProjectEmail } from './application/inquiries/prepare-project-email.js';
import { createLanguagePreferences } from './infrastructure/browser/language-preferences.js';
import { copyText } from './infrastructure/browser/clipboard.js';
import { openEmailDraft } from './infrastructure/browser/email-client.js';
import { initializeLocalization } from './presentation/localization.js';
import { initializeNavigation } from './presentation/navigation.js';
import { initializeDeliveryProcess } from './presentation/delivery-process.js';
import { initializeProjectContact } from './presentation/project-contact.js';
import { initializePrivacyDialog } from './presentation/privacy-dialog.js';
import { requireElement } from './presentation/dom.js';

const languageService = createLanguageService({
  messages: Object.fromEntries(
    Object.entries(locales).map(([language, content]) => [language, content.messages]),
  ),
  defaultLanguage: site.defaultLanguage,
  preferences: createLanguagePreferences({
    key: site.languageStorageKey,
    getStorage: () => window.localStorage,
  }),
});

initializeLocalization(document, languageService);
initializeNavigation(document, window, languageService);
initializeDeliveryProcess(
  requireElement(document, '#process'),
  languageService,
  Object.fromEntries(
    Object.entries(locales).map(([language, content]) => [language, content.processSteps]),
  ),
);
initializeProjectContact({
  document,
  languageService,
  prepareEmail: createPrepareProjectEmail({
    recipient: site.contactEmail,
    translate: languageService.translate,
  }),
  copyText,
  openDraft: openEmailDraft,
});
initializePrivacyDialog(document);
requireElement(document, '#year').textContent = new Date().getFullYear();
