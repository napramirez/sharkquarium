import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { Script } from 'node:vm';
import path from 'node:path';
import { bundleProject } from './bundle.mjs';
import { minifyCss, minifyHtml, minifyJs } from './minify.mjs';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'dist');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html');

const LINK_PATTERN = /<link\b[^>]*\bdata-inline\b[^>]*>/;
const SCRIPT_PATTERN = /<script\b[^>]*\bdata-inline\b[^>]*>\s*<\/script>/;

function assertSingleFile(html) {
  if (/<link\b[^>]*\brel=["']?stylesheet/i.test(html)) {
    throw new Error('External stylesheet reference left in dist/index.html');
  }
  if (/<script\b[^>]*\bsrc=/i.test(html)) {
    throw new Error('External script reference left in dist/index.html');
  }
  const scripts = html.match(/<script\b/g) ?? [];
  if (scripts.length !== 1) {
    throw new Error(`dist/index.html must contain exactly one script tag, found ${scripts.length}`);
  }
}

async function main() {
  const { code, moduleCount } = await bundleProject({ root: ROOT });
  const css = await readFile(path.join(ROOT, 'styles/main.css'), 'utf8');
  let html = minifyHtml(await readFile(path.join(ROOT, 'index.html'), 'utf8'));

  if (!LINK_PATTERN.test(html)) throw new Error('index.html is missing the inline stylesheet marker');
  if (!SCRIPT_PATTERN.test(html)) throw new Error('index.html is missing the inline script marker');

  const minifiedJs = minifyJs(code);
  try {
    new Script(minifiedJs);
  } catch (error) {
    throw new Error(`Minified bundle failed to parse: ${error.message}`);
  }

  const safeJs = minifiedJs.replaceAll('</script', '<\\/script');
  const safeCss = minifyCss(css).replaceAll('</style', '<\\/style');

  html = html.replace(LINK_PATTERN, () => `<style>${safeCss}</style>`);
  html = html.replace(SCRIPT_PATTERN, () => `<script>${safeJs}</script>`);

  assertSingleFile(html);

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, html, 'utf8');

  const files = await readdir(OUTPUT_DIR);
  if (files.length !== 1 || files[0] !== 'index.html') {
    throw new Error(`dist/ must contain only index.html, found: ${files.join(', ')}`);
  }

  const bytes = Buffer.byteLength(html);
  const gzip = gzipSync(html).length;
  const rawJs = Buffer.byteLength(code);
  const minJs = Buffer.byteLength(safeJs);
  const saved = Math.round((1 - minJs / rawJs) * 100);
  console.log(`Bundled ${moduleCount} modules into dist/index.html (minified)`);
  console.log(`  JS ${(rawJs / 1024).toFixed(1)} kB -> ${(minJs / 1024).toFixed(1)} kB (${saved}% smaller)`);
  console.log(`  ${(bytes / 1024).toFixed(1)} kB total (${(gzip / 1024).toFixed(1)} kB gzip)`);
}

main().catch((error) => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
