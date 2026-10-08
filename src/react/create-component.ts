import {
  createElement,
  forwardRef,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ForwardedRef,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type ReactNode,
  type RefAttributes,
} from 'react';

export type MorphisEventHandler = (event: Event) => void;

export interface MorphisProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Atribut komponen + handler event (`onUiClick`, `onUiInput`, ...). */
  [prop: string]: unknown;
}

function eventNameFromProp(prop: string): string {
  return prop
    .slice(2)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function applyProp(el: HTMLElement, key: string, value: unknown): void {
  if (key === 'style') {
    if (value && typeof value === 'object') {
      Object.assign(el.style, value as CSSProperties);
    }
    return;
  }

  if (key === 'className') {
    if (value === undefined || value === null) el.removeAttribute('class');
    else el.setAttribute('class', String(value));
    return;
  }

  if (value === undefined || value === null) {
    el.removeAttribute(key);
    return;
  }

  // Prefer the property when the custom element exposes it (value, variant,
  // disabled, ...); fall back to an attribute otherwise.
  if (key in el && !key.startsWith('aria-') && !key.startsWith('data-')) {
    try {
      (el as unknown as Record<string, unknown>)[key] = value;
      return;
    } catch {
      /* fall through to attribute assignment */
    }
  }

  if (value === false) {
    el.removeAttribute(key);
    return;
  }
  if (value === true) {
    el.setAttribute(key, '');
    return;
  }
  el.setAttribute(key, String(value));
}

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * Membuat komponen React tipis yang membungkus custom element.
 * Props diteruskan sebagai property/atribut; handler `on<Event>` di-bind lewat
 * `addEventListener` sehingga berfungsi di React <19.
 */
export function createComponent<T extends HTMLElement>(
  tagName: string,
): ForwardRefExoticComponent<PropsWithoutRef<MorphisProps> & RefAttributes<T>> {
  const Wrapper = forwardRef<T, MorphisProps>(function MorphisWrapper(props, forwardedRef) {
    const { children, ...rest } = props;
    const innerRef = useRef<T | null>(null);

    const attributeEntries: [string, unknown][] = [];
    const eventEntries: [string, MorphisEventHandler][] = [];

    for (const [key, value] of Object.entries(rest)) {
      if (/^on[A-Z]/.test(key) && typeof value === 'function') {
        eventEntries.push([eventNameFromProp(key), value as MorphisEventHandler]);
      } else {
        attributeEntries.push([key, value]);
      }
    }

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      for (const [key, value] of attributeEntries) applyProp(el, key, value);
    });

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      const cleanups = eventEntries.map(([name, handler]) => {
        el.addEventListener(name, handler);
        return () => el.removeEventListener(name, handler);
      });
      return () => {
        for (const cleanup of cleanups) cleanup();
      };
    });

    return createElement(
      tagName,
      {
        ref: (node: T | null) => {
          innerRef.current = node;
          setForwardedRef(forwardedRef, node);
        },
      },
      children as ReactNode,
    );
  });

  Wrapper.displayName = `Morphis(${tagName})`;
  return Wrapper;
}
