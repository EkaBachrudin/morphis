import { setCustomElementsManifest } from '@storybook/web-components';
import manifest from '../custom-elements.json';
import '../packages/components/button/src/button';
import '../packages/components/card/src/card';
import '../packages/components/input/src/input';
import '../packages/components/other-offer/src/other-offer';
import '../packages/components/select/src/select';
import '../packages/tokens/dist/tokens.css';

setCustomElementsManifest(manifest);

export const globalTypes = {
  framework: {
    description: 'Bahasa snippet contoh penggunaan',
    toolbar: {
      title: 'Framework',
      icon: 'code',
      items: [
        { value: 'native', title: 'Native HTML' },
        { value: 'angular', title: 'Angular' },
        { value: 'react', title: 'React' },
        { value: 'vue', title: 'Vue' },
        { value: 'twig', title: 'Twig (Drupal)' },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  framework: 'native',
};

export const parameters = {
  options: {
    storySort: {
      order: [
        'Panduan',
        ['Mulai', 'Paket Baru', 'Publikasi', 'Theming', 'Integrasi Drupal', 'Framework', 'Accessibility'],
        'Components',
      ],
    },
  },
};
