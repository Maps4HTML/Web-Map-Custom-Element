import { test, expect, chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
let browserLocale, enLocale, frLocale, locales;

// Load a mapml-extension locale straight from node_modules and flatten it the
// same way load-locales.js does for en/fr, so the test never drifts from the
// extension's message catalogue.
function loadLocale(lang) {
  const file = path.resolve(
    __dirname,
    `../../../node_modules/mapml-extension/src/_locales/${lang}/messages.json`
  );
  const messages = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return Object.keys(messages).reduce((acc, key) => {
    if (key !== 'extName' && key !== 'extDescription') {
      acc[key] = messages[key].message;
    }
    return acc;
  }, {});
}

test.use({
  geolocation: { longitude: -73.56766530667056, latitude: 45.5027789304487 },
  permissions: ['geolocation']
});

test.describe('<mapml-viewer> localization tests', () => {
  let page;
  let context;
  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false
    });
    page =
      context.pages().find((page) => page.url() === 'about:blank') ||
      (await context.newPage());
    page = await context.newPage();

    // The Ukrainian viewer (lang="browser-language") has no bundled locale, so
    // inject uk/messages.json before navigation; localization.html reads
    // window.__browserLocale to build its <map-options> before the viewer
    // connects. Must run before goto() so it lands at document_start.
    browserLocale = loadLocale('uk');
    await page.addInitScript((locale) => {
      window.__browserLocale = locale;
    }, browserLocale);
    await page.goto('localization.html', { waitUntil: 'networkidle' });

    // fetch locales and check that they are not undefined
    expect(browserLocale.cmBack).toBeTruthy();
    enLocale = await page.evaluate(() => M.options.localeEn);
    expect(enLocale.cmBack).toBeTruthy();
    frLocale = await page.evaluate(() => M.options.localeFr);
    expect(frLocale.cmBack).toBeTruthy();

    // define locale pairs for iterations
    locales = [
      ['english', enLocale],
      ['french', frLocale],
      ['ukrainian', browserLocale]
    ];
  });

  test.afterAll(async function () {
    await context.close();
  });

  test('All locales have matching keys', async () => {
    // for every property in enLocale, check that the corresponding
    // exist in frLocale and browserLocale
    for (const l in enLocale) {
      expect(frLocale[l], `french locale is missing key "${l}"`).toBeTruthy();
      expect(
        browserLocale[l],
        `ukrainian (browser) locale is missing key "${l}"`
      ).toBeTruthy();
    }

    // for every property in frLocale, check that the corresponding is in enLocale
    for (const l in frLocale) {
      expect(enLocale[l], `english locale is missing key "${l}"`).toBeTruthy();
    }
  });

  test('Messages in context menus matches the locale key', async () => {
    // button text for the content menu (in order of appearance)
    const cmLocaleList = [
      'cmBack',
      'cmForward',
      'cmReload',
      'btnFullScreen',
      'cmCopyCoords',
      'cmCopyMapML',
      'cmCopyExtent',
      'cmCopyLocation',
      'cmPasteLayer',
      'cmToggleControls',
      'cmToggleDebug',
      'cmViewSource'
    ];

    for (const [language, locale] of locales) {
      // right click the current map
      await page.getByTestId(language).click({ button: 'right' });

      // locate the current context menu (the one that's not hidden)
      const contextMenu = await page.locator(
        '.mapml-contextmenu:not([hidden])'
      );

      // locate all buttons within this context menu
      const buttons = await contextMenu.locator(
        '.mapml-contextmenu-item.mapml-button'
      );

      // check the the number of buttons match with cmLocaleList
      await page.waitForTimeout(500);
      const buttonCount = await buttons.count();
      expect(buttonCount).toBe(cmLocaleList.length);

      // check that each button has text content that matches the locale
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        expect(text).toBeTruthy();
        // need to use startsWith because the runtime hard-codes some english
        // strings onto the localized string (which should be incorporated
        // into the localized string.  e.g. "Alt+Left Arrow" and similar here:
        // https://github.com/Maps4HTML/MapML.js/blob/37d69c106d35f06d3592183ff999c7168626e261/src/mapml/handlers/ContextMenu.js#L53)
        expect(text.startsWith(locale[cmLocaleList[i]])).toBe(true);
      }
    }
  });

  test('Messages in layer menus matches the locale key', async () => {
    const buttonNames = [
      'lmRemoveLayer',
      'lmLayerSettings',
      'lmRemoveExtent',
      'lmExtentSettings'
    ];

    const layerNames = ['dfLayer', 'dfExtent'];

    for (const [language, locale] of locales) {
      // select the current map and layer menu
      const map = await page.getByTestId(language);
      const layerMenu = await map.locator(
        '.leaflet-control-layers.leaflet-control'
      );

      // check all setting buttons
      const buttons = await layerMenu.locator('.mapml-button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(buttonNames.length);
      for (let i = 0; i < buttonNames.length; i++) {
        const button = buttons.nth(i);
        const text = await button.getAttribute('title');
        expect(text).toBeTruthy();
        expect(text).toBe(locale[buttonNames[i]]);
      }

      // check layer opacity
      const layerOpacity = await layerMenu.locator(
        '.mapml-layer-item-opacity.mapml-control-layers'
      );
      const layerOpacityText = await layerOpacity.nth(1).textContent();
      expect(layerOpacityText).toBeTruthy();
      expect(layerOpacityText).toBe(locale.lcOpacity);

      // check extent opacity
      const extentOpacity = await layerMenu.locator(
        '.mapml-layer-item-details.mapml-control-layers'
      );
      const extentOpacityText = await extentOpacity.textContent();
      expect(extentOpacityText).toBeTruthy();
      expect(extentOpacityText).toBe(locale.lcOpacity);

      // check default layer/extent names
      const layers = await layerMenu.locator('.mapml-layer-item-toggle');
      const layerCount = await layers.count();
      expect(layerCount).toBeGreaterThan(layerNames.length);
      for (let i = 0; i < layerNames.length; i++) {
        const layer = layers.nth(i);
        const layerName = await layer.textContent();
        expect(layerName).toBeTruthy();
        expect(layerName).toBe(locale[layerNames[i]]);
      }

      // check layer style
      const style = await layerMenu.locator(
        '.mapml-layer-item-style.mapml-control-layers summary'
      );
      const styleText = await style.textContent();
      expect(styleText).toBeTruthy();
      expect(styleText).toBe(locale.lmStyle);
    }
  });

  test('Hover messages in top left control buttons matches the locale key', async () => {
    for (const [language, locale] of locales) {
      // select the current map
      const map = await page.getByTestId(language);

      // zoom in
      const zoomIn = await map.locator('.leaflet-control-zoom-in');
      const zoomInText = await zoomIn.getAttribute('title');
      expect(zoomInText).toBeTruthy();
      expect(zoomInText).toBe(locale.btnZoomIn);

      // zoom out
      const zoomOut = await map.locator('.leaflet-control-zoom-out');
      const zoomOutText = await zoomOut.getAttribute('title');
      expect(zoomOutText).toBeTruthy();
      expect(zoomOutText).toBe(locale.btnZoomOut);

      // reload
      const reload = await map.locator('.mapml-reload-button.mapml-button');
      const reloadText = await reload.getAttribute('title');
      expect(reloadText).toBeTruthy();
      expect(reloadText).toBe(locale.cmReload);

      // fullscreen text
      const fullscreen = await map.locator(
        '.leaflet-control-fullscreen-button.leaflet-bar-part'
      );
      const fullscreenText = await fullscreen.getAttribute('title');
      expect(fullscreenText).toBeTruthy();
      expect(fullscreenText).toBe(locale.btnFullScreen);

      // click fullscreen button
      await fullscreen.click();

      // exit fullscreen text
      await expect(fullscreen).toHaveAttribute(
        'title',
        locale.btnExitFullScreen
      );
      const exitFullscreen = await map.locator(
        '.leaflet-control-fullscreen-button.leaflet-bar-part'
      );
      const exitFullscreenText = await exitFullscreen.getAttribute('title');
      expect(exitFullscreenText).toBeTruthy();
      expect(exitFullscreenText).toBe(locale.btnExitFullScreen);

      // exit fullscreen
      await fullscreen.click();
    }
  });

  test('Search button and panel messages match the locale key', async () => {
    for (const [language, locale] of locales) {
      const map = await page.getByTestId(language);

      // search button title
      const searchBtn = await map.locator('.mapml-search-button');
      const searchTitle = await searchBtn.getAttribute('title');
      expect(searchTitle).toBeTruthy();
      expect(searchTitle).toBe(locale.btnSearch);

      // search button aria-label
      const searchAriaLabel = await searchBtn.getAttribute('aria-label');
      expect(searchAriaLabel).toBe(locale.btnSearch);

      // open the search panel
      await searchBtn.click();
      await page.waitForTimeout(400);

      // search input placeholder
      const searchInput = await map.locator('.mapml-search-input');
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder).toBe(locale.searchPlaceholder);

      // search input aria-label
      const inputAriaLabel = await searchInput.getAttribute('aria-label');
      expect(inputAriaLabel).toBe(locale.btnSearch);

      // close button title and aria-label
      const closeBtn = await map.locator('.mapml-search-close');
      const closeTitle = await closeBtn.getAttribute('title');
      expect(closeTitle).toBeTruthy();
      expect(closeTitle).toBe(locale.btnSearchClose);
      const closeAriaLabel = await closeBtn.getAttribute('aria-label');
      expect(closeAriaLabel).toBe(locale.btnSearchClose);

      // close the panel
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  });

  test('Hover messages for location tracking matches the locale key', async () => {
    for (const [language, locale] of locales) {
      // select the current map
      const map = await page.getByTestId(language);

      // hover text for turning on show location
      const showLocation = await map.locator(
        '.leaflet-bar-part.leaflet-bar-part-single'
      );
      let showLocationText = await showLocation.getAttribute('title');
      expect(showLocationText).toBeTruthy();
      expect(showLocationText).toBe(locale.btnLocTrackOff);

      // click show location
      await showLocation.click();

      // my current location
      const curLocation = await map.locator(
        '.leaflet-pane.leaflet-tooltip-pane'
      );
      await page.waitForTimeout(500);
      const curLocationText = await curLocation.textContent();
      expect(curLocationText).toBe(locale.btnMyLocTrackOn);

      // hover text for turning off show location
      showLocationText = await showLocation.getAttribute('title');
      expect(showLocationText).toBeTruthy();
      expect(showLocationText).toBe(locale.btnLocTrackOn);

      // compute starting and ending points for moving the map
      const boundingBox = await map.boundingBox();
      const startX = boundingBox.x + boundingBox.width / 2;
      const startY = boundingBox.y + boundingBox.height / 2;
      const endX = startX + 100;
      const endY = startY;

      // move the current map
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 20 });
      await page.mouse.up();

      // my last location
      const lastLocation = await map.locator(
        '.leaflet-pane.leaflet-tooltip-pane'
      );
      await page.waitForTimeout(500);
      const lastLocationText = await lastLocation.textContent();
      expect(lastLocationText).toBe(locale.btnMyLastKnownLocTrackOn);

      // hover text for show location - last location
      showLocationText = await showLocation.getAttribute('title');
      expect(showLocationText).toBeTruthy();
      expect(showLocationText).toBe(locale.btnLocTrackLastKnown);

      // turn off show location
      await showLocation.click();
    }
  });

  test('Map feature options matches the locale key', async () => {
    const buttonNames = [
      'kbdFocusMap',
      'kbdPrevFeature',
      'kbdNextFeature',
      'kbdFocusControls'
    ];

    // click all feature buttons
    const features = await page.getByTestId('map-feature');
    const count = await features.count();
    for (let i = 0; i < count; i++) {
      await page.waitForTimeout(500);
      await features.nth(i).evaluate((node) => node.click());
    }

    for (const [language, locale] of locales) {
      // select the current map
      const map = await page.getByTestId(language);

      // test focus buttons (for map features)
      const focusButtons = await map.locator('.mapml-focus-buttons button');
      const buttonsCount = await focusButtons.count();
      for (let i = 0; i < buttonsCount; i++) {
        const text = await focusButtons.nth(i).getAttribute('title');
        expect(text).toBeTruthy();
        expect(text.endsWith(locale[buttonNames[i]])).toBe(true);
      }
    }
  });

  test('Keyboard feature messages in the attribution button matches the locale key', async () => {
    const dialogBolded = ['kbdShortcuts', 'kbdMovement', 'kbdFeature'];

    const dialogListItems = [
      'kbdPanUp',
      'kbdPanDown',
      'kbdPanLeft',
      'kbdPanRight',
      'btnZoomIn',
      'btnZoomOut',
      'kbdPanIncrement',
      'kbdPanIncrement',
      'kbdZoom',
      'kbdPrevFeature',
      'kbdNextFeature'
    ];

    for (const [language, locale] of locales) {
      // select the current map
      const map = await page.getByTestId(language);

      // locate the dialog element
      const dialog = await map.locator('dialog');

      // check that the bolded texts are translated correctly
      const bolded = await dialog.locator('b');
      const countBolded = await bolded.count();
      for (let i = 0; i < countBolded; i++) {
        const text = await bolded.nth(i).textContent();
        expect(text).toBeTruthy();
        expect(text.startsWith(locale[dialogBolded[i]])).toBe(true);
      }

      // check that the list items are translated correctly
      const listItems = await dialog.locator('li');
      const countListItems = await listItems.count();
      for (let i = 0; i < countListItems; i++) {
        const text = await listItems.nth(i).textContent();
        expect(text).toBeTruthy();
        expect(text.endsWith(locale[dialogListItems[i]])).toBe(true);
      }
    }
  });
});
