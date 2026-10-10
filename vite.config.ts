import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Shared Vite config, picked up by Storybook's Vite builder. The library build is vite.lib.config.ts.
export default defineConfig({
  plugins: [react()],
  css: { modules: { localsConvention: 'camelCaseOnly' } },
});
