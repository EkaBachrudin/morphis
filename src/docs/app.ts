import '../index';
import './app.css';
import { listComponents, type ComponentDoc } from './model';
import { applyControls, controlsFor, syncControlsFromMarkup, type Control } from './controls';
import { FRAMEWORKS, snippetFor, type Framework } from './snippets';
import type { UiSelect } from '../components/select/select';

const components = listComponents();
let activeTag = components[0]?.tag ?? '';
let framework: Framework = 'native';
let controls: Control[] = [];

const app = document.getElementById('app');
if (!app) throw new Error('#app tidak ditemukan');

const LAYOUT = `
  <aside class="sidebar">
    <div class="brand"><span class="brand-mark">M</span> Morphis</div>
    <div class="sidebar-label">Komponen</div>
    <ui-select id="fw" aria-label="Snippet framework"></ui-select>
    <nav class="nav" id="nav"></nav>
    <div class="sidebar-foot">
      <a class="sidebar-link" href="http://localhost:6006" target="_blank" rel="noreferrer">Storybook ↗</a>
      <span class="muted">Detail &amp; panduan lengkap ada di Storybook.</span>
    </div>
  </aside>
  <main class="content" id="content"></main>
`;

app.innerHTML = LAYOUT;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tagFromHash(): string {
  const tag = location.hash.replace(/^#\/?/, '');
  return components.some((c) => c.tag === tag) ? tag : components[0]?.tag ?? '';
}

function activeDoc(): ComponentDoc | undefined {
  return components.find((c) => c.tag === activeTag) ?? components[0];
}

function frameworkLabel(): string {
  return FRAMEWORKS.find((f) => f.value === framework)?.label ?? framework;
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '<p class="muted">—</p>';
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table class="api-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function code(value: string | undefined): string {
  return value ? `<code>${escapeHtml(value)}</code>` : '';
}

function apiSections(doc: ComponentDoc): string {
  const attrs = table(
    ['Nama', 'Tipe', 'Default', 'Deskripsi'],
    doc.attrs.map((a) => [code(a.name), code(a.type), code(a.default), escapeHtml(a.description ?? '')]),
  );
  const events = table(
    ['Nama', 'Tipe', 'Deskripsi'],
    doc.events.map((e) => [code(e.name), code(e.type), escapeHtml(e.description ?? '')]),
  );
  const slots = table(
    ['Nama', 'Deskripsi'],
    doc.slots.map((s) => [code(s.name), escapeHtml(s.description ?? '')]),
  );
  const parts = table(
    ['Nama', 'Deskripsi'],
    doc.parts.map((p) => [code(p.name), escapeHtml(p.description ?? '')]),
  );
  const cssProps = table(
    ['Custom property', 'Default', 'Deskripsi'],
    doc.cssProps.map((c) => [code(c.name), code(c.default), escapeHtml(c.description ?? '')]),
  );

  return [
    `<section class="panel"><div class="panel-head">Attributes</div>${attrs}</section>`,
    `<section class="panel"><div class="panel-head">Events</div>${events}</section>`,
    `<section class="panel"><div class="panel-head">Slots</div>${slots}</section>`,
    `<section class="panel"><div class="panel-head">CSS Parts</div>${parts}</section>`,
    `<section class="panel"><div class="panel-head">CSS Custom Properties</div>${cssProps}</section>`,
  ].join('');
}

function renderNav(): void {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.innerHTML = '';
  for (const component of components) {
    const link = document.createElement('a');
    link.href = `#/${component.tag}`;
    link.className = `nav-item${component.tag === activeTag ? ' is-active' : ''}`;
    link.innerHTML = `<span>${escapeHtml(component.name)}</span><code>${escapeHtml(component.tag)}</code>`;
    nav.append(link);
  }
}

function renderFrameworkSelect(): void {
  const select = document.getElementById('fw') as UiSelect | null;
  if (!select) return;
  select.options = FRAMEWORKS.map((item) => ({ value: item.value, label: item.label }));
  select.value = framework;
  select.addEventListener('ui-change', (event) => {
    framework = (event as CustomEvent<{ value: Framework }>).detail.value;
    renderSnippet();
  });
}

function renderPreview(): void {
  const preview = document.getElementById('preview');
  const doc = activeDoc();
  if (!preview || !doc) return;
  preview.innerHTML = '';
  const template = document.createElement('template');
  template.innerHTML = doc.markup;
  const node = template.content.firstElementChild as HTMLElement | null;
  if (node) {
    applyControls(node, controls);
    preview.append(node);
  }
}

function renderControls(): void {
  const box = document.getElementById('controls');
  if (!box) return;
  box.innerHTML = '';
  if (controls.length === 0) {
    box.innerHTML = '<span class="muted">Tidak ada atribut.</span>';
    return;
  }
  for (const control of controls) {
    const row = document.createElement('label');
    row.className = 'control';
    const name = document.createElement('span');
    name.className = 'control-name';
    name.textContent = control.name;
    row.append(name);

    if (control.kind === 'select') {
      const select = document.createElement('select');
      for (const option of control.options ?? []) {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        if (option === control.value) opt.selected = true;
        select.append(opt);
      }
      select.addEventListener('change', () => {
        control.value = select.value;
        renderPreview();
      });
      row.append(select);
    } else if (control.kind === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(control.value);
      input.addEventListener('change', () => {
        control.value = input.checked;
        renderPreview();
      });
      row.append(input);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = String(control.value);
      input.placeholder = control.name;
      input.addEventListener('input', () => {
        control.value = input.value;
        renderPreview();
      });
      row.append(input);
    }
    box.append(row);
  }
}

function renderSnippet(): void {
  const doc = activeDoc();
  const codeEl = document.getElementById('snippet');
  const label = document.getElementById('snippet-label');
  if (!doc || !codeEl) return;
  if (label) label.textContent = `Snippet — ${frameworkLabel()}`;
  codeEl.textContent = snippetFor(doc, framework);
}

async function copySnippet(): Promise<void> {
  const doc = activeDoc();
  if (!doc) return;
  const text = snippetFor(doc, framework);
  const button = document.getElementById('copy');
  try {
    await navigator.clipboard.writeText(text);
    if (button) button.textContent = 'Copied!';
  } catch {
    if (button) button.textContent = 'Copy gagal';
  }
  setTimeout(() => {
    if (button) button.textContent = 'Copy';
  }, 1500);
}

function renderContent(): void {
  const doc = activeDoc();
  const content = document.getElementById('content');
  if (!doc || !content) return;

  controls = controlsFor(doc.attrs);
  syncControlsFromMarkup(controls, doc.markup);

  content.innerHTML = `
    <header class="doc-head">
      <div class="doc-title">
        <h1>${escapeHtml(doc.tag)}</h1>
        <code class="class-name">${escapeHtml(doc.className)}</code>
      </div>
      <p class="doc-desc">${escapeHtml(doc.description)}</p>
    </header>

    <section class="panel">
      <div class="panel-head">Preview</div>
      <div class="preview" id="preview"></div>
    </section>

    <section class="panel">
      <div class="panel-head">Kontrol</div>
      <div class="controls" id="controls"></div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <span id="snippet-label">Snippet — ${escapeHtml(frameworkLabel())}</span>
        <button class="copy" id="copy" type="button">Copy</button>
      </div>
      <pre class="snippet"><code id="snippet"></code></pre>
    </section>

    ${apiSections(doc)}
  `;

  renderPreview();
  renderControls();
  renderSnippet();
  document.getElementById('copy')?.addEventListener('click', copySnippet);
}

function route(): void {
  activeTag = tagFromHash();
  if (components.length > 0 && location.hash !== `#/${activeTag}`) {
    history.replaceState(null, '', `#/${activeTag}`);
  }
  renderNav();
  renderContent();
}

window.addEventListener('hashchange', route);
renderFrameworkSelect();
route();
