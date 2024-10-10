import { test, expect, chromium } from '@playwright/test';

test.describe('Layer Label Tests', () => {
  let page;
  let context;
  test.beforeAll(async function () {
    context = await chromium.launchPersistentContext('');
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    await page.goto('layerLabel.html');
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('Name of unnamed layer is Layer', async () => {
    await page.waitForTimeout(500);
    const label = await page
      .locator('body > mapml-viewer > layer-')
      .evaluate((elem) => elem.label);
    expect(label).toEqual('Layer');
  });

  test('Unnamed layer shows up as Layer in layer control', async () => {
    const text = await page
      .locator('body > mapml-viewer >> css=div > label.mapml-layer-item-toggle')
      .evaluate((text) => text.textContent);
    expect(text).toEqual('Layer');
  });
});
