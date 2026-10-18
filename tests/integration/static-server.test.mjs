import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from '../../scripts/lib/static-server.mjs';

test('the preview server serves only public files, with correct methods and MIME types', async () => {
  const server = createStaticServer(fileURLToPath(new URL('../../', import.meta.url)));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [path, type] of [
      ['/', 'text/html'],
      ['/src/main.js', 'text/javascript'],
      ['/styles.css', 'text/css'],
      ['/assets/logo.svg', 'image/svg+xml'],
    ]) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 200);
      assert.ok(response.headers.get('content-type').startsWith(type));
    }
    for (const path of [
      '/package.json',
      '/README.md',
      '/.git/config',
      '/src/%2e%2e%2fpackage.json',
      '/assets/../../package.json',
    ])
      assert.equal((await fetch(origin + path)).status, 403, path);
    assert.equal((await fetch(origin + '/src/missing.js')).status, 404);
    assert.equal((await fetch(origin + '/%ZZ')).status, 400);
    const head = await fetch(origin + '/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal((await fetch(origin + '/', { method: 'POST' })).status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
