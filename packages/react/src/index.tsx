import '@eka-morphis/button';
import '@eka-morphis/input';
import '@eka-morphis/card';
import '@eka-morphis/select';
import '@eka-morphis/other-offer';

import type { UiButton } from '@eka-morphis/button';
import type { UiInput } from '@eka-morphis/input';
import type { UiCard } from '@eka-morphis/card';
import type { UiSelect } from '@eka-morphis/select';
import type { UiOtherOffer } from '@eka-morphis/other-offer';
import { createComponent } from './create-component';

export { createComponent } from './create-component';
export type { MorphisProps, MorphisEventHandler } from './create-component';

export const Button = createComponent<UiButton>('ui-button');
export const Input = createComponent<UiInput>('ui-input');
export const Card = createComponent<UiCard>('ui-card');
export const Select = createComponent<UiSelect>('ui-select');
export const OtherOffer = createComponent<UiOtherOffer>('ui-other-offer');
