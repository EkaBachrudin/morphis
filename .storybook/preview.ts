import { setCustomElementsManifest } from '@storybook/web-components';
import manifest from '../custom-elements.json';
import '../packages/components/src/index';
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
        { value: 'twig', title: 'Twig (Drupal)' },
        { value: 'react', title: 'React' },
        { value: 'vue', title: 'Vue' },
        { value: 'angular', title: 'Angular' },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  framework: 'native',
};
