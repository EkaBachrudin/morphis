import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('components have no accessibility violations', async ({ page }) => {
  await page.goto('/e2e/scenes.html');
  await page.evaluate(async () => {
    await Promise.all(
      ['ui-button', 'ui-input', 'ui-card'].map((tag) => customElements.whenDefined(tag)),
    );
    await document.fonts.ready;
  });

  const results = await new AxeBuilder({ page }).include('#scenes').analyze();

  expect(results.violations).toEqual([]);
});
