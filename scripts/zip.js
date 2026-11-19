import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const zipFile = path.resolve(rootDir, 'dist.zip');

if (!fs.existsSync(distDir)) {
  console.error('dist/ does not exist. Run npm run build first.');
  process.exit(1);
}

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipFile);

console.log(`Zipped extension to ${zipFile}`);
