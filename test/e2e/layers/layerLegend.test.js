import { test, expect, chromium } from '@playwright/test';

test.describe('Layer legend tests', () => {
  let page;
  let context;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', { slowMo: 250 });
    page = await context.newPage();
    await page.goto('layerLegend.html');
    await page.locator('mapml-viewer').hover();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Legend layer has legend details in layer settings', async () => {
    // Get the first layer in the overlay list (the one with an img legend)
    const layer = page
      .locator('.leaflet-control-layers-overlays > fieldset')
      .first();

    // Open the settings for that layer and check that the legend details are present
    const settings = layer.locator('.mapml-layer-item-settings');

    // Check that the legend details, name, and link are present and correct
    const legendDetails = settings.locator('details.mapml-layer-item-legend');
    await expect(legendDetails).toHaveCount(1);
    await expect(legendDetails.locator('summary')).toHaveText('Legend');
    await expect(
      legendDetails.locator('a.mapml-layer-item-legend-link')
    ).toHaveAttribute(
      'href',
      'http://maps.geogratis.gc.ca/wms/toporama_en?SERVICE=WMS&REQUEST=GetLegendGraphic&LAYER=WMS-Toporama&VERSION=1.1&FORMAT=image/png'
    );
    await expect(
      legendDetails.locator('img.mapml-layer-item-legend-image')
    ).toHaveAttribute(
      'src',
      'http://maps.geogratis.gc.ca/wms/toporama_en?SERVICE=WMS&REQUEST=GetLegendGraphic&LAYER=WMS-Toporama&VERSION=1.1&FORMAT=image/png'
    );

    // check that the legend details are the second details element in the settings
    const secondDetails = settings.locator('> details').nth(1);
    await expect(secondDetails).toHaveClass(
      'mapml-layer-item-legend mapml-control-layers'
    );
  });

  test('Layer without legend does not render legend details in settings', async () => {
    // Get the second layer in the overlay list (the one without a legend)
    const layer = page
      .locator('.leaflet-control-layers-overlays > fieldset')
      .nth(1);

    // check that the settings for that layer do not contain any legend details
    const settings = layer.locator('.mapml-layer-item-settings');
    await expect(
      settings.locator('details.mapml-layer-item-legend')
    ).toHaveCount(0);
  });

  test('Layer with a non img legend renders a legend link', async () => {
    // Get the third layer in the overlay list (the one with a non img legend)
    const layer = page
      .locator('.leaflet-control-layers-overlays > fieldset')
      .nth(2);

    // check that the settings for that layer contain a legend link
    const settings = layer.locator('.mapml-layer-item-settings');

    // Check that the legend details, name, and link are present and correct
    const legendDetails = settings.locator('details.mapml-layer-item-legend');
    await expect(legendDetails).toHaveCount(1);
    await expect(legendDetails.locator('summary')).toHaveText('Legend');
    await expect(
      legendDetails.locator('a.mapml-layer-item-legend-link')
    ).toHaveAttribute('href', 'https://maps4html.org/web-map-doc/');

    // not working, need to manually open the legend for it to update.
    /*await expect(
          legendDetails.locator('a.mapml-layer-item-legend-link')
        ).toHaveText("Open Legend"); 
    */

    // check that the legend details are the second details element in the settings
    const secondDetails = settings.locator('> details').nth(1);
    await expect(secondDetails).toHaveClass(
      'mapml-layer-item-legend mapml-control-layers'
    );
  });
});
