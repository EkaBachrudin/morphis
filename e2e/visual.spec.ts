import { test, expect } from '@playwright/test';

const scenes = [
  'scene-button-primary',
  'scene-button-secondary',
  'scene-button-disabled',
  'scene-input-default',
  'scene-input-invalid',
  'scene-card-elevated',
  'scene-card-body-only',
  'scene-select',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/scenes.html');
  await page.evaluate(async () => {
    await Promise.all(
      ['ui-button', 'ui-input', 'ui-card'].map((tag) => customElements.whenDefined(tag)),
    );
    await document.fonts.ready;
  });
});

for (const id of scenes) {
  test(`visual regression: ${id}`, async ({ page }) => {
    await expect(page.locator(`#${id}`)).toHaveScreenshot(`${id}.png`);
  });
}
