import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import react from '@astrojs/react'
import AstroPureIntegration from 'astro-pure'
import { defineConfig, fontProviders } from 'astro/config'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

/*
 * Copyright 2025 CWorld
 * Licensed under the Apache License, Version 2.0.
 *
 * Modifications made by Jerry on 2025.
 */

// Local integrations
import rehypeAutolinkHeadings from './src/plugins/rehype-auto-link-headings.ts'
// Shiki
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  updateStyle
} from './src/plugins/shiki-custom-transformers.ts'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape
} from './src/plugins/shiki-offical/transformers.ts'
import config from './src/site.config.ts'

// https://astro.build/config
export default defineConfig({
  // [Basic]
  site: 'https://jerryplusy.ink',
  // Deploy to a sub path
  // https://astro-pure.js.org/docs/setup/deployment#platform-with-base-path
  // base: '/astro-pure/',
  trailingSlash: 'never',
  // root: './my-project-directory',
  server: {
    host: true,
    port: 4321,
    allowedHosts: ['Jerryplusy.ink', 'jerry.crystelf.top', 'jerryplusy.ink']
  },

  // [Vite Configuration]
  vite: {
    define: {
      global: 'globalThis',
      'process.env': {}
    },
    optimizeDeps: {
      include: ['@excalidraw/excalidraw'],
      esbuildOptions: {
        target: 'es2022',
        treeShaking: true // 强制摇树
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 拆分 Excalidraw 语言包
            if (id.includes('locales') && !/en.json/.test(id)) {
              return 'locales/chunk'
            }
          }
        }
      }
    },
    server: {
      allowedHosts: ['Jerryplusy.ink', 'jerry.crystelf.top', 'jerryplusy.ink']
    },
    preview: {
      allowedHosts: ['Jerryplusy.ink', 'jerry.crystelf.top', 'jerryplusy.ink']
    }
  },

  // [Adapter]
  // https://docs.astro.build/en/guides/deploy/
  output: 'static',

  // [Assets]
  image: {
    responsiveStyles: true,
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ghchart.rshah.org'
      }
    ]
  },

  // [Fonts]
  fonts: [
    {
      provider: fontProviders.fontshare(),
      name: 'Satoshi',
      cssVariable: '--font-satoshi',
      // Default included:
      // weights: [400],
      // styles: ["normal", "italics"],
      // subsets: ["cyrillic-ext", "cyrillic", "greek-ext", "greek", "vietnamese", "latin-ext", "latin"],
      // fallbacks: ["sans-serif"],
      styles: ['normal', 'italic'],
      weights: [400, 500],
      subsets: ['latin']
    }
  ],

  // [Markdown]
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeKatex, {}],
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['anchor'] },
          content: { type: 'text', value: '#' }
        }
      ]
    ],
    // https://docs.astro.build/en/guides/syntax-highlighting/
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      transformers: [
        // Official transformers
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerRemoveNotationEscape(),
        // Custom transformers
        updateStyle(),
        addTitle(),
        addLanguage(),
        addCopyButton(2000), // timeout in ms
        addCollapse(15) // max lines that needs to collapse
      ]
    }
  },

  // [Integrations]
  integrations: [
    // React support for Excalidraw
    react(),
    // astro-pure will automatically add sitemap, mdx & unocss
    // sitemap(),
    // mdx(),
    AstroPureIntegration(config)
    // Compress recommend
    // https://docs.astro.build/en/guides/integrations-guide/partytown/
  ],

  // [Experimental]
  experimental: {
    // Allow compatible editors to support intellisense features for content collection entries
    // https://docs.astro.build/en/reference/experimental-flags/content-intellisense/
    contentIntellisense: true,
    // Enable SVGO optimization for SVG assets
    // https://docs.astro.build/en/reference/experimental-flags/svg-optimization/
    svgo: true
  }
})
