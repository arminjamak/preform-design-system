import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect } from 'react';
import '../src/styles/base.css';
import './preview.css';

/** Applies the selected theme to <html data-theme> so every semantic token flips. */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'light';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <Story />;
};

/** Wraps the story in a surface chosen from the toolbar so components can be seen on canvas, surface, panel or inverse. */
const withSurface: Decorator = (Story, context) => {
  const surface = context.globals.surface ?? 'panel';
  return (
    <div className="sb-surface" data-surface={surface}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withSurface, withTheme],
  globalTypes: {
    theme: {
      description: 'Colour theme (sets data-theme on <html>)',
      toolbar: { title: 'Theme', icon: 'mirror', items: [{ value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }], dynamicTitle: true },
    },
    surface: {
      description: 'Background surface token behind the story',
      toolbar: {
        title: 'Surface',
        icon: 'photo',
        items: [
          { value: 'canvas', title: 'bg.canvas' },
          { value: 'surface', title: 'bg.surface' },
          { value: 'panel', title: 'bg.panel' },
          { value: 'inverse', title: 'bg.inverse' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', surface: 'panel' },
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
    controls: { expanded: true, sort: 'requiredFirst' },
    docs: { codePanel: true },
    options: {
      storySort: {
        order: ['Introduction', 'Coverage', 'Foundations', ['Colors', 'Typography', 'Spacing & Sizing', 'Radius & Borders', 'Elevation', 'Motion', 'Tokens'], 'Components', ['Actions', 'Inputs', 'Navigation', 'Feedback', 'Layout', 'Data Display', 'Overlays', 'Media', 'Charts', 'Collaboration', 'Interaction', 'Specialized'], 'Patterns'],
      },
    },
  },
};

export default preview;
