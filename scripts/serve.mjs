import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './lib/static-server.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(projectRoot, process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
const server = createStaticServer(root);
server.listen(port, '127.0.0.1', () => console.log(`Voyira ready at http://localhost:${port}`));
