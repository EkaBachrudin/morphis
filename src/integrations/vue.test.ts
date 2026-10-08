import { describe, it, expect, vi } from 'vitest';
import { createApp, h } from 'vue';
import '../components/button/button';
import '../components/input/input';

describe('Vue integration', () => {
  it('renders ui-button and binds the ui-click event', async () => {
    const onClick = vi.fn();
    const host = document.createElement('div');
    document.body.append(host);

    const app = createApp({
      render: () => h('ui-button', { variant: 'primary', onUiClick: onClick }, () => 'Simpan'),
    });
    app.mount(host);
    await Promise.resolve();

    const el = host.querySelector('ui-button') as HTMLElement;
    expect(el.getAttribute('variant')).toBe('primary');
    expect(el.shadowRoot?.querySelector('.ui-button--primary')).not.toBeNull();

    el.shadowRoot?.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    app.unmount();
    host.remove();
  });

  it('passes attributes to ui-input', async () => {
    const host = document.createElement('div');
    document.body.append(host);

    const app = createApp({
      render: () => h('ui-input', { type: 'email', placeholder: 'a@b.c' }),
    });
    app.mount(host);
    await Promise.resolve();

    const el = host.querySelector('ui-input') as HTMLElement;
    expect(el.getAttribute('type')).toBe('email');
    expect(el.getAttribute('placeholder')).toBe('a@b.c');

    app.unmount();
    host.remove();
  });
});
