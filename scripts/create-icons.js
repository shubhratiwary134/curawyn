import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Minimal 1x1 transparent PNG expanded or red square PNG
// 1x1 red PNG base64
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const buf = Buffer.from(pngBase64, 'base64');

fs.writeFileSync(path.resolve(iconsDir, 'icon16.png'), buf);
fs.writeFileSync(path.resolve(iconsDir, 'icon48.png'), buf);
fs.writeFileSync(path.resolve(iconsDir, 'icon128.png'), buf);
console.log('Icons generated.');
