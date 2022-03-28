import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { resolve } from 'path';

export default defineConfig(() => {

  return {
    plugins: [
      reactRefresh(),
    ],

    resolve: {
      alias: {
        src: resolve(__dirname, 'src'),
      },
      mainFields: ['module', 'browser', 'main'],
    },
    esbuild: {},
    css: {
      preprocessorOptions: {
        hash: true,
        less: {
          javascriptEnabled: true,
        },
      },
    },

    assetsInclude: ['**/*.svg'],
    define: {
      'process.env.NODE_ENV': null,
      'process.env.REACT_APP_API_HOST': null,
      'process.env.REACT_APP_N_TOKEN': null,
      'process.env.REACT_APP_PRODTEST': null,
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, '/src/index.tsx'),
        output: {
          assetFileNames: '[ext]/[name].[hash].[ext]',
          chunkFileNames: '[name].[hash].js',
          entryFileNames: '[name].[hash].js',
        },
      },
    },
    server: {
      port: 8888,
      host: 'local.newrank.cn',
      open: '/',
    },
  };
});