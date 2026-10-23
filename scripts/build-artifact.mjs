// Builds the game into a single self-contained HTML file (scripts, styles and
// fonts inlined) suitable for hosting as a claude.ai Artifact or any static page.
// Usage: node scripts/build-artifact.mjs [outFile]

import { build } from 'vite';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] ?? join(root, 'dist-single', 'buck-ducks.html'));
const tmp = mkdtempSync(join(tmpdir(), 'buck-ducks-'));

await build({
  root,
  base: './',
  logLevel: 'warn',
  build: {
    outDir: tmp,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});

const assets = join(tmp, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const html = readFileSync(join(tmp, 'index.html'), 'utf8');

const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>Buck Ducks</title>';
const icon = html.match(/<link rel="icon"[^>]*>/)?.[0] ?? '';
const desc = html.match(/<meta name="description"[^>]*>/)?.[0] ?? '';
const body = html
  .match(/<body>([\s\S]*?)<\/body>/)[1]
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .trim();

// The page is a fragment: the host wraps it in its own document skeleton.
const page = `${title}
${desc}
${icon}
<style>
:root { color-scheme: dark; }
html, body { height: 100%; background: #1a0c06; }
${css.replace(/<\/style/gi, '<\\/style')}
</style>
${body}
<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;

writeFileSync(out, page);
rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(0)} KB)`);
