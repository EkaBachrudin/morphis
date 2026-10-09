import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { UiInput } from './input';
import { renderSnippet } from '@morphis/component-meta/snippet-story';

const meta: Meta = {
  title: 'Components/Input',
  component: 'ui-input',
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    type: 'text',
    label: 'Email',
    placeholder: 'nama@contoh.id',
    value: '',
    disabled: false,
    invalid: false,
  },
  render: ({ type, label, placeholder, value, disabled, invalid }) => {
    const el = document.createElement('ui-input') as UiInput;
    el.setAttribute('type', type ?? 'text');
    el.setAttribute('label', label ?? '');
    el.setAttribute('placeholder', placeholder ?? '');
    if (value) el.setAttribute('value', value);
    if (disabled) el.setAttribute('disabled', '');
    if (invalid) el.setAttribute('invalid', '');
    return el;
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const WithValue: Story = { args: { value: 'halo@morphis.id' } };

export const Invalid: Story = { args: { invalid: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Snippet: Story = {
  render: (_args, context) => renderSnippet('ui-input', context.globals),
};
