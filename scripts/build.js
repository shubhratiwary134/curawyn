import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function run() {
  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 1. Build UI pages (popup & options)
  await build({
    root: rootDir,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: path.resolve(rootDir, 'popup.html'),
          options: path.resolve(rootDir, 'options.html')
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    }
  });

  // 2. Build Content Script (IIFE for manifest v3 compatibility)
  await build({
    root: rootDir,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/content/main.ts'),
        name: 'YFCContent',
        formats: ['iife'],
        fileName: () => 'content.js'
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  });

  // 3. Build Service Worker (IIFE)
  await build({
    root: rootDir,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/background/service-worker.ts'),
        name: 'YFCWorker',
        formats: ['iife'],
        fileName: () => 'service-worker.js'
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  });

  // 4. Copy static assets: manifest.json, styles.css -> content.css, icons
  const manifestSrc = path.resolve(rootDir, 'public/manifest.json');
  fs.copyFileSync(manifestSrc, path.resolve(distDir, 'manifest.json'));

  const cssSrc = path.resolve(rootDir, 'src/content/styles.css');
  if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, path.resolve(distDir, 'content.css'));
  }

  const iconsSrcDir = path.resolve(rootDir, 'public/icons');
  const iconsDistDir = path.resolve(distDir, 'icons');
  if (fs.existsSync(iconsSrcDir)) {
    if (!fs.existsSync(iconsDistDir)) {
      fs.mkdirSync(iconsDistDir, { recursive: true });
    }
    const files = fs.readdirSync(iconsSrcDir);
    for (const file of files) {
      fs.copyFileSync(path.resolve(iconsSrcDir, file), path.resolve(iconsDistDir, file));
    }
  }

  console.log('Build completed successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
