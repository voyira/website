import test from 'node:test';
import assert from 'node:assert/strict';
import { createLanguageService } from '../../src/application/localization/create-language-service.js';
import { createLanguagePreferences } from '../../src/infrastructure/browser/language-preferences.js';

const messages = { en: { hello: 'Hello', fallback: 'English' }, tr: { hello: 'Merhaba' } };
function setup(saved = null) {
  const writes = [];
  const service = createLanguageService({
    messages,
    defaultLanguage: 'en',
    preferences: { read: () => saved, write: (value) => writes.push(value) },
  });
  return { service, writes };
}

test('English is the default and unknown stored languages safely fall back', () => {
  for (const saved of [null, 'xx', '__proto__'])
    assert.equal(setup(saved).service.getLanguage(), 'en');
  assert.equal(setup('tr').service.translate('hello'), 'Merhaba');
});

test('language changes persist, notify subscribers once and support unsubscribe', () => {
  const { service, writes } = setup();
  const seen = [];
  const unsubscribe = service.subscribe((language) => seen.push(language));
  service.changeLanguage('tr');
  service.changeLanguage('tr');
  assert.deepEqual(seen, ['tr']);
  assert.deepEqual(writes, ['tr', 'tr']);
  unsubscribe();
  service.changeLanguage('en');
  assert.deepEqual(seen, ['tr']);
});

test('missing translations use English, while unknown keys and unsupported languages fail explicitly', () => {
  const { service } = setup('tr');
  assert.equal(service.translate('fallback'), 'English');
  assert.throws(() => service.translate('missing'), /Missing translation/);
  assert.throws(() => service.changeLanguage('xx'), RangeError);
  assert.equal(service.getLanguage(), 'tr');
});

test('blocked browser storage never prevents localization', () => {
  const preferences = createLanguagePreferences({
    key: 'language',
    getStorage: () => {
      throw new Error('Blocked');
    },
  });
  assert.equal(preferences.read(), null);
  assert.doesNotThrow(() => preferences.write('tr'));
  const service = createLanguageService({ messages, defaultLanguage: 'en', preferences });
  service.changeLanguage('tr');
  assert.equal(service.translate('hello'), 'Merhaba');
});
