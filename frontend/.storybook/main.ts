import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/!(__screenshots__)/**/*.stories.@(ts|tsx)'],
  staticDirs: [
    { from: '../../docs/referencia/08-mockup-anterior/images', to: 'images' },
    { from: '../public', to: '' },
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
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
    '@storybook/addon-vitest',
    'msw-storybook-addon',
  ],
  features: { componentsManifest: true, experimentalReview: true },
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: { reactDocgen: 'react-docgen-typescript' },
  core: { disableTelemetry: true },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());

    const hmr = typeof config.server?.hmr === 'object' ? config.server.hmr : {};
    const hmrOverrides: { clientPort?: number; protocol?: 'ws' | 'wss' } = {};

    if (process.env.STORYBOOK_BASE) {
      config.base = process.env.STORYBOOK_BASE;

      const port = Number(process.env.STORYBOOK_HMR_PORT);
      if (Number.isFinite(port)) {
        hmrOverrides.clientPort = port;
      }

      const protocol = process.env.STORYBOOK_HMR_PROTOCOL;
      if (protocol === 'ws' || protocol === 'wss') {
        hmrOverrides.protocol = protocol;
      }
    }

    config.server = {
      ...config.server,
      allowedHosts: true,
      hmr: { ...hmr, ...hmrOverrides },
    };
    return config;
  },
};

export default config;
