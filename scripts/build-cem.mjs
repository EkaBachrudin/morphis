/**
 * Menghasilkan `custom-elements.json` memakai @lit-labs/analyzer (Lit-native).
 *
 * Menggantikan @custom-elements-manifest/analyzer agar tooling tidak lagi
 * menyeret `globby`/`chokidar` (dan transitifnya `micromatch`/`braces`).
 *
 * Analyzer ini memakai TypeScript compiler API + parse5 (tanpa braces).
 * Program TS dibangun dari tsconfig.json root (punya `paths` ke `@morphis/core`
 * dan tiap paket komponen), lalu modul komponen disaring dan path-nya
 * dinormalisasi relatif ke root repo agar kompatibel dengan manifest lama.
 */
import { createPackageAnalyzer } from '@lit-labs/analyzer/package-analyzer.js';
import { generateManifest } from '@lit-labs/gen-manifest';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const toPosix = (p) => p.split(sep).join('/');

// Sumber komponen: packages/components/<name>/src/<file>.ts,
// mengecualikan stories & test (sama seperti config CEM sebelumnya).
const isComponentSource = (file) =>
  /[/\\]packages[/\\]components[/\\][^/\\]+[/\\]src[/\\][^/\\]+\.ts$/.test(file) &&
  !/\.(stories|test)\.ts$/.test(file);

// Tag nama elemen diambil dari JSDoc `@element <tag>` (konvensi yang sudah
// dipakai di sumber komponen). Analyzer Lit mengenali `@customElement`/
// `customElements.define`, sedangkan proyek ini memakai helper `define()`.
const elementTag = (source) => source.match(/@element\s+([\w-]+)/)?.[1];

const analyzer = createPackageAnalyzer(resolve(root, 'tsconfig.cem.json'));

const modules = [];
for (const fileName of analyzer.program.getRootFileNames()) {
  const normalized = analyzer.path.normalize(fileName);
  if (!isComponentSource(normalized)) continue;

  const model = analyzer.getModule(normalized);

  // Generate per modul lalu set path relatif ke root repo (analyzer menghasilkan
  // path relatif terhadap root paket komponen).
  const tree = await generateManifest({ modules: [model] });
  const [mod] = JSON.parse(tree['custom-elements.json']).modules;

  const tag = elementTag(readFileSync(normalized, 'utf8'));
  mod.declarations = (mod.declarations ?? []).filter((decl) => {
    if (!decl.customElement || tag === undefined) return false;
    decl.tagName = tag;

    // Normalisasi default slot: analyzer Lit membaca `@slot - desc` sebagai
    // nama "-", sedangkan manifest lama memakai "" untuk slot default.
    for (const slot of decl.slots ?? []) {
      if (slot.name === '-') slot.name = '';
    }

    // Buang member internal Lit agar sama seperti manifest lama (open-wc CEM
    // mengecualikan render/lifecycle/static styles).
    const internalMembers = new Set([
      'render',
      'connectedCallback',
      'disconnectedCallback',
      'firstUpdated',
      'updated',
      'willUpdate',
      'update',
      'shouldUpdate',
      'createRenderRoot',
      'adoptStyles',
      'constructor',
    ]);
    decl.members = (decl.members ?? []).filter(
      (m) => !(internalMembers.has(m.name) || (m.static && m.name === 'styles')),
    );

    // Rekonstruksi `attributes` dari members: gen-manifest menyusutkannya
    // menjadi typeOption (mis. "string") tanpa description/default, sedangkan
    // data lengkap ada di member field-nya.
    decl.attributes = (decl.members ?? [])
      .filter((m) => m.kind === 'field' && m.attribute)
      .map((m) => ({
        name: m.attribute,
        type: m.type ? { text: m.type.text } : undefined,
        default: m.default,
        description: m.description,
        fieldName: m.name,
      }));

    // Event tanpa tipe eksplisit: samakan dengan manifest lama (tanpa `type`).
    for (const event of decl.events ?? []) {
      if (event.type?.text === 'Event' && event.type.references === undefined) {
        delete event.type;
      }
    }

    return true;
  });

  mod.path = toPosix(relative(root, normalized));
  modules.push(mod);
}

for (const diagnostic of analyzer.getDiagnostics()) {
  const text =
    typeof diagnostic.messageText === 'string'
      ? diagnostic.messageText
      : diagnostic.messageText.messageText;
  // Import bertanda `?inline` adalah sufiks Vite, bukan modul filesystem —
  // abaikan peringatan resolusi untuknya.
  if (text.includes('Could not resolve specifier') && text.includes('?inline')) {
    continue;
  }
  console.warn(`build-cem: ${text}`);
}

const manifest = { schemaVersion: '1.0.0', modules };

writeFileSync(
  resolve(root, 'custom-elements.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `build-cem: custom-elements.json (${manifest.modules.length} modul) via @lit-labs/analyzer`,
);
