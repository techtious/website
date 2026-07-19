// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://beta.techtious.com',
  base: '/',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});