import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { ConsentPreferencesDialog, CookieConsent, DEFAULT_CONSENT_CATEGORIES } from '../components/CookieConsent/CookieConsent';
import { Button } from '../components/Button/Button';

const frame: CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: 'var(--size-layout-dialog-lg)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-canvas)',
};

const meta = {
  title: 'Components/Overlays/CookieConsent',
  component: CookieConsent,
  tags: ['expanded'],
  args: {
    open: true,
    onSave: fn(),
    categories: DEFAULT_CONSENT_CATEGORIES,
    value: { necessary: true, analytics: true, marketing: false },
    title: 'Cookies on Formlabs Dashboard',
    policyHref: '#cookie-policy',
    policyLabel: 'Cookie policy',
    acceptLabel: 'Accept all',
    rejectLabel: 'Reject all',
    customizeLabel: 'Customize',
    defaultCustomizing: false,
    inline: true,
  },
  argTypes: {
    categories: { control: 'object' },
    value: { control: 'object' },
    message: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cookie consent banner (bottom of the viewport, `--z-index-toast`) with Accept all / Reject all / Customize. Customize opens `ConsentPreferencesDialog`: one Toggle per category with a description, Strictly necessary locked on. Every choice calls `onSave(preferences, source)`. Surfaces use `--color-bg-surface` and `--elevation-modal`; the dialog traps focus and closes on Escape.',
      },
    },
  },
  render: function Render(args) {
    const [{ open }, update] = useArgs();
    return (
      <div style={frame}>
        {!open && (
          <div style={{ margin: 'auto' }}>
            <Button variant="outline" onClick={() => update({ open: true })}>
              Show consent banner again
            </Button>
          </div>
        )}
        <CookieConsent
          {...args}
          open={open}
          onSave={(prefs, source) => {
            args.onSave(prefs, source);
            update({ open: false, value: prefs });
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof CookieConsent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Customizing: Story = { args: { defaultCustomizing: true } };

export const PreferencesDialog: Story = {
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const [{ open, value }, update] = useArgs();
    return (
      <div style={{ ...frame, justifyContent: 'center' }}>
        {!open && (
          <div style={{ margin: 'auto' }}>
            <Button variant="outline" onClick={() => update({ open: true })}>
              Privacy settings
            </Button>
          </div>
        )}
        <ConsentPreferencesDialog
          open={open}
          inline
          value={value}
          onRequestClose={() => update({ open: false })}
          onSave={(prefs, source) => {
            args.onSave(prefs, source);
            update({ open: false, value: prefs });
          }}
        />
      </div>
    );
  },
};

export const CustomCategories: Story = {
  args: {
    title: 'Help us improve PreForm',
    message: 'Choose what PreForm may share with Formlabs. Print files never leave your computer unless you upload them.',
    policyHref: undefined,
    categories: [
      { id: 'necessary', label: 'Licensing and updates', description: 'Checks your licence and notifies you about new PreForm releases.', required: true },
      { id: 'analytics', label: 'Usage analytics', description: 'Which tools you use and how long slicing takes, never model geometry.' },
      { id: 'crash', label: 'Crash reports', description: 'Sends a stack trace and system info when PreForm closes unexpectedly.' },
    ],
    value: { necessary: true, analytics: false, crash: true },
  },
};
