// ESLint here is scoped to eslint-plugin-tailwindcss only.
// Biome (biome.json) remains the sole linter/formatter for general JS/TS.
import tailwindcss from 'eslint-plugin-tailwindcss'
import { defineConfig } from 'eslint/config'
import babelParser from '@babel/eslint-parser'

export default defineConfig([
  tailwindcss.configs.recommended,
  {
    files: ['app/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react', '@babel/preset-typescript'],
        },
      },
    },
    settings: {
      tailwindcss: {
        cssConfigPath: './app/frontend/entrypoints/application.css',
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
])
