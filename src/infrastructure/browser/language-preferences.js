export function createLanguagePreferences({ key, getStorage }) {
  return {
    read() {
      try {
        return getStorage().getItem(key);
      } catch {
        // Storage may be unavailable in private browsing or restricted contexts.
        return null;
      }
    },
    write(language) {
      try {
        getStorage().setItem(key, language);
      } catch {
        // The selected language still works for the current page.
      }
    },
  };
}
