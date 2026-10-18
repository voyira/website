import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales } from '../../src/content/index.js';
import { serviceIds } from '../../src/domain/services/service-catalog.js';
import { inquiryConstraints } from '../../src/domain/inquiries/project-inquiry.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const html = await readFile(resolve(root, 'index.html'), 'utf8');

test('both languages supply every page binding and have matching translation keys', () => {
  assert.deepEqual(
    Object.keys(locales.en.messages).sort(),
    Object.keys(locales.tr.messages).sort(),
  );
  const keys = [...html.matchAll(/data-(?:i18n(?:-html|-aria)?|placeholder)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const locale of Object.values(locales)) {
    for (const key of keys) assert.ok(locale.messages[key], `Missing key: ${key}`);
    assert.equal(locale.processSteps.length, 4);
    for (const step of locale.processSteps) {
      assert.ok(step.title);
      assert.ok(step.body);
      assert.equal(step.tags.length, 3);
    }
  }
});

test('service cards and contact choices agree with the domain catalog', () => {
  const cardServices = [...html.matchAll(/data-service="([^"]+)"/g)].map((match) => match[1]);
  const formServices = [...html.matchAll(/name="service"\s+value="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual([...formServices].sort(), [...serviceIds].sort());
  assert.deepEqual([...cardServices].sort(), serviceIds.filter((id) => id !== 'other').sort());
});

async function javascriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await javascriptFiles(path)));
    else if (entry.name.endsWith('.js')) files.push(path);
  }
  return files;
}

test('dependency direction keeps domain and application independent of browser and presentation', async () => {
  for (const layer of ['domain', 'application']) {
    for (const path of await javascriptFiles(resolve(root, 'src', layer))) {
      const source = await readFile(path, 'utf8');
      assert.doesNotMatch(
        source,
        /\b(?:document|window|localStorage|navigator)\b/,
        relative(root, path),
      );
      for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const dependency = resolve(dirname(path), specifier);
        const allowed = layer === 'domain' ? ['domain'] : ['domain', 'application'];
        assert.ok(
          allowed.some((name) => dependency.startsWith(resolve(root, 'src', name) + '/')),
          `${relative(root, path)} imports ${specifier}`,
        );
      }
    }
  }
});

test('static form constraints match the enquiry domain', () => {
  for (const [field, { min, max }] of Object.entries(inquiryConstraints)) {
    const tag = html.match(
      new RegExp(`<(?:(?:input)|(?:textarea))\\b[^>]*name="${field}"[^>]*>`),
    )?.[0];
    assert.ok(tag, `Missing form field: ${field}`);
    assert.match(tag, /\brequired\b/);
    assert.equal(Number(tag.match(/maxlength="(\d+)"/)?.[1]), max);
    assert.equal(Number(tag.match(/minlength="(\d+)"/)?.[1] || 1), min);
  }
});
