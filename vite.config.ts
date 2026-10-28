import { defineConfig } from 'vite';

// Every build gets an id, baked into the game and published as version.json next to it, so a
// player holding an old cached copy can tell a newer one is out (see src/ui/update.ts).
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 12) ?? Date.now().toString(36);

export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  server: { host: true },
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    {
      name: 'version-file',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
      },
    },
  ],
});
