import { test, expect, chromium } from '@playwright/test';

//expected topLeft values in the different cs, at the different
//positions the map goes in
let expectedPCRS = [
  { horizontal: -9373489.01871137, vertical: 11303798.154262971 },
  { horizontal: -5059449.140631609, vertical: 10388337.990009308 }
];
let expectedGCRS = [
  { horizontal: -128.07848522325827, vertical: -3.3883427348651636 },
  { horizontal: -131.75138842058425, vertical: 18.07246131233218 }
];
let expectedFirstTileMatrix = [
  { horizontal: 2.57421875, vertical: 2.8515625 },
  { horizontal: 3.0134698275862073, vertical: 2.944773706896552 }
];
let expectedFirstTCRS = [
  { horizontal: 659, vertical: 730 },
  { horizontal: 771.4482758620691, vertical: 753.8620689655173 }
];

let controls = [
  'leaflet-control-zoom leaflet-bar leaflet-control',
  'mapml-reload-button leaflet-bar leaflet-control',
  'leaflet-control-fullscreen leaflet-bar leaflet-control'
];
let options = ['nozoom', 'noreload', 'nofullscreen'];

test.describe('Playwright mapml-viewer Element Tests', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    page = await context.newPage();
    await page.goto('mapml-viewer.html');
  });

  test.afterAll(async function () {
    await context.close();
  });

  test("Ensure attribution control has role='group' aria-label='Map data attribution'", async () => {
    let role = await page.evaluate(
      `document.querySelector('mapml-viewer')._map.attributionControl._container.getAttribute('role')`
    );
    expect(role).toEqual('group');
    let arialabel = await page.evaluate(
      `document.querySelector('mapml-viewer')._map.attributionControl._container.getAttribute('aria-label')`
    );
    expect(arialabel).toEqual('Map data attribution');
  });

  test('Initial map element extent', async () => {
    await page.waitForTimeout(500);
    const extent = await page.$eval('body > mapml-viewer', (map) => map.extent);

    expect(extent.projection).toEqual('CBMTILE');
    expect(extent.zoom).toEqual({ minZoom: 0, maxZoom: 25 });
    expect(extent.topLeft.pcrs).toEqual(expectedPCRS[0]);
    expect(extent.topLeft.gcrs).toEqual(expectedGCRS[0]);
    expect(extent.topLeft.tilematrix[0]).toEqual(expectedFirstTileMatrix[0]);
    expect(extent.topLeft.tcrs[0]).toEqual(expectedFirstTCRS[0]);
  });
  test("Panned and zoomed initial map's extent", async () => {
    await page.$eval('body > mapml-viewer', (map) => map.zoomTo(81, -63, 1));
    await page.waitForTimeout(1000);
    const extent = await page.$eval('body > mapml-viewer', (map) => map.extent);

    expect(extent.zoom).toEqual({ minZoom: 0, maxZoom: 25 });
    expect(extent.topLeft.pcrs).toEqual(expectedPCRS[1]);
    expect(extent.topLeft.gcrs).toEqual(expectedGCRS[1]);
    expect(extent.topLeft.tilematrix[0]).toEqual(expectedFirstTileMatrix[1]);
    expect(extent.topLeft.tcrs[0]).toEqual(expectedFirstTCRS[1]);
  });

  test.describe('Attributes Tests', () => {
    for (let i in controls) {
      test.describe('Controls List ' + options[i] + ' Attribute Tests', () => {
        test(options[i] + ' removes controls', async () => {
          await page.$eval(
            'body > mapml-viewer',
            (layer, context) =>
              layer.setAttribute('controlslist', context.options[context.i]),
            { options: options, i: i }
          );

          let children = await page.$eval(
              'div > div.leaflet-control-container > div.leaflet-top.leaflet-left',
              (div) => div.children
            ),
            found = false;
          for (let [key, value] of Object.entries(children)) {
            if (value.className === controls[i]) found = true;
          }
          expect(found).toEqual(false);
        });
        test("Toggle controls, controls aren't re-enabled", async () => {
          await page.click('body > mapml-viewer', { button: 'right' });
          await page.click('div > div.mapml-contextmenu > button:nth-child(6)');
          await page.click('body > mapml-viewer', { button: 'right' });
          await page.click('div > div.mapml-contextmenu > button:nth-child(6)');

          let children = await page.$eval(
              'div > div.leaflet-control-container > div.leaflet-top.leaflet-left',
              (div) => div.children
            ),
            found = false;
          for (let [key, value] of Object.entries(children)) {
            if (value.className === controls[i]) found = true;
          }
          expect(found).toEqual(false);
        });
      });
    }
    test.describe('Controls List nolayer Attribute Tests', () => {
      test('controlslist=nolayer removes layer control', async () => {
        await page.$eval('body > mapml-viewer', (layer) =>
          layer.setAttribute('controlslist', 'nolayer')
        );
        let layerControl = await page.locator('.leaflet-control-layers');
        await expect(layerControl).toBeHidden();

        await page.click('body > mapml-viewer', { button: 'right' });
        // toggle controls
        await page.click('.mapml-contextmenu > button:nth-of-type(6)');
        await page.click('body > mapml-viewer', { button: 'right' });
        // toggle controls
        await page.click('.mapml-contextmenu > button:nth-of-type(6)');

        await expect(layerControl).toBeHidden();
      });
    });
  });
  test('Paste geojson Layer to map using ctrl+v', async () => {
    await page.click('body > textarea#copyGeoJSON');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');

    await page.click('body > mapml-viewer');
    await page.keyboard.press('Control+v');
    const layerCount = await page.$eval(
      'body > mapml-viewer',
      (map) => map.layers.length
    );
    expect(layerCount).toEqual(2);
  });

  test('Paste Link to map using ctrl+v', async () => {
    await page.click('body > textarea#copyLink');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');

    await page.click('body > mapml-viewer');
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(5000);
    const layerCount = await page.$eval(
      'body > mapml-viewer',
      (map) => map.layers.length
    );
    expect(layerCount).toEqual(3);
  });

  test('Paste Invalid text to map using ctrl+v', async () => {
    await page.click('body > textarea#invalidText');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');

    await page.click('body > mapml-viewer');
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(10000);
    const layerCount = await page.$eval(
      'body > mapml-viewer',
      (map) => map.layers.length
    );
    expect(layerCount).toEqual(3);
  });

  test('Paste Invalid link to map using ctrl+v', async () => {
    await page.click('body > textarea#invalidLink');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');

    await page.click('body > mapml-viewer');
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(1000);
    const layerCount = await page.$eval(
      'body > mapml-viewer',
      (map) => map.layers.length
    );
    expect(layerCount).toEqual(3);
  });

  test('Paste GeoJSON link to map using ctrl+v', async () => {
    await page.click('body > textarea#copyGeoJSONLink');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');

    await page.click('body > mapml-viewer');
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(5000);
    const layerCount = await page.$eval(
      'body > mapml-viewer',
      (map) => map.layers.length
    );
    expect(layerCount).toEqual(4);
  });

  test('Paste JSON link to map using ctrl+v', async () => {
    await page.click('body > textarea#copyJSONLink');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');

    await page.click('body > mapml-viewer');
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(5000);
    const layerCount = await page.$eval(
      'body > mapml-viewer',
      (map) => map.layers.length
    );
    expect(layerCount).toEqual(5);
  });

  test('Press spacebar when focus is on map', async () => {
    // scroll to the top
    await page.mouse.wheel(0, -1000);
    await page.waitForTimeout(300);
    await page.click('body > mapml-viewer');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    const currPos = await page.$eval(
      'body > mapml-viewer',
      () => window.pageYOffset
    );
    expect(currPos).toEqual(0);
  });
});
