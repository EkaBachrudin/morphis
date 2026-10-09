import type { StorybookConfig } from '@storybook/web-components-vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|js)', '../src/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias as Record<string, string> | undefined),
        '@morphis/core': fileURLToPath(
          new URL('../src/core/index.ts', import.meta.url),
        ),
      },
    };
    return viteConfig;
  },
};

export default config;
