import { LitElement } from 'lit';
import { emit } from './emit';

/**
 * Base class untuk semua komponen Morphis.
 *
 * Menurunkan {@link LitElement} sehingga komponen mendapatkan reactive
 * properties, binding template `html`, dan siklus update deklaratif; lalu
 * menambahkan helper `emit()` untuk memancarkan `CustomEvent` yang menembus
 * shadow boundary (`bubbles: true, composed: true`).
 */
export abstract class MorphisElement extends LitElement {
  protected emit<T>(type: string, detail: T): void {
    emit(this, type, detail);
  }
}
