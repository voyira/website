# Voyira

A responsive, single-page website for Voyira software studio, in English and Turkish. Built with HTML, CSS and JavaScript; no framework or production dependencies.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:5173. Set `PORT` to use another port.

```sh
npm run check
npm run build
```

The build copies the site into `dist/`, ready for static hosting. Assets use root-relative URLs, so deploy at the domain root.

## Content and behavior

- The initial language is English. A visitor's explicit choice is remembered locally.
- Copy and translations: `app.js`; page structure: `index.html`; styles: `styles.css`.
- Contact address: `info@voyira.com`. Form submission opens the visitor's email client with a prepared draft and offers a copy fallback. There is no submission backend or automatic email delivery.
- All interface values in the hero are illustrative sample data.
- Fonts are hosted locally. No analytics, advertising cookies, or third-party runtime requests.
- Wordmark is a vector reconstruction of the supplied logo, available in `assets/logo.svg`.

## Validation

Syntax checks and a static build were completed. Chromium checks covered English and Turkish at 320, 360, 390, 768, 1024 and 1440px; navigation, language persistence, process tabs and keyboard controls, FAQ, service preselection, email draft preparation and the privacy dialog. No JavaScript errors, failed resources or horizontal document overflow were observed.
