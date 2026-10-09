import '@morphis/button';
import '@morphis/input';
import '@morphis/card';

import type { UiButton } from '@morphis/button';
import type { UiInput } from '@morphis/input';
import type { UiCard } from '@morphis/card';
import { createComponent } from './create-component';

export { createComponent } from './create-component';
export type { MorphisProps, MorphisEventHandler } from './create-component';

export const Button = createComponent<UiButton>('ui-button');
export const Input = createComponent<UiInput>('ui-input');
export const Card = createComponent<UiCard>('ui-card');
