// Pre-generate NativeWind CSS caches (avoids Tailwind watch failures on Windows)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const cacheDir = path.join(root, 'node_modules', '.cache', 'nativewind');
const tailwindCli = path.join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
const input = path.join(root, 'global.css');

fs.mkdirSync(cacheDir, { recursive: true });

for (const platform of ['web', 'android']) {
  const output = path.join(cacheDir, `global.css.${platform}.css`);
  execSync(`node "${tailwindCli}" --input "${input}" --output "${output}"`, {
    stdio: 'inherit',
    cwd: root,
  });
}

console.log('NativeWind CSS caches ready.');
