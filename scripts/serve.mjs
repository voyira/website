import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root = resolve(process.cwd());
const port = Number(process.env.PORT || 5173);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png'};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep) || url.pathname.includes('/.')) { res.writeHead(403); res.end(); return; }
    if (!(await stat(path)).isFile()) throw new Error('Not found');
    res.writeHead(200, {'Content-Type': mime[extname(path)] || 'application/octet-stream'});
    res.end(await readFile(path));
  } catch {res.writeHead(404); res.end('Not found');}
}).listen(port, '127.0.0.1', () => console.log(`Voyira ready at http://localhost:${port}`));
