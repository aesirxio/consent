import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';
import inlineImage from 'esbuild-plugin-inline-image';
import type { Options } from 'tsup';

const env = process.env.NODE_ENV;
const languages = [
  'ar',
  'en',
  'dk',
  'vi',
  'th',
  'es',
  'fr',
  'nl',
  'cs',
  'de',
  'el',
  'fi',
  'he',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'no',
  'pl',
  'pt',
  'ro',
  'se',
  'tr',
  'bg',
  'sk',
  'ua',
  'hr',
  'hi',
  'zh',
  'sr',
  'tl',
];
const translationBuilds = languages.map(
  (lang) =>
    ({
      entry: {
        [lang]: `src/translations/${lang}/common.json`,
      },
      format: ['iife'],
      platform: 'browser',
      bundle: false,
      splitting: false,
      treeshake: false,
      minify: false,
      sourcemap: false,
      globalName: 'aesirx_analytics_translate',
      outDir: 'dist/translations',
      loader: {
        '.json': 'json',
      },
      outExtension() {
        return { js: '.js' };
      },
    }) satisfies Options
);

const externalLibs = [
  'react',
  'react-dom',
  'axios',
  'aesirx-analytics',
  'bowser',
  'i18next',
  'i18next-browser-languagedetector',
  'murmurhash-js/murmurhash3_gc',
  'react-bootstrap',
  'react-select',
  'react-toastify',
  'react-content-loader',
  'buffer',
  '@concordium/react-components',
  '@concordium/web-sdk',
  '@concordium/browser-wallet-api-helpers',
  'query-string',
  'aesirx-sso',
  'react-device-detect',
  'wagmi',
  '@web3modal/ethereum',
  '@web3modal/react',
  'ethers',
];
export default defineConfig([
  {
    entry: ['src/index.ts'],
    clean: true,
    dts: true,
    format: ['esm'],
    platform: 'browser',
    loader: {
      '.js': 'jsx',
    },
    esbuildPlugins: [inlineImage({ limit: -1 }), sassPlugin({ type: 'style', quietDeps: true })],
    esbuildOptions(options) {
      if (env === 'production') {
        options.drop = ['console'];
      }
    },
    outExtension() {
      return {
        js: `.js`,
      };
    },
  },
  {
    entry: ['src/consent-loader.ts'],
    format: ['iife'],
    minify: true,
    sourcemap: false,
    globalName: 'AesirxConsent',
    outDir: 'dist',
    clean: true,
  },
  {
    entry: ['src/consent-simple.tsx'],
    format: ['esm'],
    bundle: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    outDir: 'dist/consent-simple-chunks',
    external: [],
    noExternal: externalLibs,
    esbuildPlugins: [
      inlineImage({ limit: -1 }),
      sassPlugin({ type: 'css', cssImports: true, quietDeps: true }),
    ],
    esbuildOptions(options) {
      if (env === 'production') {
        options.drop = ['console'];
      }
    },
  },
  {
    entry: ['src/consent-verify.tsx'],
    format: ['esm'],
    bundle: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    outDir: 'dist/consent-verify-chunks',
    external: [],
    noExternal: externalLibs,
    esbuildPlugins: [
      inlineImage({ limit: -1 }),
      sassPlugin({ type: 'css', cssImports: true, quietDeps: true }),
    ],
    esbuildOptions(options) {
      if (env === 'production') {
        options.drop = ['console'];
      }
    },
  },
  {
    entry: ['src/consent.tsx'],
    format: ['esm'],
    bundle: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    outDir: 'dist/consent-chunks',
    external: [],
    noExternal: externalLibs,
    esbuildPlugins: [
      inlineImage({ limit: -1 }),
      sassPlugin({ type: 'css', cssImports: true, quietDeps: true }),
    ],
    esbuildOptions(options) {
      if (env === 'production') {
        options.drop = ['console'];
      }
    },
  },
  ...translationBuilds,
]);
