import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};

function isPublicPath(pathname) {
  if (pathname.split('/').some((segment) => segment.startsWith('.'))) return false;
  return (
    ['/index.html', '/styles.css'].includes(pathname) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/src/')
  );
}

export function createStaticServer(rootDirectory) {
  const root = resolve(rootDirectory);
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const path = resolve(root, `.${pathname}`);
      if (!isPublicPath(pathname) || !path.startsWith(root + sep)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }
      if (!(await stat(path)).isFile()) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      const content = await readFile(path);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(path)] || 'application/octet-stream',
        'Content-Length': content.byteLength,
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = error instanceof URIError ? 400 : 404;
      response.writeHead(status);
      response.end(status === 400 ? 'Bad request' : 'Not found');
    }
  });
}
