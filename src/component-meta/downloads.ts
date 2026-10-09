export interface DownloadItem {
  label: string;
  file: string;
  href: string;
  minified: boolean;
}

export interface BundleDownload {
  label: string;
  file: string;
  href: string;
}

const BASE = '/downloads';

export function componentSlug(tag: string): string {
  return tag.replace(/^ui-/, '');
}

export function downloadsFor(tag: string): DownloadItem[] {
  const name = componentSlug(tag);
  const base = `${BASE}/${name}`;

  const item = (label: string, file: string, minified = false): DownloadItem => ({
    label,
    file,
    href: `${base}/${file}`,
    minified,
  });

  return [
    item('index.html', 'index.html'),
    item('index.min.html', 'index.min.html', true),
    item('tokens.css', 'tokens.css'),
    item('tokens.min.css', 'tokens.min.css', true),
    item(`${name}.iife.js`, `${name}.iife.js`),
    item(`${name}.iife.min.js`, `${name}.iife.min.js`, true),
  ];
}

export function bundleDownloadFor(tag: string): BundleDownload {
  const name = componentSlug(tag);
  const file = `${name}.zip`;
  return {
    label: 'Unduh semua (.zip)',
    file,
    href: `${BASE}/${name}/${file}`,
  };
}
