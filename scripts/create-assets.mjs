// Creates placeholder PNG assets for Expo (replace with final artwork before release)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, 'assets');

// Minimal valid 1024x1024 PNG (solid terracotta-ish color) as base64 would be huge;
// Use a small 48x48 PNG and Expo will scale for dev builds.
const SMALL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAAD0eNT6AAAADklEQVQYV2NkYGD4z8DAwMgABQABhqQZ2QAAAABJRU5ErkJggg==';

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const buffer = Buffer.from(SMALL_PNG_BASE64, 'base64');
const files = ['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png'];

for (const file of files) {
  fs.writeFileSync(path.join(assetsDir, file), buffer);
}

console.log('Placeholder assets created in assets/');
