import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { UiButton } from './button';
import { renderSnippet } from '../../component-meta/snippet-story';

const meta: Meta = {
  title: 'Components/Button',
  component: 'ui-button',
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: { variant: 'primary', disabled: false, label: 'Simpan' },
  render: ({ variant, disabled, label }) => {
    const el = document.createElement('ui-button') as UiButton;
    if (variant) el.setAttribute('variant', variant);
    if (disabled) el.setAttribute('disabled', '');
    el.textContent = label ?? '';
    return el;
  },
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Disabled: Story = { args: { disabled: true } };

export const Snippet: Story = {
  render: (_args, context) => renderSnippet('ui-button', context.globals),
};
