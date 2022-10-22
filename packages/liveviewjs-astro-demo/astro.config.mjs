import { defineConfig } from 'astro/config';
import { liveviewjs } from 'liveviewjs-astro';

export default defineConfig({
  integrations: [
    liveviewjs()
  ]
});
