import { describe, expect, it } from 'vitest';
import { bundleDownloadFor, downloadsFor } from './downloads';
import { renderSnippet } from './snippet-story';

describe('downloadsFor', () => {
  it('menyediakan HTML, CSS, dan JS versi normal + minified', () => {
    const items = downloadsFor('ui-button');
    expect(items.map((item) => item.file)).toEqual([
      'index.html',
      'index.min.html',
      'tokens.css',
      'tokens.min.css',
      'button.iife.js',
      'button.iife.min.js',
    ]);
    expect(items.map((item) => item.href)).toContain('/downloads/button/button.iife.js');
    expect(items.filter((item) => item.minified)).toHaveLength(3);
  });
});

describe('bundleDownloadFor', () => {
  it('menunjuk ke arsip ZIP komponen', () => {
    expect(bundleDownloadFor('ui-button')).toEqual({
      label: 'Unduh semua (.zip)',
      file: 'button.zip',
      href: '/downloads/button/button.zip',
    });
  });
});

describe('renderSnippet', () => {
  it('menampilkan tautan unduh hanya untuk framework native', () => {
    const native = renderSnippet('ui-button', { framework: 'native' });
    expect(native.querySelectorAll('.morphis-downloads__link')).toHaveLength(6);
    expect(native.querySelector('.morphis-downloads__bundle')?.getAttribute('href')).toBe(
      '/downloads/button/button.zip',
    );

    const react = renderSnippet('ui-button', { framework: 'react' });
    expect(react.querySelector('.morphis-downloads')).toBeNull();
  });
});
