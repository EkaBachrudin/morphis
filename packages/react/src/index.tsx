import '@eka-morphis/button';
import '@eka-morphis/input';
import '@eka-morphis/card';

import type { UiButton } from '@eka-morphis/button';
import type { UiInput } from '@eka-morphis/input';
import type { UiCard } from '@eka-morphis/card';
import { createComponent } from './create-component';

export { createComponent } from './create-component';
export type { MorphisProps, MorphisEventHandler } from './create-component';

export const Button = createComponent<UiButton>('ui-button');
export const Input = createComponent<UiInput>('ui-input');
export const Card = createComponent<UiCard>('ui-card');
