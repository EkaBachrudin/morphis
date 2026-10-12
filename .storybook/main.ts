import type { StorybookConfig } from '@storybook/web-components-vite';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import { fileURLToPath } from 'node:url';
import { litTemplate } from '../scripts/vite-plugin-lit-template.mjs';

const root = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|js)',
    '../src/**/*.mdx',
    '../packages/components/*/src/**/*.stories.@(ts|js)',
    '../packages/components/*/src/**/*.mdx',
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@storybook/addon-a11y',
  ],
  staticDirs: [{ from: '../downloads', to: '/downloads' }],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), litTemplate(), tailwindcss()];
    const existing = viteConfig.resolve?.alias;
    const existingAlias = Array.isArray(existing)
      ? existing
      : Object.entries((existing as Record<string, string> | undefined) ?? {}).map(
          ([find, replacement]) => ({ find, replacement }),
        );
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: [
        ...existingAlias,
        { find: /^@eka-morphis\/core$/, replacement: root('packages/core/src/index.ts') },
        { find: /^@eka-morphis\/button$/, replacement: root('packages/components/button/src/button.ts') },
        { find: /^@eka-morphis\/card$/, replacement: root('packages/components/card/src/card.ts') },
        { find: /^@eka-morphis\/input$/, replacement: root('packages/components/input/src/input.ts') },
        { find: /^@eka-morphis\/select$/, replacement: root('packages/components/select/src/select.ts') },
        { find: /^@eka-morphis\/other-offer$/, replacement: root('packages/components/other-offer/src/other-offer.ts') },
        { find: /^@eka-morphis\/react$/, replacement: root('packages/react/src/index.tsx') },
        {
          find: /^@eka-morphis\/component-meta$/,
          replacement: root('src/component-meta/index.ts'),
        },
        {
          find: /^@eka-morphis\/component-meta\/(.*)$/,
          replacement: `${root('src/component-meta')}/$1`,
        },
      ],
    };
    return viteConfig;
  },
};

export default config;
