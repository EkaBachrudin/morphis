import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { UiCard } from './card';
import { renderSnippet } from '@eka-morphis/component-meta/snippet-story';

const meta: Meta = {
  title: 'Components/Card',
  component: 'ui-card',
  argTypes: {
    variant: { control: 'select', options: ['elevated', 'outlined'] },
    header: { control: 'text' },
    body: { control: 'text' },
    footer: { control: 'text' },
  },
  args: {
    variant: 'elevated',
    header: 'Judul Kartu',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    footer: 'Footer',
  },
  render: ({ variant, header, body, footer }) => {
    const el = document.createElement('ui-card') as UiCard;
    el.setAttribute('variant', variant ?? 'elevated');
    if (header) {
      const h = document.createElement('span');
      h.setAttribute('slot', 'header');
      h.textContent = header;
      el.append(h);
    }
    el.append(document.createTextNode(body ?? ''));
    if (footer) {
      const f = document.createElement('span');
      f.setAttribute('slot', 'footer');
      f.textContent = footer;
      el.append(f);
    }
    return el;
  },
};

export default meta;
type Story = StoryObj;

export const Elevated: Story = {};

export const Outlined: Story = { args: { variant: 'outlined' } };

export const BodyOnly: Story = { args: { header: '', footer: '' } };

export const Snippet: Story = {
  render: (_args, context) => renderSnippet('ui-card', context.globals),
};
