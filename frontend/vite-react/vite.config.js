import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],

  build: {
    sourcemap: true,  // Enable source maps for production builds
  },

  server: {
    sourcemap: true,  // Enable source maps for development server
  },

  // resolve: {
  //   alias: {
  //     '@mainProjectLib': path.resolve(__dirname, './mainProject/lib'),
  //     '@mainProjectTranslation': path.resolve(__dirname, './mainProject/translation'),
  //   }
  // }

});

// import { someFunction } from '@mainProject/lib/someFile';