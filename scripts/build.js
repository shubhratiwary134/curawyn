import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function logBuildOutput(label, result) {
  const outputs = Array.isArray(result) ? result : [result];

  console.log(`\n========== ${label} OUTPUT ==========`);

  for (const output of outputs) {
    if (!output.output) {
      console.log('No Rollup output found:', output);
      continue;
    }

    for (const file of output.output) {
      console.log({
        fileName: file.fileName,
        type: file.type,
        ...(file.type === 'chunk'
          ? {
            isEntry: file.isEntry,
            name: file.name,
            imports: file.imports
          }
          : {})
      });
    }
  }

  console.log(`========== END ${label} OUTPUT ==========\n`);
}

async function run() {
  console.log('\n========================================');
  console.log('          BUILD DIAGNOSTICS');
  console.log('========================================');

  console.log('__dirname:', __dirname);
  console.log('rootDir:', rootDir);

  const distDir = path.resolve(rootDir, 'dist');

  console.log('distDir:', distDir);

  const contentEntry = path.resolve(rootDir, 'src/content/main.ts');
  const workerEntry = path.resolve(
    rootDir,
    'src/background/service-worker.ts'
  );

  console.log('\n--- ENTRY FILE CHECKS ---');
  console.log('Content entry:', contentEntry);
  console.log('Content exists:', fs.existsSync(contentEntry));

  console.log('Worker entry:', workerEntry);
  console.log('Worker exists:', fs.existsSync(workerEntry));

  if (!fs.existsSync(contentEntry)) {
    throw new Error(`Content entry not found: ${contentEntry}`);
  }

  if (!fs.existsSync(workerEntry)) {
    throw new Error(`Service worker entry not found: ${workerEntry}`);
  }

  if (fs.existsSync(distDir)) {
    console.log('\nRemoving existing dist folder...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  fs.mkdirSync(distDir, { recursive: true });

  // 1. Build UI pages (popup & options)
  console.log('\n--- BUILDING UI PAGES ---');

  const uiResult = await build({
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

  logBuildOutput('UI BUILD', uiResult);

  // 2. Build Content Script (independent Vite configuration)
  console.log('\n--- BUILDING CONTENT SCRIPT ---');

  const contentResult = await build({
    configFile: false, // Prevent loading vite.config.ts
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
      lib: {
        entry: contentEntry,
        name: 'YFCContent',
        formats: ['es'],
        fileName: () => 'content.js'
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  });

  logBuildOutput('CONTENT SCRIPT BUILD', contentResult);

  // 3. Build Service Worker (independent Vite configuration)
  console.log('\n--- BUILDING SERVICE WORKER ---');

  const workerResult = await build({
    configFile: false, // Prevent loading vite.config.ts
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
        entry: workerEntry,
        name: 'YFCWorker',
        formats: ['es'],
        fileName: () => 'service-worker.js'
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  });

  logBuildOutput('SERVICE WORKER BUILD', workerResult);

  // 4. Copy static assets
  console.log('\n--- COPYING STATIC ASSETS ---');

  const manifestSrc = path.resolve(rootDir, 'public/manifest.json');
  const manifestDest = path.resolve(distDir, 'manifest.json');

  console.log('Manifest source:', manifestSrc);
  console.log('Manifest exists:', fs.existsSync(manifestSrc));

  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('Manifest copied.');
  } else {
    throw new Error('manifest.json not found!');
  }

  const cssSrc = path.resolve(rootDir, 'src/content/styles.css');
  const cssDest = path.resolve(distDir, 'content.css');

  console.log('CSS source:', cssSrc);
  console.log('CSS exists:', fs.existsSync(cssSrc));

  if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, cssDest);
    console.log('Content CSS copied.');
  }

  const iconsSrcDir = path.resolve(rootDir, 'public/icons');
  const iconsDistDir = path.resolve(distDir, 'icons');

  console.log('Icons source:', iconsSrcDir);
  console.log('Icons directory exists:', fs.existsSync(iconsSrcDir));

  if (fs.existsSync(iconsSrcDir)) {
    fs.mkdirSync(iconsDistDir, { recursive: true });

    const files = fs.readdirSync(iconsSrcDir);

    for (const file of files) {
      fs.copyFileSync(
        path.resolve(iconsSrcDir, file),
        path.resolve(iconsDistDir, file)
      );
    }

    console.log('Copied icons:', files);
  }

  // 5. Final dist inspection
  console.log('\n========================================');
  console.log('          FINAL DIST CONTENTS');
  console.log('========================================');

  function printDirectory(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      console.log(prefix + entry.name);

      if (entry.isDirectory()) {
        printDirectory(
          path.join(dir, entry.name),
          prefix + '  '
        );
      }
    }
  }

  printDirectory(distDir);

  // 6. Verify required build artifacts
  console.log('\n--- REQUIRED FILE CHECKS ---');

  const requiredFiles = [
    'content.js',
    'service-worker.js',
    'manifest.json',
    'content.css'
  ];

  let missingFiles = [];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.resolve(distDir, file));
    console.log(`${file}: ${exists ? 'FOUND' : 'MISSING'}`);

    if (!exists) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(
      `Build artifacts missing: ${missingFiles.join(', ')}`
    );
  }

  console.log('\nBuild completed successfully.');
}

run().catch((err) => {
  console.error('\n========== BUILD FAILED ==========');
  console.error(err);
  console.error(err.stack);
  process.exit(1);
});