import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './lib/static-server.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(projectRoot, process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
// Listen on all interfaces so the site is reachable from outside a container.
const host = process.env.HOST || '0.0.0.0';
const server = createStaticServer(root);
server.listen(port, host, () => console.log(`Voyira ready at http://localhost:${port}`));
