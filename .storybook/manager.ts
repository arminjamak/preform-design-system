import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'PreForm Design System',
    brandUrl: 'https://github.com/arminjamak/PreForm-3D-Printing-Interface',
    colorPrimary: '#0a63c9',
    colorSecondary: '#0a63c9',
    appBg: '#f3f4f6',
    appContentBg: '#ffffff',
    appBorderColor: '#d6d9dd',
    appBorderRadius: 6,
    fontBase: '"Figtree", system-ui, sans-serif',
    fontCode: '"JetBrains Mono", ui-monospace, monospace',
    textColor: '#30343a',
    textMutedColor: '#767b82',
    barTextColor: '#767b82',
    barSelectedColor: '#0a63c9',
    barBg: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#d6d9dd',
    inputTextColor: '#30343a',
    inputBorderRadius: 4,
  }),
});
