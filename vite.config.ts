import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// @ts-expect-error plain ESM module shared with the production server
import { createCensus } from './server/census.mjs';

// The same Census forwarder the production server uses (with no target it counts nothing), so
// dev and prod answer /_e.js and /_e alike.
function census(): Plugin {
  const handle = createCensus({ site: 'randomiser' });
  const middleware = async (req: any, res: any, next: (error?: unknown) => void) => {
    try {
      if (await handle(req, res)) return;
      next();
    } catch (error) {
      next(error);
    }
  };
  return {
    name: 'randomiser-census',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig({
  plugins: [svelte(), census()],
  // 6900 is the NAS port; locally the app runs beside it.
  server: { port: 6920, strictPort: true },
  preview: { port: 6921, strictPort: true },
  build: {
    target: 'es2022',
    cssTarget: ['chrome123', 'safari17.5', 'firefox120'],
  },
});
