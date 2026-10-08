import '../components/button/button';
import '../components/input/input';
import '../components/card/card';

import type { UiButton } from '../components/button/button';
import type { UiInput } from '../components/input/input';
import type { UiCard } from '../components/card/card';
import { createComponent } from './create-component';

export { createComponent } from './create-component';
export type { MorphisProps, MorphisEventHandler } from './create-component';

export const Button = createComponent<UiButton>('ui-button');
export const Input = createComponent<UiInput>('ui-input');
export const Card = createComponent<UiCard>('ui-card');
