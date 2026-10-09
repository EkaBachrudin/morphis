import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Button, Input, Card } from '@morphis/react';

describe('React wrapper', () => {
  it('renders ui-button and applies props as attributes', () => {
    const { container } = render(<Button variant="secondary">Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    expect(el.getAttribute('variant')).toBe('secondary');
    expect(el.shadowRoot?.querySelector('.ui-button--secondary')).not.toBeNull();
  });

  it('binds the custom ui-click event', () => {
    const onClick = vi.fn();
    const { container } = render(<Button onUiClick={onClick}>Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    el.shadowRoot?.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('removes attributes when boolean props become false', () => {
    const { container, rerender } = render(<Button disabled>Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    expect(el.hasAttribute('disabled')).toBe(true);
    rerender(<Button disabled={false}>Hi</Button>);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('sets the value property on ui-input', () => {
    const { container } = render(<Input value="halo" label="Nama" />);
    const el = container.querySelector('ui-input') as HTMLElement;
    expect(el.shadowRoot?.querySelector('input')?.value).toBe('halo');
    expect(el.shadowRoot?.querySelector('.ui-field__label')?.textContent?.trim()).toBe('Nama');
  });

  it('renders ui-card with slotted content', () => {
    const { container } = render(
      <Card variant="outlined">
        <span slot="header">Judul</span>
        Isi
      </Card>,
    );
    const el = container.querySelector('ui-card') as HTMLElement;
    expect(el.getAttribute('variant')).toBe('outlined');
    expect(el.querySelector('[slot="header"]')?.textContent).toBe('Judul');
  });
});
