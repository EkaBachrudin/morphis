import { Source } from '@storybook/addon-docs/blocks';
import { useGlobals } from 'storybook/preview-api';
import { findComponent } from '../../src/docs/model';
import { FRAMEWORKS, snippetFor, type Framework } from '../../src/docs/snippets';

/**
 * Blok docs yang menampilkan snippet contoh sesuai pilihan toolbar "Framework".
 * Dipakai di MDX: <FrameworkSnippet tag="ui-button" />
 */
export function FrameworkSnippet({ tag }: { tag: string }) {
  const [globals] = useGlobals();
  const framework = (globals.framework as Framework) ?? 'native';
  const doc = findComponent(tag);

  if (!doc) {
    return <p>Komponen {tag} tidak ditemukan di custom-elements.json.</p>;
  }

  const language = FRAMEWORKS.find((item) => item.value === framework)?.language ?? 'html';
  return <Source code={snippetFor(doc, framework)} language={language} />;
}

export default FrameworkSnippet;
