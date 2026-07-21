// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.SITE_URL || 'https://techtious.com',
  base: '/',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});