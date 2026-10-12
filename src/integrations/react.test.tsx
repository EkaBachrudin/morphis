import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Button, Input, Card } from '@morphis/react';

/** Menunggu siklus update Lit (render async) sebelum assertion DOM. */
async function settle(el: Element): Promise<void> {
  const updatable = el as unknown as { updateComplete?: Promise<unknown> };
  if (updatable.updateComplete) await updatable.updateComplete;
}

describe('React wrapper', () => {
  it('renders ui-button and applies props as attributes', async () => {
    const { container } = render(<Button variant="secondary">Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    await settle(el);
    expect(el.getAttribute('variant')).toBe('secondary');
    expect(el.shadowRoot?.querySelector('.ui-button--secondary')).not.toBeNull();
  });

  it('binds the custom ui-click event', async () => {
    const onClick = vi.fn();
    const { container } = render(<Button onUiClick={onClick}>Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    await settle(el);
    el.shadowRoot?.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('removes attributes when boolean props become false', async () => {
    const { container, rerender } = render(<Button disabled>Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    await settle(el);
    expect(el.hasAttribute('disabled')).toBe(true);
    rerender(<Button disabled={false}>Hi</Button>);
    await settle(el);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('sets the value property on ui-input', async () => {
    const { container } = render(<Input value="halo" label="Nama" />);
    const el = container.querySelector('ui-input') as HTMLElement;
    await settle(el);
    expect(el.shadowRoot?.querySelector('input')?.value).toBe('halo');
    expect(el.shadowRoot?.querySelector('.ui-field__label')?.textContent?.trim()).toBe('Nama');
  });

  it('renders ui-card with slotted content', async () => {
    const { container } = render(
      <Card variant="outlined">
        <span slot="header">Judul</span>
        Isi
      </Card>,
    );
    const el = container.querySelector('ui-card') as HTMLElement;
    await settle(el);
    expect(el.getAttribute('variant')).toBe('outlined');
    expect(el.querySelector('[slot="header"]')?.textContent).toBe('Judul');
  });
});
