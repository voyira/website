import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await checkDirectory(path);
    else if (/\.m?js$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
      if (result.status !== 0) throw new Error(`Syntax check failed: ${path}`);
    }
  }
}

for (const directory of ['src', 'scripts', 'tests'])
  await checkDirectory(resolve(projectRoot, directory));
console.log('All JavaScript syntax checks passed.');
