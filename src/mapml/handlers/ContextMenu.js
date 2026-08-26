import {
  Handler,
  Browser,
  DomUtil,
  DomEvent,
  point,
  stamp,
  extend
} from 'leaflet';
import { Util } from '../utils/Util.js';
/*
MIT License related to portions of M.ContextMenu 
Copyright (c) 2017 adam.ratcliffe@gmail.com
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
/* global M, KeyboardEvent */

export var ContextMenu = Handler.extend({
  _touchstart: Browser.msPointer
    ? 'MSPointerDown'
    : Browser.pointer
    ? 'pointerdown'
    : 'touchstart',
  _getLocale: function (map) {
    return map.options.mapEl && map.options.mapEl.locale
      ? map.options.mapEl.locale
      : M.options.locale;
  },
  initialize: function (map) {
    Handler.prototype.initialize.call(this, map);
    let locale = this._getLocale(map);
    this.activeIndex = 0; //current fous index on menu
    this.excludedIndices = [4, 7]; //menu indexes that are --------
    this.isRunned = false; //variable for tracking edge case
    //setting the items in the context menu and their callback functions
    this._menuItems = {};

    const CTXBACK = 0,
      CTXFWD = 1,
      CTXRELOAD = 2,
      CTXFULLSCR = 3,
      CTXSPACER1 = 4,
      CTXCOPY = 5,
      CTXPASTE = 6,
      CTXSPACER2 = 7,
      CTXCNTRLS = 8,
      CTXDEBUG = 9,
      CTXVWSRC = 10;
    this._menuItems.CTXBACK = CTXBACK;
    this._menuItems.CTXFWD = CTXFWD;
    this._menuItems.CTXRELOAD = CTXRELOAD;
    this._menuItems.CTXFULLSCR = CTXFULLSCR;
    this._menuItems.CTXSPACER1 = CTXSPACER1;
    this._menuItems.CTXCOPY = CTXCOPY;
    this._menuItems.CTXPASTE = CTXPASTE;
    this._menuItems.CTXSPACER2 = CTXSPACER2;
    this._menuItems.CTXCNTRLS = CTXCNTRLS;
    this._menuItems.CTXDEBUG = CTXDEBUG;
    this._menuItems.CTXVWSRC = CTXVWSRC;

    this._items = [
      {
        // 0
        text: locale.cmBack + ' (<kbd>Alt+Left Arrow</kbd>)',
        callback: this._goBack
      },
      {
        // 1
        text: locale.cmForward + ' (<kbd>Alt+Right Arrow</kbd>)',
        callback: this._goForward
      },
      {
        // 2
        text: locale.cmReload + ' (<kbd>Ctrl+R</kbd>)',
        callback: this._reload
      },
      {
        // 3
        text: locale.btnFullScreen + ' (<kbd>F</kbd>)',
        callback: this._toggleFullScreen
      },
      {
        // 4
        spacer: '-'
      },
      {
        // 5
        text: locale.cmCopyCoords + ' (<kbd>C</kbd>)<span></span>',
        callback: this._copyCoords,
        hideOnSelect: false,
        popup: true,
        submenu: [
          {
            // 5.0
            text: locale.cmCopyMapML,
            callback: this._copyMapML
          },
          {
            // 5.1
            text: locale.cmCopyExtent,
            callback: this._copyExtent
          },
          {
            // 5.2
            text: locale.cmCopyLocation,
            callback: this._copyLocation
          }
        ]
      },
      {
        // 6
        text: locale.cmPasteLayer + ' (<kbd>P</kbd>)',
        callback: this._paste
      },
      {
        // 7
        spacer: '-'
      },
      {
        // 8
        text: locale.cmToggleControls + ' (<kbd>T</kbd>)',
        callback: this._toggleControls,
        toggle: true
      },
      {
        // 9
        text: locale.cmToggleDebug + ' (<kbd>D</kbd>)',
        callback: this._toggleDebug,
        toggle: true
      },
      {
        // 10
        text: locale.cmViewSource + ' (<kbd>V</kbd>)',
        callback: this._viewSource
      }
    ];

    // setting the default cs for copying location and extent
    // should be public as they are used in tests
    this.defExtCS = M.options.defaultExtCoor;
    this.defLocCS = M.options.defaultLocCoor;

    // Used for layer and map-extent contextmenu
    const LYRZOOMTO = 0,
      LYRCOPY = 1;
    this._menuItems.LYRZOOMTO = LYRZOOMTO;
    this._menuItems.LYRCOPY = LYRCOPY;

    this._layerItems = [
      {
        // 0
        text: locale.lmZoomToLayer + ' (<kbd>Z</kbd>)',
        callback: this._zoomToLayer
      },
      {
        // 1
        text: locale.lmCopyLayer + ' (<kbd>L</kbd>)',
        callback: this._copyLayer
      }
    ];

    this._extentLayerItems = [
      {
        // 0
        text: locale.lmZoomToExtent + ' (<kbd>Z</kbd>)',
        callback: this._zoomToMapExtent
      },
      {
        // 1
        text: locale.lmCopyExtent + ' (<kbd>L</kbd>)',
        callback: this._copyMapExtent
      }
    ];
    this._mapMenuVisible = false;
    this._keyboardEvent = false;

    this._container = DomUtil.create(
      'div',
      'mapml-contextmenu',
      map.getContainer()
    );
    this._container.setAttribute('hidden', '');

    this._items[CTXBACK].el = this._createItem(
      this._container,
      this._items[CTXBACK]
    );
    this._items[CTXFWD].el = this._createItem(
      this._container,
      this._items[CTXFWD]
    );
    this._items[CTXRELOAD].el = this._createItem(
      this._container,
      this._items[CTXRELOAD]
    );
    this._items[CTXFULLSCR].el = this._createItem(
      this._container,
      this._items[CTXFULLSCR]
    );
    this._items[CTXSPACER1].el = this._createItem(
      this._container,
      this._items[CTXSPACER1]
    );
    this._items[CTXCOPY].el = this._createItem(
      this._container,
      this._items[CTXCOPY]
    );

    this._copySubMenu = DomUtil.create(
      'div',
      'mapml-contextmenu mapml-submenu',
      this._container
    );
    this._copySubMenu.id = 'mapml-copy-submenu';
    this._copySubMenu.setAttribute('hidden', '');

    this._clickEvent = null;

    const CPYMENUMAP = 0,
      CPYMENUEXTENT = 1,
      CPYMENULOC = 2;
    this._menuItems.CPYMENUMAP = CPYMENUMAP;
    this._menuItems.CPYMENUEXTENT = CPYMENUEXTENT;
    this._menuItems.CPYMENULOC = CPYMENULOC;
    this._createItem(
      this._copySubMenu,
      this._items[CTXCOPY].submenu[CPYMENUMAP],
      CPYMENUMAP
    );
    this._createItem(
      this._copySubMenu,
      this._items[CTXCOPY].submenu[CPYMENUEXTENT],
      CPYMENUEXTENT
    );
    this._createItem(
      this._copySubMenu,
      this._items[CTXCOPY].submenu[CPYMENULOC],
      CPYMENULOC
    );

    this._items[CTXPASTE].el = this._createItem(
      this._container,
      this._items[CTXPASTE]
    );
    this._items[CTXSPACER2].el = this._createItem(
      this._container,
      this._items[CTXSPACER2]
    );
    this._items[CTXCNTRLS].el = this._createItem(
      this._container,
      this._items[CTXCNTRLS]
    );
    this._items[CTXDEBUG].el = this._createItem(
      this._container,
      this._items[CTXDEBUG]
    );
    this._items[CTXVWSRC].el = this._createItem(
      this._container,
      this._items[CTXVWSRC]
    );

    this._layerMenu = DomUtil.create(
      'div',
      'mapml-contextmenu mapml-layer-menu',
      map.getContainer()
    );
    this._layerMenu.setAttribute('hidden', '');
    this._createItem(this._layerMenu, this._layerItems[LYRZOOMTO]);
    this._createItem(this._layerMenu, this._layerItems[LYRCOPY]);

    this._extentLayerMenu = DomUtil.create(
      'div',
      'mapml-contextmenu mapml-extent-menu',
      map.getContainer()
    );
    this._extentLayerMenu.setAttribute('hidden', '');
    this._createItem(this._extentLayerMenu, this._extentLayerItems[LYRZOOMTO]);
    this._createItem(this._extentLayerMenu, this._extentLayerItems[LYRCOPY]);

    DomEvent.on(this._container, 'click', DomEvent.stop)
      .on(this._container, 'mousedown', DomEvent.stop)
      .on(this._container, 'dblclick', DomEvent.stop)
      .on(this._container, 'contextmenu', DomEvent.stop)
      .on(this._layerMenu, 'click', DomEvent.stop)
      .on(this._layerMenu, 'mousedown', DomEvent.stop)
      .on(this._layerMenu, 'dblclick', DomEvent.stop)
      .on(this._layerMenu, 'contextmenu', DomEvent.stop)
      .on(this._extentLayerMenu, 'click', DomEvent.stop)
      .on(this._extentLayerMenu, 'mousedown', DomEvent.stop)
      .on(this._extentLayerMenu, 'dblclick', DomEvent.stop)
      .on(this._extentLayerMenu, 'contextmenu', DomEvent.stop);

    this.t = document.createElement('template');
    this.t.innerHTML = `<map-feature zoom="">
        <map-featurecaption></map-featurecaption>
        <map-properties>
            <h2></h2>
            <div style="text-align:center"></div>
        </map-properties>
        <map-geometry cs="">
          <map-point>
            <map-coordinates></map-coordinates>
          </map-point>
        </map-geometry>
      </map-feature>`;
  },

  addHooks: function () {
    var container = this._map.getContainer();

    DomEvent.on(container, 'mouseleave', this._hide, this).on(
      document,
      'keydown',
      this._onKeyDown,
      this
    );

    if (Browser.touch) {
      DomEvent.on(document, this._touchstart, this._hide, this);
    }

    this._map.on(
      {
        contextmenu: this._show,
        mousedown: this._hide,
        zoomstart: this._hide
      },
      this
    );
  },

  removeHooks: function () {
    var container = this._map.getContainer();

    DomEvent.off(container, 'mouseleave', this._hide, this).off(
      document,
      'keydown',
      this._onKeyDown,
      this
    );

    if (Browser.touch) {
      DomEvent.off(document, this._touchstart, this._hide, this);
    }

    this._map.off(
      {
        contextmenu: this._show,
        mousedown: this._hide,
        zoomstart: this._hide
      },
      this
    );
  },

  _updateCS: function () {
    if (
      this.defExtCS !== M.options.defaultExtCoor ||
      this.defLocCS !== M.options.defaultLocCoor
    ) {
      this.defExtCS = M.options.defaultExtCoor;
      this.defLocCS = M.options.defaultLocCoor;
    }
  },

  _copyExtent: function (e) {
    let context =
        e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu,
      coord = context.defExtCS ? context.defExtCS.toLowerCase() : 'pcrs',
      tL =
        e instanceof KeyboardEvent
          ? this.extent.topLeft[coord]
          : this.options.mapEl.extent.topLeft[coord],
      bR =
        e instanceof KeyboardEvent
          ? this.extent.bottomRight[coord]
          : this.options.mapEl.extent.bottomRight[coord],
      data = '';
    switch (coord) {
      case 'MapML':
      default:
        if (coord === 'pcrs') {
          data = `<map-meta name="extent" content="top-left-easting=${Math.round(
            tL.horizontal
          )}, top-left-northing=${Math.round(
            tL.vertical
          )}, bottom-right-easting=${Math.round(
            bR.horizontal
          )}, bottom-right-northing=${Math.round(bR.vertical)}"></map-meta>`;
        } else if (coord === 'gcrs') {
          data = `<map-meta name="extent" content="top-left-longitude=${tL.horizontal}, top-left-latitude=${tL.vertical}, bottom-right-longitude=${bR.horizontal}, bottom-right-latitude=${bR.vertical}"></map-meta>`;
        } else if (coord === 'tcrs') {
          data = `<map-meta name="extent" content="top-left-x=${
            tL[0].horizontal
          }, top-left-y=${tL[0].vertical}, bottom-right-x=${
            bR[bR.length - 1].horizontal
          }, bottom-right-y=${bR[bR.length - 1].vertical}"></map-meta>`;
        } else if (coord === 'tilematrix') {
          data = `<map-meta name="extent" content="top-left-column=${
            tL[0].horizontal
          }, top-left-row=${tL[0].vertical}, bottom-right-column=${
            bR[bR.length - 1].horizontal
          }, bottom-right-row=${bR[bR.length - 1].vertical}"></map-meta>`;
        } else {
          console.log('not support');
        }
        break;
    }
    context._copyData(data);
  },

  _zoomToLayer: function (e) {
    let context =
      e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu;
    context._layerClicked.layer._layerEl.zoomTo();
  },

  _copyLayer: function (e) {
    let context =
        e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu,
      layerElem = context._layerClicked.layer._layerEl;
    context._copyData(layerElem.getOuterHTML());
  },

  _zoomToMapExtent: function (e) {
    let context =
      e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu;
    context._layerClicked.extent.zoomTo();
  },

  _copyMapExtent: function (e) {
    let context =
        e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu,
      extentElem = context._layerClicked.extent;
    context._copyData(extentElem.getOuterHTML());
  },

  _goForward: function (e) {
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    mapEl.forward();
  },

  _goBack: function (e) {
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    mapEl.back();
  },

  _reload: function (e) {
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    mapEl.reload();
  },

  _toggleFullScreen: function (e) {
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    mapEl._toggleFullScreen();
  },

  _toggleControls: function (e) {
    let el = this.contextMenu._items[8].el.el;
    el.setAttribute(
      'aria-checked',
      el.getAttribute('aria-checked') === 'true' ? 'false' : 'true'
    );
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    if (mapEl.controls) {
      mapEl.controls = false;
    } else {
      mapEl.controls = true;
    }
  },

  _copyMapML: function (e) {
    let context =
        e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu,
      mapEl =
        e instanceof KeyboardEvent
          ? this._map.options.mapEl
          : this.options.mapEl;
    context._copyData(
      mapEl.outerHTML.replace(
        /<div class="mapml-web-map">.*?<\/div>|<style>\[is="web-map"].*?<\/style>|<style>mapml-viewer.*?<\/style>/gm,
        ''
      )
    );
  },

  // Add support for pasting GeoJSON in the future
  _paste: function (e) {
    let context =
        e instanceof KeyboardEvent ? this._map.contextMenu : this.contextMenu,
      mapEl =
        e instanceof KeyboardEvent
          ? this._map.options.mapEl
          : this.options.mapEl;
    navigator.clipboard.readText().then((layer) => {
      Util._pasteLayer(mapEl, layer);
    });
  },

  _viewSource: function (e) {
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    mapEl.viewSource();
  },

  _toggleDebug: function (e) {
    let el = this.contextMenu._items[9].el.el;
    el.setAttribute(
      'aria-checked',
      el.getAttribute('aria-checked') === 'true' ? 'false' : 'true'
    );
    let mapEl =
      e instanceof KeyboardEvent ? this._map.options.mapEl : this.options.mapEl;
    mapEl.toggleDebug();
  },

  _copyCoords: function (e) {
    let directory = this.contextMenu ? this.contextMenu : this;
    directory._showCopySubMenu(e);
  },

  _copyData: function (data) {
    const el = document.createElement('textarea');
    el.value = data;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  },

  _copyLocation: function (e) {
    const menu = this.contextMenu;
    switch (menu.defLocCS.toLowerCase()) {
      case 'tile':
        menu._copyTile.call(this, e);
        break;
      case 'tilematrix':
        menu._copyTileMatrix.call(this, e);
        break;
      case 'map':
        menu._copyMap.call(this, e);
        break;
      case 'tcrs':
        menu._copyTCRS.call(this, e);
        break;
      case 'pcrs':
        menu._copyPCRS.call(this, e);
        break;
      case 'gcrs':
      default:
        menu._copyGCRS.call(this, e);
        break;
    }
  },

  _copyGCRS: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      projection = mapEl.projection,
      feature = this.contextMenu.t.content.firstElementChild.cloneNode(true),
      caption = feature.querySelector('map-featurecaption'),
      h2 = feature.querySelector('h2'),
      div = feature.querySelector('div'),
      geom = feature.querySelector('map-geometry'),
      coords = feature.querySelector('map-coordinates');

    feature.setAttribute('zoom', mapEl.zoom);
    geom.setAttribute('cs', 'gcrs');
    caption.textContent = `Copied ${projection} gcrs location`;
    h2.textContent = `Copied ${projection} gcrs location`;
    div.textContent = `${click.latlng.lng.toFixed(
      6
    )} ${click.latlng.lat.toFixed(6)}`;
    coords.textContent = `${click.latlng.lng.toFixed(
      6
    )} ${click.latlng.lat.toFixed(6)}`;
    this.contextMenu._copyData(feature.outerHTML);
  },

  _copyTCRS: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      pt0 = mapEl._map.project(click.latlng),
      pt = { x: pt0.x.toFixed(), y: pt0.y.toFixed() },
      projection = mapEl.projection,
      feature = this.contextMenu.t.content.firstElementChild.cloneNode(true),
      caption = feature.querySelector('map-featurecaption'),
      h2 = feature.querySelector('h2'),
      div = feature.querySelector('div'),
      geom = feature.querySelector('map-geometry'),
      coords = feature.querySelector('map-coordinates');

    feature.setAttribute('zoom', mapEl.zoom);
    geom.setAttribute('cs', 'tcrs');
    caption.textContent = `Copied ${projection} tcrs location`;
    h2.textContent = `Copied ${projection} tcrs location`;
    div.textContent = `${pt.x} ${pt.y}`;
    coords.textContent = `${pt.x} ${pt.y}`;
    this.contextMenu._copyData(feature.outerHTML);
  },

  _copyTileMatrix: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      pt = mapEl._map.project(click.latlng),
      tileSize = mapEl._map.options.crs.options.crs.tile.bounds.max.x,
      projection = mapEl.projection,
      feature = this.contextMenu.t.content.firstElementChild.cloneNode(true),
      caption = feature.querySelector('map-featurecaption'),
      h2 = feature.querySelector('h2'),
      div = feature.querySelector('div'),
      geom = feature.querySelector('map-geometry'),
      coords = feature.querySelector('map-coordinates');

    feature.setAttribute('zoom', mapEl.zoom);
    geom.setAttribute('cs', 'gcrs');
    caption.textContent = `Copied ${projection} tilematrix location (not implemented yet)`;
    h2.textContent = `Copied ${projection} tilematrix location (not implemented yet)`;
    div.textContent = `${Math.trunc(pt.x / tileSize)} ${Math.trunc(
      pt.y / tileSize
    )}`;
    coords.textContent = `${click.latlng.lng.toFixed(
      6
    )} ${click.latlng.lat.toFixed(6)}`;
    this.contextMenu._copyData(feature.outerHTML);
  },

  _copyPCRS: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      point = mapEl._map.project(click.latlng),
      scale = mapEl._map.options.crs.scale(+mapEl.zoom),
      pcrs = mapEl._map.options.crs.transformation
        .untransform(point, scale)
        .round(),
      projection = mapEl.projection,
      feature = this.contextMenu.t.content.firstElementChild.cloneNode(true),
      caption = feature.querySelector('map-featurecaption'),
      h2 = feature.querySelector('h2'),
      div = feature.querySelector('div'),
      geom = feature.querySelector('map-geometry'),
      coords = feature.querySelector('map-coordinates');

    feature.setAttribute('zoom', mapEl.zoom);
    geom.setAttribute('cs', 'pcrs');
    caption.textContent = `Copied ${projection} pcrs location`;
    h2.textContent = `Copied ${projection} pcrs location`;
    div.textContent = `${pcrs.x} ${pcrs.y}`;
    coords.textContent = `${pcrs.x} ${pcrs.y}`;
    this.contextMenu._copyData(feature.outerHTML);
  },

  _copyTile: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      // the _map.project method returns pixels, while the _map.crs.project
      // method returns meters, confusingly:
      // https://leafletjs.com/reference.html#map-project
      // https://leafletjs.com/reference.html#crs-project
      pt0 = mapEl._map.project(click.latlng),
      tileSize = mapEl._map.options.crs.options.crs.tile.bounds.max.x,
      pointX = pt0.x % tileSize,
      pointY = pt0.y % tileSize,
      pt = point(pointX, pointY).trunc(),
      projection = mapEl.projection,
      feature = this.contextMenu.t.content.firstElementChild.cloneNode(true),
      caption = feature.querySelector('map-featurecaption'),
      h2 = feature.querySelector('h2'),
      div = feature.querySelector('div'),
      geom = feature.querySelector('map-geometry'),
      coords = feature.querySelector('map-coordinates');

    if (pt.x < 0) pt.x += tileSize;
    if (pt.y < 0) pt.y += tileSize;

    feature.setAttribute('zoom', mapEl.zoom);
    geom.setAttribute('cs', 'gcrs');
    caption.textContent = `Copied ${projection} tile location (not implemented yet)`;
    h2.textContent = `Copied ${projection} tile location (not implemented yet)`;
    div.textContent = `${pt.x} ${pt.y}`;
    coords.textContent = `${click.latlng.lng.toFixed(
      6
    )} ${click.latlng.lat.toFixed(6)}`;
    this.contextMenu._copyData(feature.outerHTML);
  },

  _copyMap: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      mapPt = click.containerPoint.trunc(),
      projection = mapEl.projection,
      feature = this.contextMenu.t.content.firstElementChild.cloneNode(true),
      caption = feature.querySelector('map-featurecaption'),
      h2 = feature.querySelector('h2'),
      div = feature.querySelector('div'),
      geom = feature.querySelector('map-geometry'),
      coords = feature.querySelector('map-coordinates');

    feature.setAttribute('zoom', mapEl.zoom);
    geom.setAttribute('cs', 'gcrs');
    caption.textContent = `Copied ${projection} map location (not implemented yet)`;
    h2.textContent = `Copied ${projection} map location (not implemented yet)`;
    div.textContent = `${mapPt.x} ${mapPt.y}`;
    coords.textContent = `${click.latlng.lng.toFixed(
      6
    )} ${click.latlng.lat.toFixed(6)}`;
    this.contextMenu._copyData(feature.outerHTML);
  },

  _copyAllCoords: function (e) {
    let mapEl = this.options.mapEl,
      click = this.contextMenu._clickEvent,
      pt0 = mapEl._map.project(click.latlng),
      tileSize = mapEl._map.options.crs.options.crs.tile.bounds.max.x,
      pointX = pt0.x % tileSize,
      pointY = pt0.y % tileSize,
      scale = mapEl._map.options.crs.scale(+mapEl.zoom),
      pcrs = mapEl._map.options.crs.transformation.untransform(pt0, scale);
    let allData = `z:${mapEl.zoom}\n`;
    allData += `tile: i:${Math.trunc(pointX)}, j:${Math.trunc(pointY)}\n`;
    allData += `tilematrix: column:${Math.trunc(
      pt0.x / tileSize
    )}, row:${Math.trunc(pt0.y / tileSize)}\n`;
    allData += `map: i:${Math.trunc(click.containerPoint.x)}, j:${Math.trunc(
      click.containerPoint.y
    )}\n`;
    allData += `tcrs: x:${Math.trunc(pt0.x)}, y:${Math.trunc(pt0.y)}\n`;
    allData += `pcrs: easting:${pcrs.x.toFixed(2)}, northing:${pcrs.y.toFixed(
      2
    )}\n`;
    allData += `gcrs: lon :${click.latlng.lng.toFixed(
      6
    )}, lat:${click.latlng.lat.toFixed(6)}`;
    this.contextMenu._copyData(allData);
  },

  _createItem: function (container, options, index) {
    if (options.spacer) {
      return this._createSeparator(container, index);
    }

    var itemCls = 'mapml-contextmenu-item',
      el = this._insertElementAt('button', itemCls, container, index),
      callback = this._createEventHandler(
        el,
        options.callback,
        options.context,
        options.hideOnSelect
      ),
      html = '';

    el.innerHTML = html + options.text;
    el.setAttribute('type', 'button');
    el.classList.add('mapml-button');
    if (options.popup) {
      el.setAttribute('aria-haspopup', 'true');
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-controls', 'mapml-copy-submenu');
    }

    if (options.toggle) {
      el.setAttribute('role', 'checkbox');
      el.setAttribute('aria-checked', 'false');
    }

    DomEvent.on(el, 'mouseover', this._onItemMouseOver, this)
      .on(el, 'mouseout', this._onItemMouseOut, this)
      .on(el, 'mousedown', DomEvent.stopPropagation)
      .on(el, 'click', callback);

    if (Browser.touch) {
      DomEvent.on(el, this._touchstart, DomEvent.stopPropagation);
    }

    // Devices without a mouse fire "mouseover" on tap, but never “mouseout"
    if (!Browser.pointer) {
      DomEvent.on(el, 'click', this._onItemMouseOut, this);
    }

    return {
      id: stamp(el),
      el: el,
      callback: callback
    };
  },

  _createSeparator: function (container, index) {
    let el = this._insertElementAt(
      'div',
      'mapml-contextmenu-separator',
      container,
      index
    );

    return {
      id: stamp(el),
      el: el
    };
  },

  _createEventHandler: function (el, func, context, hideOnSelect) {
    let parent = this;

    hideOnSelect = hideOnSelect !== undefined ? hideOnSelect : true;

    return function (e) {
      let map = parent._map,
        containerPoint = parent._showLocation.containerPoint,
        layerPoint = map.containerPointToLayerPoint(containerPoint),
        latlng = map.layerPointToLatLng(layerPoint),
        relatedTarget = parent._showLocation.relatedTarget,
        data = {
          containerPoint: containerPoint,
          layerPoint: layerPoint,
          latlng: latlng,
          relatedTarget: relatedTarget
        };

      if (hideOnSelect) {
        parent._hide();
      }

      if (func) {
        func.call(context || map, data);
      }

      parent._map.fire('contextmenu.select', {
        contextmenu: parent,
        el: el
      });
    };
  },

  _insertElementAt: function (tagName, className, container, index) {
    let refEl,
      el = document.createElement(tagName);

    el.className = className;

    if (index !== undefined) {
      refEl = container.children[index];
    }

    if (refEl) {
      container.insertBefore(el, refEl);
    } else {
      container.appendChild(el);
    }

    return el;
  },

  _show: function (e) {
    // don't show a context menu for features
    if (e.originalEvent.target.closest('.mapml-vector-container')) return;
    if (this._mapMenuVisible) this._hide();
    this._clickEvent = e;
    let elem = e.originalEvent.target;
    // Opening contextmenu for layercontrol
    if (elem.closest('fieldset')) {
      elem = elem.closest('fieldset');
      // layer layercontrol
      if (elem.className === 'mapml-layer-item') {
        elem = elem.querySelector('span');
        this._layerMenu.removeAttribute('hidden');
        this._showAtPoint(e.containerPoint, e, this._layerMenu);
        // map-extent layercontrol
      } else if (elem.className === 'mapml-layer-extent') {
        elem = elem.querySelector('span');
        this._extentLayerMenu.removeAttribute('hidden');
        this._showAtPoint(e.containerPoint, e, this._extentLayerMenu);
      }
      this._layerClicked = elem;
    } else if (
      // map contextmenu
      elem.classList.contains('leaflet-container') ||
      elem.classList.contains('mapml-debug-extent') ||
      elem.tagName === 'path'
    ) {
      let layerList = this._map.options.mapEl.layers;
      this._layerClicked = Array.from(layerList).find((el) => el.checked);
      // the 'hidden' attribute must be removed before any attempt to get the size of container
      let pt = e.containerPoint;
      // this is for firefox, which reports the e.containerPoint as x=0 when you
      // use a keyboard Shift+F10 to display the context menu; this appears
      // to be because blink returns a PointerEvent of type==='contextmenu',
      // while gecko returns an object (for e.originalEvent).
      if (Browser.gecko) {
        const getCenter = function (el) {
          let w = el.getBoundingClientRect().width;
          let h = el.getBoundingClientRect().height;
          return { x: Number.parseInt(w / 2), y: Number.parseInt(h / 2) };
        };
        pt = getCenter(this._map.getContainer());
      }
      this._container.removeAttribute('hidden');
      this._showAtPoint(pt, e, this._container);
      this._updateCS();
    }
    // Once contextmenu is opened, focus the first item
    if (e.originalEvent.button === 0 || e.originalEvent.button === -1) {
      this._keyboardEvent = true;
      if (this._layerClicked.className.includes('mapml-layer-item')) {
        let activeEl = document.activeElement;
        this._elementInFocus = activeEl.shadowRoot.activeElement;
        this._layerMenuTabs = 1;
        this._layerMenu.firstChild.focus();
        //
      } else if (this._layerClicked.className.includes('mapml-extent-item')) {
        let activeEl = document.activeElement;
        this._elementInFocus = activeEl.shadowRoot.activeElement;
        this._extentLayerMenuTabs = 1;
        this._extentLayerMenu.firstChild.focus();
      } else {
        this._container.querySelectorAll('button:not([disabled])')[0].focus();
      }
    }
  },

  _showAtPoint: function (pt, data, container) {
    if (this._items.length) {
      let event = extend(data || {}, { contextmenu: this });

      this._showLocation = {
        containerPoint: pt
      };

      if (data && data.relatedTarget) {
        this._showLocation.relatedTarget = data.relatedTarget;
      }

      this._setPosition(pt, container);

      if (!this._mapMenuVisible) {
        container.removeAttribute('hidden');
        this._mapMenuVisible = true;
      }

      this._map.fire('contextmenu.show', event);
    }
  },

  _hide: function () {
    if (this._mapMenuVisible) {
      this._mapMenuVisible = false;
      this._container.setAttribute('hidden', '');
      this._copySubMenu.setAttribute('hidden', '');
      this._layerMenu.setAttribute('hidden', '');
      this._extentLayerMenu.setAttribute('hidden', '');
      this._map.fire('contextmenu.hide', { contextmenu: this });
      setTimeout(() => this._map._container.focus(), 0);
      this.activeIndex = 0;
      this.isRunned = false;
    }
  },

  _setPosition: function (pt, container) {
    let mapSize = this._map.getSize(),
      containerSize = this._getElementSize(container),
      anchor;

    if (this._map.options.contextmenuAnchor) {
      anchor = point(this._map.options.contextmenuAnchor);
      pt = pt.add(anchor);
    }

    container._leaflet_pos = pt;

    if (pt.x + containerSize.x > mapSize.x) {
      container.style.left = 'auto';
      container.style.right =
        Math.min(
          Math.max(mapSize.x - pt.x, 0),
          mapSize.x - containerSize.x - 1
        ) + 'px';
    } else {
      container.style.left = Math.max(pt.x, 0) + 'px';
      container.style.right = 'auto';
    }

    if (pt.y + containerSize.y > mapSize.y) {
      container.style.top = 'auto';
      container.style.bottom =
        Math.min(
          Math.max(mapSize.y - pt.y, 0),
          mapSize.y - containerSize.y - 1
        ) + 'px';
    } else {
      container.style.top = Math.max(pt.y, 0) + 'px';
      container.style.bottom = 'auto';
    }
  },

  _getElementSize: function (el) {
    let size = this._size;

    if (!size || this._sizeChanged) {
      size = {};

      el.style.left = '-999999px';
      el.style.right = 'auto';

      size.x = el.offsetWidth;
      size.y = el.offsetHeight;

      el.style.left = 'auto';

      this._sizeChanged = false;
    }

    return size;
  },

  // once Esc is clicked on the layer/extent contextMenu, change the focus back to the layer control
  _focusOnLayerControl: function () {
    this._mapMenuVisible = false;
    delete this._layerMenuTabs;
    delete this._extentLayerMenuTabs;
    this._layerMenu.setAttribute('hidden', '');
    this._extentLayerMenu.setAttribute('hidden', '');
    if (this._elementInFocus) {
      this._elementInFocus.focus();
    } else {
      this._layerClicked.parentElement.firstChild.focus();
    }
    delete this._elementInFocus;
  },

  _setActiveItem: function (index) {
    if (
      document.activeElement.shadowRoot === null &&
      this.noActiveEl === true
    ) {
      //bug fix when theres no active element
      this.noActiveEl = false;
      //setting this._items[9] is just for preventing some diabled index, it will be override by later code.
      this._items[9].el.el.focus();
    }
    if (
      document.activeElement.shadowRoot.activeElement.innerHTML ===
      this._items[index].el.el.innerHTML
    ) {
      //edge case where pressing shift f10 focuses the first element on contextmenu (if already focused, have to press arrow twice to go down)
      let next = index + 1;
      while (this._items[next].el.el.disabled) {
        next++;
        if (next >= this._items.length) {
          next = 0;
        }
      }
      this._setActiveItem(next);
    } else {
      if (this.excludedIndices.includes(index)) {
        // find the next or previous non-excluded item
        let nextIndex = index + 1;
        let prevIndex = index - 1;
        while (
          this.excludedIndices.includes(nextIndex) ||
          this._items[nextIndex].el.el.disabled
        ) {
          nextIndex++;
          if (nextIndex >= this._items.length) {
            nextIndex = 0;
          }
        }
        while (
          this.excludedIndices.includes(prevIndex) ||
          this._items[prevIndex].el.el.disabled
        ) {
          prevIndex--;
          if (prevIndex < 0) {
            prevIndex = this._items.length - 1;
          }
        }
        // set the active item to the next or previous non-excluded item
        if (this.activeIndex < index) {
          this._setActiveItem(nextIndex);
        } else {
          this._setActiveItem(prevIndex);
        }
      } else {
        // set the focus item
        this._items[index].el.el.focus();
        this.activeIndex = index;
      }
    }
  },

  _onKeyDown: function (e) {
    if (!this._mapMenuVisible || e.key === 'Shift') return;

    if (e.code === 'Enter' || e.code === 'Tab' || e.code.startsWith('Arrow'))
      e.preventDefault();

    if (e.code === 'ArrowUp' || (e.shiftKey && e.code === 'Tab')) {
      if (
        !this._copySubMenu.hasAttribute('hidden') &&
        (document.activeElement.shadowRoot === null || //null happens when the focus is on submenu and when mouse hovers on main menu, submenu disappears
          document.activeElement.shadowRoot.activeElement.innerHTML ===
            this._copySubMenu.children[this._menuItems.CPYMENUMAP].innerHTML)
      ) {
        //"map" on submenu
        this._copySubMenu.children[this._menuItems.CPYMENULOC].focus();
      } else if (
        !this._copySubMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._copySubMenu.children[this._menuItems.CPYMENUEXTENT].innerHTML
      ) {
        //"extent" on submenu
        this._copySubMenu.children[this._menuItems.CPYMENUMAP].focus();
      } else if (
        !this._copySubMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._copySubMenu.children[this._menuItems.CPYMENULOC].innerHTML
      ) {
        //"Location" on submenu
        this._copySubMenu.children[this._menuItems.CPYMENUEXTENT].focus();
      } else if (
        !this._layerMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._layerMenu.children[this._menuItems.LYRZOOMTO].innerHTML
      ) {
        //"zoom to layer" on layermenu
        this._layerMenu.children[this._menuItems.LYRCOPY].focus();
      } else if (!this._layerMenu.hasAttribute('hidden')) {
        this._layerMenu.children[this._menuItems.LYRZOOMTO].focus();
      } else if (
        !this._extentLayerMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._extentLayerMenu.children[this._menuItems.LYRZOOMTO].innerHTML
      ) {
        //"zoom to extent" on layermenu
        this._extentLayerMenu.children[this._menuItems.LYRCOPY].focus();
      } else if (!this._extentLayerMenu.hasAttribute('hidden')) {
        this._extentLayerMenu.children[this._menuItems.LYRZOOMTO].focus();
      } else {
        if (this.activeIndex > 0) {
          let prevIndex = this.activeIndex - 1;
          while (this._items[prevIndex].el.el.disabled) {
            prevIndex--;
            if (prevIndex < 0) {
              prevIndex = this._items.length - 1;
            }
          }
          this._setActiveItem(prevIndex);
        } else {
          this._setActiveItem(this._items.length - 1);
        }
      }
    } else if (e.code === 'ArrowDown' || e.code === 'Tab') {
      if (
        !this._copySubMenu.hasAttribute('hidden') &&
        (document.activeElement.shadowRoot === null ||
          document.activeElement.shadowRoot.activeElement.innerHTML ===
            this._copySubMenu.children[this._menuItems.CPYMENULOC].innerHTML)
      ) {
        this._copySubMenu.children[this._menuItems.CPYMENUMAP].focus();
      } else if (
        !this._copySubMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._copySubMenu.children[this._menuItems.CPYMENUEXTENT].innerHTML
      ) {
        this._copySubMenu.children[this._menuItems.CPYMENULOC].focus();
      } else if (
        !this._copySubMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._copySubMenu.children[this._menuItems.CPYMENUMAP].innerHTML
      ) {
        this._copySubMenu.children[this._menuItems.CPYMENUEXTENT].focus();
      } else if (
        !this._layerMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._layerMenu.children[this._menuItems.LYRZOOMTO].innerHTML
      ) {
        this._layerMenu.children[this._menuItems.LYRCOPY].focus();
      } else if (!this._layerMenu.hasAttribute('hidden')) {
        this._layerMenu.children[this._menuItems.LYRZOOMTO].focus();
      } else if (
        !this._extentLayerMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._extentLayerMenu.children[this._menuItems.LYRZOOMTO].innerHTML
      ) {
        this._extentLayerMenu.children[this._menuItems.LYRCOPY].focus();
      } else if (!this._extentLayerMenu.hasAttribute('hidden')) {
        this._extentLayerMenu.children[this._menuItems.LYRZOOMTO].focus();
      } else {
        if (this.activeIndex < this._items.length - 1) {
          //edge case at index 0
          if (
            !this.isRunned &&
            this.activeIndex === 0 &&
            !this._items[this.activeIndex].el.el.disabled
          ) {
            this._setActiveItem(0);
            this.isRunned = true;
          } else {
            //edge case over
            let nextIndex = this.activeIndex + 1;
            while (this._items[nextIndex].el.el.disabled) {
              nextIndex++;
              if (nextIndex >= this._items.length) {
                nextIndex = 0;
              }
            }
            this._setActiveItem(nextIndex);
          }
        } else {
          let nextIndex = 0;
          while (this._items[nextIndex].el.el.disabled) {
            nextIndex++;
            if (nextIndex >= this._items.length) {
              nextIndex = 0;
            }
          }
          this._setActiveItem(nextIndex);
        }
      }
    } else if (e.code === 'ArrowRight') {
      if (
        document.activeElement.shadowRoot !== null &&
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._items[this._menuItems.CTXCOPY].el.el.innerHTML && //'copy'
        this._copySubMenu.hasAttribute('hidden')
      ) {
        this._showCopySubMenu();
        this._copySubMenu.children[0].focus();
      } else if (
        document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._items[this._menuItems.CTXCOPY].el.el.innerHTML &&
        !this._copySubMenu.hasAttribute('hidden')
      ) {
        this._copySubMenu.children[0].focus();
      }
    } else if (e.code === 'ArrowLeft') {
      if (
        !this._copySubMenu.hasAttribute('hidden') &&
        document.activeElement.shadowRoot !== null
      ) {
        if (
          document.activeElement.shadowRoot.activeElement.innerHTML ===
            this._copySubMenu.children[this._menuItems.CPYMENUMAP].innerHTML ||
          document.activeElement.shadowRoot.activeElement.innerHTML ===
            this._copySubMenu.children[this._menuItems.CPYMENUEXTENT]
              .innerHTML ||
          document.activeElement.shadowRoot.activeElement.innerHTML ===
            this._copySubMenu.children[this._menuItems.CPYMENULOC].innerHTML
        ) {
          this._copySubMenu.setAttribute('hidden', '');
          this._setActiveItem(this._menuItems.CTXCOPY);
        }
      }
    } else if (e.code === 'Escape') {
      if (this._layerMenuTabs || this._extentLayerMenuTabs) {
        DomEvent.stop(e);
        this._focusOnLayerControl();
        return;
      }
      if (document.activeElement.shadowRoot === null) {
        this._hide();
      } else {
        if (!this._copySubMenu.hasAttribute('hidden')) {
          if (
            document.activeElement.shadowRoot.activeElement.innerHTML ===
              this._copySubMenu.children[this._menuItems.CPYMENUMAP]
                .innerHTML ||
            document.activeElement.shadowRoot.activeElement.innerHTML ===
              this._copySubMenu.children[this._menuItems.CPYMENUEXTENT]
                .innerHTML ||
            document.activeElement.shadowRoot.activeElement.innerHTML ===
              this._copySubMenu.children[this._menuItems.CPYMENULOC].innerHTML
          ) {
            this._copySubMenu.setAttribute('hidden', '');
            this._setActiveItem(this._menuItems.CTXCOPY);
          }
        } else {
          this._hide();
        }
      }
    } else if (
      e.code !== 'KeyC' &&
      document.activeElement.shadowRoot.activeElement.innerHTML !==
        this._items[this._menuItems.CTXCOPY].el.el.innerHTML
    ) {
      this._hide();
    }
    // using KeyboardEvent.code for its mnemonics and case-independence
    switch (e.code) {
      case 'Enter':
        if (
          document.activeElement.shadowRoot.activeElement.innerHTML ===
          this._items[this._menuItems.CTXCOPY].el.el.innerHTML
        ) {
          this._copyCoords({
            latlng: this._map.getCenter()
          });
          this._copySubMenu.firstChild.focus();
        } else {
          if (
            this._map._container.parentNode.activeElement.parentNode.classList.contains(
              'mapml-contextmenu'
            )
          )
            this._map._container.parentNode.activeElement.click();
        }
        break;
      case 'Space':
        if (
          this._map._container.parentNode.activeElement.parentNode.classList.contains(
            'mapml-contextmenu'
          )
        )
          this._map._container.parentNode.activeElement.click();
        break;
      case 'KeyC':
        this._copyCoords({
          latlng: this._map.getCenter()
        });
        this._copySubMenu.firstChild.focus();
        break;
      case 'KeyD':
        this._toggleDebug(e);
        break;
      case 'KeyM':
        this._copyMapML(e);
        break;
      case 'KeyL':
        if (this._layerClicked.className.includes('mapml-layer-item')) {
          this._copyLayer(e);
        } else if (this._layerClicked.className.includes('mapml-extent-item')) {
          this._copyMapExtent(e);
        }
        break;
      case 'KeyF':
        this._toggleFullScreen(e);
        break;
      case 'KeyP':
        this._paste(e);
        break;
      case 'KeyT':
        this._toggleControls(e);
        break;
      case 'KeyV':
        this._viewSource(e);
        break;
      case 'KeyZ':
        if (this._layerClicked.className.includes('mapml-layer-item')) {
          this._zoomToLayer(e);
        } else if (this._layerClicked.className.includes('mapml-extent-item')) {
          this._zoomToMapExtent(e);
        }
        break;
    }
  },

  _showCopySubMenu: function (e) {
    let mapSize = this._map.getSize(),
      click = this._clickEvent,
      menu = this._copySubMenu,
      copyEl = this._items[5].el.el;

    copyEl.setAttribute('aria-expanded', 'true');
    menu.removeAttribute('hidden');

    const menuWidth = this._container.offsetWidth,
      menuHeight = this._container.offsetHeight,
      submenuWidth = menu.offsetWidth;
    if (click.containerPoint.x + menuWidth + submenuWidth > mapSize.x) {
      menu.style.left = 'auto';
      menu.style.right = menuWidth + 'px';
    } else {
      menu.style.left = menuWidth + 'px';
      menu.style.right = 'auto';
    }

    menu.style.top = 100 - 22 + 'px';
    menu.style.bottom = 'auto';
  },

  _hideCopySubMenu: function (e) {
    if (
      !e.relatedTarget ||
      !e.relatedTarget.parentElement ||
      e.relatedTarget.parentElement.classList.contains('mapml-submenu') ||
      e.relatedTarget.classList.contains('mapml-submenu')
    )
      return;
    let menu = this._copySubMenu,
      copyEl = this._items[4].el.el;
    copyEl.setAttribute('aria-expanded', 'false');
    menu.setAttribute('hidden', '');
    this.noActiveEl = true; //variable to keep track of no focus element on contextmenu, bug fix for arrow key navigation
  },

  _onItemMouseOver: function (e) {
    DomUtil.addClass(e.target || e.srcElement, 'over');
    let locale = e.locale || M.options.locale;
    if (e.srcElement.innerText === locale.cmCopyCoords + ' (C)')
      this._showCopySubMenu(e);
  },

  _onItemMouseOut: function (e) {
    DomUtil.removeClass(e.target || e.srcElement, 'over');
    this._hideCopySubMenu(e);
  },

  toggleContextMenuItem: function (options, state) {
    options = options.toUpperCase();
    if (state === 'disabled') {
      if (options === 'CONTROLS') {
        this._items[8].el.el.disabled = true;
      } else if (options === 'BACK') {
        this._items[0].el.el.disabled = true;
      } else if (options === 'FORWARD') {
        this._items[1].el.el.disabled = true;
      } else if (options === 'RELOAD') {
        this._items[2].el.el.disabled = true;
      }
    } else if (state === 'enabled') {
      if (options === 'CONTROLS') {
        this._items[8].el.el.disabled = false;
      } else if (options === 'BACK') {
        this._items[0].el.el.disabled = false;
      } else if (options === 'FORWARD') {
        this._items[1].el.el.disabled = false;
      } else if (options === 'RELOAD') {
        this._items[2].el.el.disabled = false;
      }
    }
  },

  setViewFullScreenInnerHTML: function (options) {
    if (options === 'view') {
      this._map.contextMenu._items[3].el.el.innerHTML =
        this._map.options.mapEl.locale.btnFullScreen + ' (<kbd>F</kbd>)';
    } else if (options === 'exit') {
      this._map.contextMenu._items[3].el.el.innerHTML =
        this._map.options.mapEl.locale.btnExitFullScreen + ' (<kbd>F</kbd>)';
    }
  }
});
