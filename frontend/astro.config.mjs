// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://techtious.github.io',
  base: '/techtious-beta',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});