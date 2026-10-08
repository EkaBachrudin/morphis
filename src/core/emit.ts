export function emit<T>(host: HTMLElement, type: string, detail: T): void {
  host.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true }),
  );
}
