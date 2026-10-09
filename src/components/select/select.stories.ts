import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { UiSelect, type SelectOption } from './select';
import { renderSnippet } from '../../component-meta/snippet-story';

const OPTIONS: SelectOption[] = [
  { value: 'native', label: 'Native HTML' },
  { value: 'twig', label: 'Twig (Drupal)' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
];

const meta: Meta = {
  title: 'Components/Select',
  component: 'ui-select',
  argTypes: {
    value: { control: 'select', options: OPTIONS.map((option) => option.value) },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    value: 'native',
    label: 'Framework',
    placeholder: 'Pilih…',
    disabled: false,
  },
  render: ({ value, label, placeholder, disabled }) => {
    const el = document.createElement('ui-select') as UiSelect;
    el.options = OPTIONS;
    if (value) el.setAttribute('value', value);
    if (label) el.setAttribute('label', label);
    if (placeholder) el.setAttribute('placeholder', placeholder);
    if (disabled) el.setAttribute('disabled', '');
    return el;
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Empty: Story = { args: { value: '' } };

export const Disabled: Story = { args: { disabled: true } };

export const Snippet: Story = {
  render: (_args, context) => renderSnippet('ui-select', context.globals),
};
