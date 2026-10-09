import { applyStyles } from './sheet';
import { emit } from './emit';

export abstract class MorphisElement extends HTMLElement {
  static styles: string[] = [];
  static template = '';

  protected root: ShadowRoot;
  #listenersAttached = false;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.#listenersAttached) {
      this.#listenersAttached = true;
      this.attachEventListeners?.();
    }
    this.render();
    this.onConnected?.();
  }

  disconnectedCallback(): void {
    this.onDisconnected?.();
  }

  protected render(): void {
    this.renderTemplate();
    applyStyles(this.root, (this.constructor as typeof MorphisElement).styles);
  }

  protected renderTemplate(): void {
    this.root.innerHTML = (this.constructor as typeof MorphisElement).template;
  }

  protected emit<T>(type: string, detail: T): void {
    emit(this, type, detail);
  }

  protected attachEventListeners?(): void;
  protected onConnected?(): void;
  protected onDisconnected?(): void;
}
