import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createStaticServer } from '../../scripts/lib/static-server.mjs';

let browser;
let server;
let origin;

before(async () => {
  const executablePath = [
    process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    chromium.executablePath(),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((path) => path && existsSync(path));
  if (!executablePath)
    throw new Error(
      'Install Chromium with npx playwright install chromium, or set PLAYWRIGHT_EXECUTABLE_PATH.',
    );
  browser = await chromium.launch({ executablePath, headless: true });
  server = createStaticServer(fileURLToPath(new URL('../../dist/', import.meta.url)));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await browser?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function withPage(run, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    ...options,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  });
  await page.addInitScript(() =>
    document.addEventListener(
      'click',
      (event) => {
        const link = event.target.closest('a');
        if (link?.href.startsWith('mailto:')) {
          window.lastEmailDraft = link.href;
          event.preventDefault();
        }
      },
      true,
    ),
  );
  try {
    await page.goto(origin);
    await page.evaluate(() => document.fonts.ready);
    await run(page, context);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

test('production assets load and both languages remain readable across breakpoints', async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    for (const language of ['en', 'tr']) {
      await page.locator(`[data-lang=${language}]`).click();
      for (const width of [1440, 1024, 768, 390, 360, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          columns: getComputedStyle(
            document.querySelector('.service-grid'),
          ).gridTemplateColumns.split(' ').length,
          overlap: [...document.querySelectorAll('.service-card')].some(
            (card) =>
              card.querySelector('p').getBoundingClientRect().bottom >
              card.querySelector('ul').getBoundingClientRect().top,
          ),
        }));
        assert.equal(layout.overflow, false, `${language} ${width}px overflow`);
        assert.equal(layout.columns, width > 700 ? 2 : 1);
        assert.equal(layout.overlap, false, `${language} ${width}px overlap`);
      }
    }
    assert.equal(await page.locator('.service-card').count(), 4);
    assert.equal(await page.locator('.service-features li').count(), 16);
  });
});

test('language persists and updates metadata and the selected process step', async () => {
  await withPage(async (page) => {
    await page.locator('[data-step="2"]').click();
    await page.locator('[data-lang=tr]').click();
    assert.equal(
      await page.locator('[role=tab][aria-selected=true]').getAttribute('data-step'),
      '2',
    );
    assert.match(await page.locator('#process-title').textContent(), /Adım adım/);
    assert.match(await page.title(), /Büyük fikirler/);
    assert.equal(await page.locator('.desktop-nav').getAttribute('aria-label'), 'Ana menü');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'tr');
    await page.locator('[data-step="0"]').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(
      await page.locator('[role=tab][aria-selected=true]').getAttribute('data-step'),
      '3',
    );
    await page.keyboard.press('Home');
    assert.equal(
      await page.locator('[role=tab][aria-selected=true]').getAttribute('data-step'),
      '0',
    );
    await page.keyboard.press('End');
    assert.equal(
      await page.locator('[role=tab][aria-selected=true]').getAttribute('data-step'),
      '3',
    );
  });
});

test('mobile navigation closes on links, Escape and a desktop resize', async () => {
  await withPage(
    async (page) => {
      const button = page.locator('.menu-toggle');
      await button.click();
      assert.equal(await page.locator('#mobile-nav').isVisible(), true);
      await page.locator('[data-lang=tr]').click();
      assert.equal(await button.getAttribute('aria-label'), 'Menüyü kapat');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mobile-nav').isHidden(), true);
      assert.equal(await button.evaluate((el) => el === document.activeElement), true);
      await button.click();
      await page.locator('#mobile-nav a[href="#services"]').click();
      assert.equal(await page.locator('#mobile-nav').isHidden(), true);
      await button.click();
      await page.setViewportSize({ width: 1024, height: 1000 });
      assert.equal(await page.locator('#mobile-nav').isHidden(), true);
      assert.notEqual(
        await page.locator('body').evaluate((el) => getComputedStyle(el).overflow),
        'hidden',
      );
    },
    { viewport: { width: 390, height: 844 } },
  );
});

test('service selection, mail draft and clipboard fallback preserve project details', async () => {
  await withPage(async (page, context) => {
    for (const service of ['web', 'custom', 'mobile', 'ecommerce']) {
      await page.locator(`[data-service=${service}]`).click();
      assert.equal(await page.locator(`input[value=${service}]`).isChecked(), true);
    }
    await page.locator('[data-lang=tr]').click();
    await page.locator('input[name=name]').fill(' Deniz Test ');
    await page.locator('input[name=email]').fill('deniz@example.com');
    const message = 'Türkçe mobil uygulama & e-ticaret\nStok ve ödeme entegrasyonu.';
    await page.locator('textarea[name=message]').fill(message);
    await page.locator('.form-submit').click();
    const draft = new URL(await page.evaluate(() => window.lastEmailDraft));
    assert.equal(draft.pathname, 'info@voyira.com');
    assert.equal(draft.searchParams.get('subject'), 'Yeni bir proje konuşalım');
    assert.ok(draft.searchParams.get('body').includes('Adınız: Deniz Test'));
    assert.ok(draft.searchParams.get('body').includes('E-ticaret & Yapay zekâ'));
    assert.ok(draft.searchParams.get('body').endsWith(message));
    assert.equal(await page.locator('.form-status').isVisible(), true);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('.copy-brief').click();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      draft.searchParams.get('body'),
    );
    assert.match(await page.locator('.form-status').textContent(), /kopyalandı/);
  });
});

test('whitespace input is rejected, and a corrected enquiry can still be submitted', async () => {
  await withPage(async (page) => {
    await page.locator('input[name=name]').fill('   ');
    await page.locator('input[name=email]').fill('person@example.com');
    await page.locator('textarea[name=message]').fill('This is a project request.');
    await page.locator('.form-submit').click();
    assert.equal(await page.evaluate(() => window.lastEmailDraft), undefined);
    assert.equal(
      await page.locator('input[name=name]').evaluate((el) => el.validity.customError),
      true,
    );
    await page.locator('input[name=name]').fill('Valid Person');
    await page.locator('.form-submit').click();
    assert.ok(await page.evaluate(() => window.lastEmailDraft));
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new Error('Blocked')) },
        configurable: true,
      });
    });
    await page.locator('.copy-brief').click();
    assert.match(await page.locator('.form-status').textContent(), /info@voyira.com/);
  });
});

test('FAQ and privacy remain keyboard accessible', async () => {
  await withPage(async (page) => {
    const question = page.locator('details').nth(1);
    await question.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await question.getAttribute('open'), '');
    await page.locator('.privacy-trigger').click();
    assert.equal(await page.locator('#privacy-dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#privacy-dialog').isHidden(), true);
    await page.locator('.privacy-trigger').click();
    await page.locator('.close-privacy').click();
    assert.equal(await page.locator('#privacy-dialog').isHidden(), true);
  });
});
