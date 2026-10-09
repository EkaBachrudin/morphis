import rawManifest from '../../custom-elements.json';

const markups = import.meta.glob('../../packages/components/*/src/*.markup.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface AttrDoc {
  name: string;
  type?: string;
  default?: string;
  description?: string;
}

export interface EventDoc {
  name: string;
  type?: string;
  description?: string;
}

export interface SlotDoc {
  name: string;
  description?: string;
}

export interface PartDoc {
  name: string;
  description?: string;
}

export interface CssPropDoc {
  name: string;
  default?: string;
  description?: string;
}

export interface ComponentDoc {
  tag: string;
  name: string;
  className: string;
  description: string;
  attrs: AttrDoc[];
  events: EventDoc[];
  slots: SlotDoc[];
  parts: PartDoc[];
  cssProps: CssPropDoc[];
  markup: string;
  source: string;
}

interface CemDeclaration {
  kind?: string;
  customElement?: boolean;
  tagName?: string;
  description?: string;
  attributes?: { name: string; type?: { text?: string }; default?: string; description?: string }[];
  events?: { name: string; type?: { text?: string }; description?: string }[];
  slots?: { name?: string; description?: string }[];
  cssParts?: { name: string; description?: string }[];
  cssProperties?: { name: string; default?: string; description?: string }[];
}

interface CemModule {
  path?: string;
  declarations?: CemDeclaration[];
}

function pascalCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function stripComment(html: string): string {
  return html.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim();
}

function markupFor(dir: string): string {
  const suffix = `/components/${dir}/src/${dir}.markup.html`;
  const key = Object.keys(markups).find((k) => k.endsWith(suffix));
  return key ? stripComment(markups[key]) : '';
}

export function listComponents(): ComponentDoc[] {
  const manifest = rawManifest as unknown as { modules?: CemModule[] };
  const docs: ComponentDoc[] = [];

  for (const module of manifest.modules ?? []) {
    for (const declaration of module.declarations ?? []) {
      if (!declaration.customElement || !declaration.tagName) continue;
      const tag = declaration.tagName;
      const dir = tag.replace(/^ui-/, '');
      const source = module.path ?? '';

      docs.push({
        tag,
        name: pascalCase(dir),
        className: `Ui${pascalCase(dir)}`,
        description: (declaration.description ?? '').trim(),
        attrs: (declaration.attributes ?? []).map((a) => ({
          name: a.name,
          type: a.type?.text,
          default: a.default,
          description: a.description,
        })),
        events: (declaration.events ?? []).map((e) => ({
          name: e.name,
          type: e.type?.text,
          description: e.description,
        })),
        slots: (declaration.slots ?? []).map((s) => ({
          name: s.name || '(default)',
          description: s.description,
        })),
        parts: (declaration.cssParts ?? []).map((p) => ({
          name: p.name,
          description: p.description,
        })),
        cssProps: (declaration.cssProperties ?? []).map((c) => ({
          name: c.name,
          default: c.default,
          description: c.description,
        })),
        markup: markupFor(dir),
        source,
      });
    }
  }

  return docs.sort((a, b) => a.name.localeCompare(b.name));
}

export function findComponent(tag: string): ComponentDoc | undefined {
  return listComponents().find((c) => c.tag === tag);
}
