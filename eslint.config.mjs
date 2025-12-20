// @ts-check

import js from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...eslintPluginAstro.configs.recommended,
  js.configs.recommended,
  {
    ignores: ['public/scripts/*', 'scripts/*', '.astro/', 'src/env.d.ts'],
    rules: {}
  }
])
