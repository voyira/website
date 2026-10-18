import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(projectRoot, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of ['index.html', 'src', 'assets']) {
  await cp(resolve(projectRoot, path), resolve(output, path), { recursive: true });
}

// Keep styles modular in source and avoid a chain of CSS requests in production.
const entryStyles = await readFile(resolve(projectRoot, 'styles.css'), 'utf8');
const imports = [...entryStyles.matchAll(/@import url\(['"]([^'"]+)['"]\);/g)];
const styles = await Promise.all(
  imports.map(([, path]) => readFile(resolve(projectRoot, `.${path}`), 'utf8')),
);
await writeFile(resolve(output, 'styles.css'), styles.join('\n'));
console.log('Built static website in dist/');
