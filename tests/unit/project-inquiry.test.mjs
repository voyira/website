import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProjectInquiry,
  InvalidProjectInquiry,
} from '../../src/domain/inquiries/project-inquiry.js';
import { createPrepareProjectEmail } from '../../src/application/inquiries/prepare-project-email.js';
import { locales } from '../../src/content/index.js';

const validInquiry = {
  name: ' Alex Morgan ',
  email: ' alex@example.com ',
  message: ' A new web platform for our team. ',
  serviceIds: ['web', 'ecommerce', 'web'],
};

test('inquiries normalize text, deduplicate services and cannot be mutated', () => {
  const inquiry = createProjectInquiry(validInquiry);
  assert.equal(inquiry.name, 'Alex Morgan');
  assert.equal(inquiry.email, 'alex@example.com');
  assert.equal(inquiry.message, 'A new web platform for our team.');
  assert.deepEqual(inquiry.serviceIds, ['web', 'ecommerce']);
  assert.ok(Object.isFrozen(inquiry));
  assert.ok(Object.isFrozen(inquiry.serviceIds));
  assert.deepEqual(validInquiry.serviceIds, ['web', 'ecommerce', 'web']);
});

test('an inquiry can start without a selected service', () => {
  const { serviceIds, ...input } = validInquiry;
  assert.deepEqual(createProjectInquiry(input).serviceIds, []);
});

for (const [field, values] of Object.entries({
  name: ['', '   ', 'x'.repeat(101), null],
  email: ['not-an-email', 'x@y', 'x@y.com\nBcc: other@example.com', 'x'.repeat(201)],
  message: ['short', '          ', 'x'.repeat(5001), 42],
  serviceIds: [['unknown'], 'web', null],
})) {
  test(`invalid ${field} values are rejected by the domain`, () => {
    for (const value of values)
      assert.throws(
        () => createProjectInquiry({ ...validInquiry, [field]: value }),
        (error) => error instanceof InvalidProjectInquiry && error.field === field,
      );
  });
}

for (const language of ['en', 'tr']) {
  test(`${language} email drafts preserve multilingual text and cannot inject URL parameters`, () => {
    const prepare = createPrepareProjectEmail({
      recipient: 'info@voyira.com',
      translate: (key) => locales[language].messages[key],
    });
    const message = 'Türkçe ürün: ödeme & stok?\n#launch = 100% + growth\n<script>test</script>';
    const draft = prepare({ ...validInquiry, message });
    const url = new URL(draft.href);
    assert.equal(url.pathname, 'info@voyira.com');
    assert.deepEqual([...url.searchParams.keys()], ['subject', 'body']);
    assert.equal(url.searchParams.get('subject'), locales[language].messages['email.subject']);
    assert.equal(url.searchParams.get('body'), draft.body);
    assert.ok(draft.body.endsWith(message));
    assert.ok(draft.body.includes(locales[language].messages['form.ecommerce']));
  });
}
