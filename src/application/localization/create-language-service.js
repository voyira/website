export function createLanguageService({ messages, defaultLanguage, preferences }) {
  const isSupported = (language) => Object.hasOwn(messages, language);
  if (!isSupported(defaultLanguage)) throw new RangeError('Unsupported default language');

  const savedLanguage = preferences.read();
  let language = isSupported(savedLanguage) ? savedLanguage : defaultLanguage;
  const subscribers = new Set();

  function translate(key) {
    const value = messages[language][key] ?? messages[defaultLanguage][key];
    if (typeof value !== 'string') throw new Error(`Missing translation: ${key}`);
    return value;
  }

  function changeLanguage(nextLanguage) {
    if (!isSupported(nextLanguage)) throw new RangeError(`Unsupported language: ${nextLanguage}`);
    preferences.write(nextLanguage);
    if (language === nextLanguage) return;

    language = nextLanguage;
    subscribers.forEach((subscriber) => subscriber(language));
  }

  function subscribe(subscriber) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  return Object.freeze({ getLanguage: () => language, translate, changeLanguage, subscribe });
}
