# Voyira

A responsive, one-page software studio website in English and Turkish. Built with semantic HTML, modular CSS and native JavaScript modules. There are no production package dependencies.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Set `PORT` to use another port. The development server serves the public page, source modules and assets; repository files are inaccessible.

```sh
npm run build
npm start
```

The build creates `dist/`, copies the browser modules and assets, and combines the CSS modules into a single stylesheet. Deploy `dist/` at the domain root; URLs are root-relative. `npm start` previews the production build.

## Architecture

The architecture uses DDD principles at the scale of this presentation site. The actual domain is a visitor's project enquiry and the services it can request. Domain rules are independent of the DOM, translations, email clients and storage. There is no database or server-side email delivery.

```text
src/
  domain/
    inquiries/       Immutable, normalized and validated project enquiries
    services/        Allowed service identifiers
  application/
    inquiries/       Prepare a localized email draft from an enquiry
    localization/    Language selection and translation lookup
  infrastructure/
    browser/         Local storage, clipboard and email-client adapters
  presentation/      Localization, menu, process tabs, contact form and dialog
    styles/          Design tokens, shared styles and section styles
  content/           English and Turkish text and delivery-process content
  config/            Site configuration
  main.js            Composition root: creates and connects the dependencies
```

Dependencies point inward: `domain` imports only `domain`; `application` may import `domain`. Presentation and browser adapters are connected in `main.js`. An architecture test checks these boundaries. Styling belongs to the presentation layer; content is separate from behavior.

`index.html` keeps the complete semantic document and English fallback content available before JavaScript runs. Keep that fallback in sync when changing copy. Static form constraints and service choices are checked against the domain contract by the test suite.

## Where to make changes

| Change                                | Source                                               |
| ------------------------------------- | ---------------------------------------------------- |
| Page structure and English fallback   | `index.html`                                         |
| Translations and process descriptions | `src/content/en.js`, `src/content/tr.js`             |
| Email recipient and default language  | `src/config/site.js`                                 |
| Enquiry limits and validation         | `src/domain/inquiries/project-inquiry.js`            |
| Allowed services                      | `src/domain/services/service-catalog.js`             |
| Draft formatting                      | `src/application/inquiries/prepare-project-email.js` |
| UI behavior                           | Individual modules in `src/presentation/`            |
| Colors and type tokens                | `src/presentation/styles/tokens.css`                 |
| Section styles                        | Corresponding file in `src/presentation/styles/`     |
| Logo                                  | `assets/logo.svg`                                    |

When changing the contact address, also update the visible address, direct email links and privacy copy in `index.html` and the locale files. These remain explicit static content for accessibility and fallback rendering.

## Behavior

- English is the initial language; an explicit choice is remembered when browser storage is available.
- The contact form prepares a draft in the visitor's email client. It does not automatically send or store an enquiry. Visitors can also copy the draft.
- Form values are normalized and validated before draft creation. Changing the input clears stale validation and draft feedback.
- Hero interface values are illustrative sample data.
- Fonts are local and include their OFL licenses. There are no analytics, advertising cookies or third-party runtime requests.

## Quality checks

```sh
npm run verify
```

This runs syntax and formatting checks, domain/application and integration tests, a production build, and browser tests against `dist/`.

Browser tests use installed Chromium or Google Chrome. If neither is available, install Chromium with `npx playwright install chromium` or set `PLAYWRIGHT_EXECUTABLE_PATH` to an installed browser executable.

```sh
npm test              # Domain, application, content contracts, dependency rules, static server
npm run test:browser  # Built assets, responsive layout and user interactions
npm run format        # Apply the shared formatting rules
```

The browser suite checks both languages at 320, 360, 390, 768, 1024 and 1440 pixels; mobile navigation, keyboard tabs, language persistence, service selection, validation, draft preparation, clipboard fallback, FAQ and privacy interactions. The build contains no test files or development scripts.
