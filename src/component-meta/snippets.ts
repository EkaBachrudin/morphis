import type { ComponentDoc } from './model';

export type Framework = 'native' | 'twig' | 'react' | 'vue' | 'angular';

export const FRAMEWORKS: { value: Framework; label: string; language: string }[] = [
  { value: 'native', label: 'Native HTML', language: 'html' },
  { value: 'twig', label: 'Twig (Drupal)', language: 'twig' },
  { value: 'react', label: 'React', language: 'jsx' },
  { value: 'vue', label: 'Vue', language: 'vue' },
  { value: 'angular', label: 'Angular', language: 'html' },
];

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? line : pad + line))
    .join('\n');
}

export function snippetFor(doc: ComponentDoc, framework: Framework): string {
  const markup = doc.markup;

  switch (framework) {
    case 'twig':
      return `{{ attach_library('mytheme/morphis') }}\n\n${markup}`;
    case 'react':
      return [
        `import '@morphis/components';`,
        `import '@morphis/components/tokens.css';`,
        '',
        'export function Example() {',
        '  return (',
        indent(markup, 4),
        '  );',
        '}',
      ].join('\n');
    case 'vue':
      return [
        '<script setup lang="ts">',
        `import '@morphis/components';`,
        `import '@morphis/components/tokens.css';`,
        '</script>',
        '',
        '<template>',
        indent(markup, 2),
        '</template>',
      ].join('\n');
    case 'angular': {
      const lines = [
        `import '@morphis/components';`,
        `import '@morphis/components/tokens.css';`,
        '',
        '// app.module.ts (atau standalone component)',
        '// schemas: [CUSTOM_ELEMENTS_SCHEMA]',
      ];
      if (doc.events.length > 0) {
        lines.push(
          '',
          '// template: contoh binding event',
          `// (${doc.events[0].name})="onEvent($event)"`,
        );
      }
      lines.push('', '// template', markup);
      return lines.join('\n');
    }
    case 'native':
    default:
      return markup;
  }
}
