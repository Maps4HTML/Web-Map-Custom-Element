export const Util = {
  // _convertAndFormatPCRS returns the converted CRS and formatted pcrsBounds in gcrs, pcrs, tcrs, and tilematrix. Used for setting extent for the map and layer (map.extent, layer.extent).
  // _convertAndFormatPCRS: L.Bounds, _map, projection -> {...}
  _convertAndFormatPCRS: function (pcrsBounds, crs, projection) {
    if (!pcrsBounds || !crs) return {};

    let tcrsTopLeft = [],
      tcrsBottomRight = [],
      tileMatrixTopLeft = [],
      tileMatrixBottomRight = [],
      tileSize = crs.options.crs.tile.bounds.max.y;

    for (let i = 0; i < crs.options.resolutions.length; i++) {
      let scale = crs.scale(i),
        minConverted = crs.transformation.transform(pcrsBounds.min, scale),
        maxConverted = crs.transformation.transform(pcrsBounds.max, scale);

      tcrsTopLeft.push({
        horizontal: minConverted.x,
        vertical: maxConverted.y
      });
      tcrsBottomRight.push({
        horizontal: maxConverted.x,
        vertical: minConverted.y
      });

      //converts the tcrs values from earlier to tilematrix
      tileMatrixTopLeft.push({
        horizontal: tcrsTopLeft[i].horizontal / tileSize,
        vertical: tcrsTopLeft[i].vertical / tileSize
      });
      tileMatrixBottomRight.push({
        horizontal: tcrsBottomRight[i].horizontal / tileSize,
        vertical: tcrsBottomRight[i].vertical / tileSize
      });
    }

    //converts the gcrs, I believe it can take any number values from -inf to +inf
    let unprojectedMin = crs.unproject(pcrsBounds.min),
      unprojectedMax = crs.unproject(pcrsBounds.max);

    let gcrs = {
      topLeft: {
        horizontal: unprojectedMin.lng,
        vertical: unprojectedMax.lat
      },
      bottomRight: {
        horizontal: unprojectedMax.lng,
        vertical: unprojectedMin.lat
      }
    };

    //formats known pcrs bounds to correct format
    let pcrs = {
      topLeft: {
        horizontal: pcrsBounds.min.x,
        vertical: pcrsBounds.max.y
      },
      bottomRight: {
        horizontal: pcrsBounds.max.x,
        vertical: pcrsBounds.min.y
      }
    };

    //formats all extent data
    let extent = {
      topLeft: {
        tcrs: tcrsTopLeft,
        tilematrix: tileMatrixTopLeft,
        gcrs: gcrs.topLeft,
        pcrs: pcrs.topLeft
      },
      bottomRight: {
        tcrs: tcrsBottomRight,
        tilematrix: tileMatrixBottomRight,
        gcrs: gcrs.bottomRight,
        pcrs: pcrs.bottomRight
      }
    };
    if (projection) {
      extent.projection = projection;
    }
    return extent;
  },
  // extentToBounds: returns bounds in gcrs, pcrs. Used for setting bounds for the map (map.totalLayerBounds).
  // extentToBounds: {...}, crs -> L.Bounds / L.LatlngBounds
  extentToBounds(extent, crs) {
    switch (crs.toUpperCase()) {
      case 'PCRS':
        return L.bounds(
          L.point(extent.topLeft.pcrs.horizontal, extent.topLeft.pcrs.vertical),
          L.point(
            extent.bottomRight.pcrs.horizontal,
            extent.bottomRight.pcrs.vertical
          )
        );
      case 'GCRS':
        return L.latLngBounds(
          L.latLng(
            extent.topLeft.gcrs.vertical,
            extent.topLeft.gcrs.horizontal
          ),
          L.latLng(
            extent.bottomRight.gcrs.vertical,
            extent.bottomRight.gcrs.horizontal
          )
        );
    }
  },

  // axisToCS returns the CRS when given the axis:
  // https://maps4html.org/web-map-doc/docs/elements/input/#axis
  // axisToCS: (Axis String) -> (CRS String)
  axisToCS: function (axis) {
    try {
      switch (axis.toLowerCase()) {
        case 'row':
        case 'column':
          return 'TILEMATRIX';
        case 'i':
        case 'j':
          return ['MAP', 'TILE'];
        case 'x':
        case 'y':
          return 'TCRS';
        case 'latitude':
        case 'longitude':
          return 'GCRS';
        case 'northing':
        case 'easting':
          return 'PCRS';
        default:
          return M.FALLBACK_CS;
      }
    } catch (e) {
      return undefined;
    }
  },

  // csToAxes takes a given cs and retuns the axes, first horizontal then vertical
  // https://maps4html.org/web-map-doc/docs/elements/input/#axis
  // csToAxes: (CRS String) -> [(horizontal axis String), (Vertical axis String)]
  csToAxes: function (cs) {
    try {
      switch (cs.toLowerCase()) {
        case 'tilematrix':
          return ['column', 'row'];
        case 'map':
        case 'tile':
          return ['i', 'j'];
        case 'tcrs':
          return ['x', 'y'];
        case 'gcrs':
          return ['longitude', 'latitude'];
        case 'pcrs':
          return ['easting', 'northing'];
      }
    } catch (e) {
      return undefined;
    }
  },

  // axisToXY takes horizontal axis and returns 'x', or takes vertical axis and returns 'y'
  // https://maps4html.org/web-map-doc/docs/elements/input/#axis
  // axisToXY: (Axis String) -> 'x' or 'y'
  axisToXY: function (axis) {
    try {
      switch (axis.toLowerCase()) {
        case 'i':
        case 'column':
        case 'longitude':
        case 'x':
        case 'easting':
          return 'x';
        case 'row':
        case 'j':
        case 'latitude':
        case 'y':
        case 'northing':
          return 'y';

        default:
          return undefined;
      }
    } catch (e) {
      return undefined;
    }
  },

  // convertPCRSBounds converts pcrsBounds to the given cs Bounds.
  // convertPCRSBounds: L.Bounds, Int, L.CRS, Str('PCRS'|'TCRS'|'TILEMATRIX'|'GCRS') -> L.Bounds
  convertPCRSBounds: function (pcrsBounds, zoom, projection, cs) {
    if (
      !pcrsBounds ||
      (!zoom && zoom !== 0) ||
      !Number.isFinite(+zoom) ||
      !projection ||
      !cs
    )
      return undefined;
    projection = typeof projection === 'string' ? M[projection] : projection;
    switch (cs.toUpperCase()) {
      case 'PCRS':
        return pcrsBounds;
      case 'TCRS':
      case 'TILEMATRIX':
        let minPixel = projection.transformation.transform(
            pcrsBounds.min,
            projection.scale(+zoom)
          ),
          maxPixel = projection.transformation.transform(
            pcrsBounds.max,
            projection.scale(+zoom)
          );
        if (cs.toUpperCase() === 'TCRS') return L.bounds(minPixel, maxPixel);
        let tileSize = projection.options.crs.tile.bounds.max.x;
        return L.bounds(
          L.point(minPixel.x / tileSize, minPixel.y / tileSize),
          L.point(maxPixel.x / tileSize, maxPixel.y / tileSize)
        );
      case 'GCRS':
        let minGCRS = projection.unproject(pcrsBounds.min),
          maxGCRS = projection.unproject(pcrsBounds.max);
        return L.bounds(
          L.point(minGCRS.lng, minGCRS.lat),
          L.point(maxGCRS.lng, maxGCRS.lat)
        );
      default:
        return undefined;
    }
  },

  // pointToPCRSPoint takes a point, with a projection and cs and converts it to a pcrs L.point/L.latLng
  //pointToPCRSPoint: L.Point, Int, L.CRS, Str('PCRS'|'TCRS'|'TILEMATRIX'|'GCRS') -> L.point|L.latLng
  pointToPCRSPoint: function (point, zoom, projection, cs) {
    if (
      !point ||
      (zoom !== undefined && !Number.isFinite(+zoom)) ||
      (zoom === undefined &&
        (cs === 'TILEMATRIX' || cs === 'TCRS' || cs === 'TILE')) ||
      !cs ||
      !projection
    )
      return undefined;
    projection = typeof projection === 'string' ? M[projection] : projection;
    let tileSize = projection.options.crs.tile.bounds.max.x;
    switch (cs.toUpperCase()) {
      case 'TILEMATRIX':
        return Util.pixelToPCRSPoint(
          L.point(point.x * tileSize, point.y * tileSize),
          zoom,
          projection
        );
      case 'PCRS':
        return point;
      case 'TCRS' || 'TILE':
        return Util.pixelToPCRSPoint(point, zoom, projection);
      case 'GCRS':
        return projection.project(L.latLng(point.y, point.x));
      default:
        return undefined;
    }
  },

  // pixelToPCRSPoint takes a pixel L.point, the zoom and projection and returns a L.point in pcrs
  // pixelToPCRSPoint: L.Point, Int, L.CRS|Str -> L.point
  pixelToPCRSPoint: function (point, zoom, projection) {
    if (
      !point ||
      (!zoom && zoom !== 0) ||
      !Number.isFinite(+zoom) ||
      !projection
    )
      return undefined;
    projection = typeof projection === 'string' ? M[projection] : projection;
    return projection.transformation.untransform(point, projection.scale(zoom));
  },

  // boundsToPCRSBounds converts bounds with projection and cs to PCRS bounds
  // boundsToPCRSBounds: L.bounds, Int, L.CRS|Str, Str('PCRS'|'TCRS'|'TILEMATRIX'|'GCRS') -> L.bounds
  boundsToPCRSBounds: function (bounds, zoom, projection, cs) {
    if (
      !bounds ||
      !bounds.max ||
      !bounds.min ||
      (zoom !== undefined && !Number.isFinite(+zoom)) ||
      (zoom === undefined &&
        (cs === 'TILEMATRIX' || cs === 'TCRS' || cs === 'TILE')) ||
      !projection ||
      !cs
    )
      return undefined;
    projection = typeof projection === 'string' ? M[projection] : projection;
    return L.bounds(
      Util.pointToPCRSPoint(bounds.min, zoom, projection, cs),
      Util.pointToPCRSPoint(bounds.max, zoom, projection, cs)
    );
  },

  //L.bounds have fixed point positions, where min is always topleft, max is always bottom right, and the values are always sorted by leaflet
  //important to consider when working with pcrs where the origin is not topleft but rather bottomleft, could lead to confusion
  pixelToPCRSBounds: function (bounds, zoom, projection) {
    if (
      !bounds ||
      !bounds.max ||
      !bounds.min ||
      (!zoom && zoom !== 0) ||
      !Number.isFinite(+zoom) ||
      !projection
    )
      return undefined;
    projection = typeof projection === 'string' ? M[projection] : projection;
    return L.bounds(
      Util.pixelToPCRSPoint(bounds.min, zoom, projection),
      Util.pixelToPCRSPoint(bounds.max, zoom, projection)
    );
  },

  //meta content is the content attribute of meta
  // input "max=5,min=4" => [[max,5][min,5]]
  _metaContentToObject: function (input) {
    if (!input || input instanceof Object) return {};
    let content = input.split(/\s+/).join('');
    let contentArray = {};
    let stringSplit = content.split(',');

    for (let i = 0; i < stringSplit.length; i++) {
      let prop = stringSplit[i].split('=');
      if (prop.length === 2) contentArray[prop[0]] = prop[1];
    }
    if (contentArray !== '' && stringSplit[0].split('=').length === 1)
      contentArray.content = stringSplit[0];
    return contentArray;
  },

  // _coordsToArray returns an array of arrays of coordinate pairs
  // _coordsToArray: ("1,2,3,4") -> [[1,2],[3,4]]
  _coordsToArray: function (containerPoints) {
    for (
      var i = 1, pairs = [], coords = containerPoints.split(',');
      i < coords.length;
      i += 2
    ) {
      pairs.push([parseInt(coords[i - 1]), parseInt(coords[i])]);
    }
    return pairs;
  },

  // _splitCoordinate splits string coordinates to an array as floating point numbers
  _splitCoordinate: function (element, index, array) {
    var a = [];
    element.split(/\s+/gim).forEach(Util._parseNumber, a);
    this.push(a);
  },

  // _parseNumber parses a string as a floating point number, helper function for _splitCoordinate
  _parseNumber: function (element, index, array) {
    this.push(parseFloat(element));
  },

  // _handleLink handles map-a links, when clicked on a map-a link
  _handleLink: function (link, leafletLayer) {
    let zoomTo,
      justPan = false,
      layer,
      map = leafletLayer._map,
      opacity;
    if (link.type === 'text/html' && link.target !== '_blank') {
      // all other target values other than blank behave as _top
      link.target = '_top';
    } else if (link.type !== 'text/html' && link.url.includes('#')) {
      let hash = link.url.split('#'),
        loc = hash[1].split(',');
      zoomTo = { z: loc[0] || 0, lng: loc[1] || 0, lat: loc[2] || 0 };
      justPan = !hash[0]; // if the first half of the array is an empty string then the link is just for panning
      if (['/', '.', '#'].includes(link.url[0])) link.target = '_self';
    }
    if (!justPan) {
      layer = document.createElement('layer-');
      layer.setAttribute('src', link.url);
      layer.setAttribute('checked', '');
      switch (link.target) {
        case '_blank':
          if (link.type === 'text/html') {
            window.open(link.url);
          } else {
            postTraversalSetup();
            map.options.mapEl.appendChild(layer);
          }
          break;
        case '_parent':
          postTraversalSetup();
          for (let l of map.options.mapEl.querySelectorAll('layer-'))
            if (l._layer !== leafletLayer) map.options.mapEl.removeChild(l);
          map.options.mapEl.appendChild(layer);
          map.options.mapEl.removeChild(leafletLayer._layerEl);
          break;
        case '_top':
          window.location.href = link.url;
          break;
        default:
          postTraversalSetup();
          opacity = leafletLayer._layerEl.opacity;
          leafletLayer._layerEl.insertAdjacentElement('beforebegin', layer);
          map.options.mapEl.removeChild(leafletLayer._layerEl);
      }
    } else if (zoomTo && !link.inPlace && justPan) {
      leafletLayer._map.options.mapEl.zoomTo(
        +zoomTo.lat,
        +zoomTo.lng,
        +zoomTo.z
      );
      if (opacity) layer.opacity = opacity;
      map.getContainer().focus();
    }

    function postTraversalSetup() {
      // when the projection is changed as part of the link traversal process,
      // it's necessary to set the map viewer's lat, lon and zoom NOW, so that
      // the promises that are created when the viewer's projection is changed
      // can use the viewer's lat, lon and zoom properties that were in effect
      // before the projection change i.e. in the closure for that code
      // see mapml-viewer / map is=web-map projection attributeChangedCallback
      // specifically required for use cases like changing projection after
      // link traversal, e.g. BC link here https://maps4html.org/experiments/linking/features/
      if (!link.inPlace && zoomTo) updateMapZoomTo(zoomTo);
      // the layer is newly created, so have to wait until it's fully init'd
      // before setting properties.
      layer.whenReady().then(() => {
        // if the map projection isnt' changed by link traversal, it's necessary
        // to perform pan/zoom operations after the layer is ready
        if (!link.inPlace && zoomTo)
          layer.parentElement.zoomTo(+zoomTo.lat, +zoomTo.lng, +zoomTo.z);
        else if (!link.inPlace) layer.zoomTo();
        // not sure if this is necessary
        if (opacity) layer.opacity = opacity;
        // this is necessary to display the FeatureIndexOverlay, I believe
        map.getContainer().focus();
      });
    }

    function updateMapZoomTo(zoomTo) {
      // can't use mapEl.zoomTo(...) here, it's too slow!
      map.options.mapEl.lat = +zoomTo.lat;
      map.options.mapEl.lon = +zoomTo.lng;
      map.options.mapEl.zoom = +zoomTo.z;
    }
  },
  getBoundsFromMeta: function (mapml) {
    if (!mapml) return null;
    let cs,
      pseudo = mapml instanceof ShadowRoot ? ':host' : ':scope',
      projection =
        (mapml.querySelector(pseudo + ' > map-meta[name=projection]') &&
          Util._metaContentToObject(
            mapml
              .querySelector(pseudo + ' > map-meta[name=projection]')
              .getAttribute('content')
          ).content.toUpperCase()) ||
        M.FALLBACK_PROJECTION;
    try {
      let meta =
        mapml.querySelector(pseudo + ' > map-meta[name=extent]') &&
        Util._metaContentToObject(
          mapml
            .querySelector(pseudo + ' > map-meta[name=extent]')
            .getAttribute('content')
        );

      let zoom = meta.zoom;

      let metaKeys = Object.keys(meta);
      for (let i = 0; i < metaKeys.length; i++) {
        if (!metaKeys[i].includes('zoom')) {
          cs = Util.axisToCS(metaKeys[i].split('-')[2]);
          break;
        }
      }
      // this could happen if the content didn't match the grammar for map-meta[name=extent]
      if (cs === undefined) throw new Error('cs undefined when getting bounds');

      // when cs is tilematrix, tcrs or tile, zoom is required.
      // should throw / return null instead of trying to construct a bounds

      if (
        zoom === undefined &&
        (cs === 'TILEMATRIX' || cs === 'TCRS' || cs === 'TILE')
      )
        throw new Error(
          'map-meta[name=extent] zoom= parameter not provided for tcrs,tile or tilematrix bounds'
        );
      let axes = Util.csToAxes(cs);
      return Util.boundsToPCRSBounds(
        L.bounds(
          L.point(+meta[`top-left-${axes[0]}`], +meta[`top-left-${axes[1]}`]),
          L.point(
            +meta[`bottom-right-${axes[0]}`],
            +meta[`bottom-right-${axes[1]}`]
          )
        ),
        zoom,
        projection,
        cs
      );
    } catch (error) {
      //if error then by default set the layer to osm and bounds to the entire map view
      return Util.boundsToPCRSBounds(
        M[projection].options.crs.tilematrix.bounds(0),
        0,
        projection,
        cs
      );
    }
  },
  /**
   * TODO Review and improve design logic with Aliyan
   *
   * Parses object from <map-meta name="zoom" content="...">
   * @param {type} mapml
   * @returns {minZoom, maxZoom, minNativeZoom, maxNativeZoom}
   */
  getZoomBoundsFromMeta: function (mapml) {
    if (!mapml) return null;
    let pseudo = mapml instanceof ShadowRoot ? ':host' : ':scope';

    let meta = Util._metaContentToObject(
      mapml
        .querySelector(pseudo + '> map-meta[name=zoom]')
        .getAttribute('content')
    );
    if (meta.min && meta.max && meta.value)
      return {
        minZoom: +meta.min,
        maxZoom: +meta.max,
        minNativeZoom: +meta.value,
        maxNativeZoom: +meta.value
      };
    else if (meta.min && meta.max)
      return {
        minZoom: +meta.min,
        maxZoom: +meta.max
      };
    else if (meta.min)
      return {
        minZoom: +meta.min
      };
    else if (meta.max)
      return {
        maxZoom: +meta.max
      };
  },
  getZoomBounds: function (mapml, nativeZoom) {
    if (!mapml) return null;
    let nMin = 100,
      nMax = 0,
      features = mapml.querySelectorAll('map-feature'),
      meta,
      projection;
    for (let i = 0; i < features.length; i++) {
      let lZoom = +features[i].getAttribute('zoom');
      if (!features[i].getAttribute('zoom')) lZoom = nativeZoom;
      nMax = Math.max(nMax, lZoom);
      nMin = Math.min(nMin, lZoom);
    }
    try {
      projection = Util._metaContentToObject(
        mapml.querySelector('map-meta[name=projection]').getAttribute('content')
      ).content;
      meta = Util._metaContentToObject(
        mapml.querySelector('map-meta[name=zoom]').getAttribute('content')
      );
    } catch (error) {
      return {
        minZoom: 0,
        maxZoom:
          M[projection || M.FALLBACK_PROJECTION].options.resolutions.length - 1,
        minNativeZoom: nMin,
        maxNativeZoom: nMax
      };
    }
    return {
      minZoom: +meta.min,
      maxZoom: +meta.max,
      minNativeZoom: nMin,
      maxNativeZoom: nMax
    };
  },
  // getNativeVariables: returns an object with the native zoom and CS,
  //                     based on the map-metas that are available within
  //                     the layer or the fallback default values.
  // getNativeVariables: mapml-||layer-||null||[map-feature,...] -> {zoom: _, val: _}
  // mapml can be a mapml- element, layer- element, null, or an array of map-features
  getNativeVariables: function (mapml) {
    let nativeZoom, nativeCS;
    // when mapml is an array of features provided by the query
    if (
      mapml.length &&
      mapml[0].parentElement.parentElement &&
      mapml[0].parentElement.parentElement.tagName === 'mapml-'
    ) {
      let mapmlEl = mapml[0].parentElement.parentElement;
      nativeZoom =
        (mapmlEl.querySelector &&
          mapmlEl.querySelector('map-meta[name=zoom]') &&
          +Util._metaContentToObject(
            mapmlEl.querySelector('map-meta[name=zoom]').getAttribute('content')
          ).value) ||
        0;
      nativeCS =
        (mapmlEl.querySelector &&
          mapmlEl.querySelector('map-meta[name=cs]') &&
          Util._metaContentToObject(
            mapmlEl.querySelector('map-meta[name=cs]').getAttribute('content')
          ).content) ||
        'GCRS';
    } else {
      // when mapml is null or a layer-/mapml- element
      nativeZoom =
        (mapml.querySelector &&
          mapml.querySelector('map-meta[name=zoom]') &&
          +Util._metaContentToObject(
            mapml.querySelector('map-meta[name=zoom]').getAttribute('content')
          ).value) ||
        0;
      nativeCS =
        (mapml.querySelector &&
          mapml.querySelector('map-meta[name=cs]') &&
          Util._metaContentToObject(
            mapml.querySelector('map-meta[name=cs]').getAttribute('content')
          ).content) ||
        'GCRS';
    }
    return { zoom: nativeZoom, cs: nativeCS };
  },

  // _gcrsToTileMatrix returns the [column, row] of the tiles at map center. Used for Announce movement for screen readers
  // _gcrsToTileMatrix: map/mapml-viewer -> [column, row]
  _gcrsToTileMatrix: function (mapEl) {
    let point = mapEl._map.project(mapEl._map.getCenter());
    let tileSize = mapEl._map.options.crs.options.crs.tile.bounds.max.y;
    let column = Math.trunc(point.x / tileSize);
    let row = Math.trunc(point.y / tileSize);
    return [column, row];
  },

  // Pastes text to a mapml-viewer/map element(mapEl), text can be a mapml link, geojson, or a layer-
  //    used for pasting layers through ctrl+v, drag/drop, and pasting through the contextmenu
  // _pasteLayer: HTMLElement Str -> None
  // Effects: append a layer- element to mapEl, if it is valid
  _pasteLayer: async function (mapEl, text) {
    try {
      // try to process text as a link
      new URL(text);
      // get the content type of the link
      const response = await fetch(text);
      const contentType = response.headers.get('Content-Type');
      if (
        contentType == 'application/json' ||
        contentType == 'application/geo+json'
      ) {
        // try to process as GeoJSON
        const textContent = await response.text();
        try {
          mapEl.geojson2mapml(JSON.parse(textContent));
        } catch {
          console.log('Invalid link!');
        }
      } else {
        // try to process as a mapml file
        // create a new <layer-> child of the <mapml-viewer> element
        let l =
          '<layer- src="' +
          text +
          '" label="' +
          M.options.locale.dfLayer +
          '" checked=""></layer->';
        mapEl.insertAdjacentHTML('beforeend', l);
        mapEl.lastElementChild.whenReady().catch(() => {
          if (mapEl) {
            // should invoke lifecyle callbacks automatically by removing it from DOM
            mapEl.removeChild(mapEl.lastChild);
          }
          // garbage collect it
          l = null;
        });
      }
    } catch (err) {
      text = text
        .replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '')
        .trim();
      if (text.slice(0, 7) === '<layer-' && text.slice(-9) === '</layer->') {
        mapEl.insertAdjacentHTML('beforeend', text);
      } else if (
        text.slice(0, 12) === '<map-feature' &&
        text.slice(-14) === '</map-feature>'
      ) {
        let layer =
          `<layer- label="${M.options.locale.dfPastedLayer}" checked>
                       <map-meta name='projection' content='${mapEl.projection}'></map-meta>` +
          text +
          '</layer->';
        mapEl.insertAdjacentHTML('beforeend', layer);
      } else {
        try {
          mapEl.geojson2mapml(JSON.parse(text));
        } catch {
          console.log('Invalid Input!');
        }
      }
    }
  },

  // Takes GeoJSON Properties to return an HTML table, helper function
  //    for geojson2mapml
  // _properties2Table: geojsonPropertiesOBJ -> HTML Table
  _properties2Table: function (json) {
    let table = document.createElement('table');

    // Creating a Table Header
    let thead = table.createTHead();
    let row = thead.insertRow();
    let th1 = document.createElement('th');
    let th2 = document.createElement('th');
    th1.appendChild(document.createTextNode('Property name'));
    th2.appendChild(document.createTextNode('Property value'));
    th1.setAttribute('role', 'columnheader');
    th2.setAttribute('role', 'columnheader');
    th1.setAttribute('scope', 'col');
    th2.setAttribute('scope', 'col');
    row.appendChild(th1);
    row.appendChild(th2);

    // Creating table body and populating it from the JSON
    let tbody = table.createTBody();
    for (let key in json) {
      if (json.hasOwnProperty(key)) {
        let row = tbody.insertRow();
        let th = document.createElement('th');
        let td = document.createElement('td');
        th.appendChild(document.createTextNode(key));
        td.appendChild(document.createTextNode(json[key]));
        th.setAttribute('scope', 'row');
        td.setAttribute('itemprop', key);
        row.appendChild(th);
        row.appendChild(td);
      }
    }
    return table;
  },

  // Takes bbox array and a x,y coordinate to possibly update the extent, returns extent
  //    for geojson2mapml
  // _updateExtent: [min x, min y, max x, max y], x, y -> [min x, min y, max x, max y]
  _updateExtent: function (bboxExtent, x, y) {
    if (bboxExtent === {}) {
      return bboxExtent;
    }
    bboxExtent[0] = Math.min(x, bboxExtent[0]);
    bboxExtent[1] = Math.min(y, bboxExtent[1]);
    bboxExtent[2] = Math.max(x, bboxExtent[2]);
    bboxExtent[3] = Math.max(y, bboxExtent[3]);
    return bboxExtent;
  },

  // Takes a GeoJSON geojson and an options Object which returns a <layer-> Element
  // The options object can contain the following:
  //      label            - String, contains the layer name, if included overrides the default label mapping
  //      projection       - String, contains the projection of the layer (OSMTILE, WGS84, CBMTILE, APSTILE), defaults to   OSMTILE
  //      caption          - Function | String, function accepts one argument being the feature object which produces the   featurecaption string OR a string that is the name of the property that will be mapped to featurecaption
  //      properties       - Function | String | HTMLElement, a function which maps the geojson feature to an HTMLElement   or a string that will be parsed as an HTMLElement or an HTMLElement
  //      geometryFunction - Function, A function you supply that can add classes, hyperlinks and spans to the created  <map-geometry> element, default would be the plain map-geometry element
  // geojson2mapml: geojson Object <layer-> [min x, min y, max x, max y] -> <layer->
  geojson2mapml: function (json, options = {}, layer = null, bboxExtent = {}) {
    let defaults = {
      label: null,
      projection: 'OSMTILE',
      caption: null,
      properties: null,
      geometryFunction: null
    };
    // assign default values for undefined options
    options = Object.assign({}, defaults, options);

    // If string json is received
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    let geometryType = [
      'POINT',
      'LINESTRING',
      'POLYGON',
      'MULTIPOINT',
      'MULTILINESTRING',
      'MULTIPOLYGON',
      'GEOMETRYCOLLECTION'
    ];
    let jsonType = json.type.toUpperCase();
    let out = '';
    let setExtent = false;

    // HTML parser
    let parser = new DOMParser();

    // initializing layer
    if (layer === null) {
      if (!json.bbox) {
        setExtent = true;
      }
      // creating an empty mapml layer
      let xmlStringLayer =
        "<layer- label='' checked><map-meta name='projection' content='" +
        options.projection +
        "'></map-meta><map-meta name='cs' content='gcrs'></map-meta></layer->";
      layer = parser.parseFromString(xmlStringLayer, 'text/html');
      //console.log(layer)
      if (options.label !== null) {
        layer.querySelector('layer-').setAttribute('label', options.label);
      } else if (json.name) {
        layer.querySelector('layer-').setAttribute('label', json.name);
      } else if (json.title) {
        layer.querySelector('layer-').setAttribute('label', json.title);
      } else {
        layer
          .querySelector('layer-')
          .setAttribute('label', M.options.locale.dfLayer);
      }
    }
    let point = '<map-point></map-point>';
    point = parser.parseFromString(point, 'text/html');

    let multiPoint =
      '<map-multipoint><map-coordinates></map-coordinates></map-multipoint>';
    multiPoint = parser.parseFromString(multiPoint, 'text/html');

    let linestring =
      '<map-linestring><map-coordinates></map-coordinates></map-linestring>';
    linestring = parser.parseFromString(linestring, 'text/html');

    let multilinestring = '<map-multilinestring></map-multilinestring>';
    multilinestring = parser.parseFromString(multilinestring, 'text/html');

    let polygon = '<map-polygon></map-polygon>';
    polygon = parser.parseFromString(polygon, 'text/html');

    let multiPolygon = '<map-multipolygon></map-multipolygon>';
    multiPolygon = parser.parseFromString(multiPolygon, 'text/html');

    let geometrycollection =
      '<map-geometrycollection></map-geometrycollection>';
    geometrycollection = parser.parseFromString(
      geometrycollection,
      'text/html'
    );

    let feature =
      '<map-feature><map-featurecaption></map-featurecaption><map-geometry></map-geometry><map-properties></map-properties></map-feature>';
    feature = parser.parseFromString(feature, 'text/html');

    // Template to add coordinates to Geometries
    let coords = '<map-coordinates></map-coordinates>';
    coords = parser.parseFromString(coords, 'text/html');

    //console.log(layer);
    if (jsonType === 'FEATURECOLLECTION') {
      // Setting bbox if it exists
      if (json.bbox) {
        layer
          .querySelector('layer-')
          .insertAdjacentHTML(
            'afterbegin',
            "<map-meta name='extent' content='top-left-longitude=" +
              json.bbox[0] +
              ', top-left-latitude=' +
              json.bbox[1] +
              ', bottom-right-longitude=' +
              json.bbox[2] +
              ',bottom-right-latitude=' +
              json.bbox[3] +
              "'></map-meta>"
          );
      } else {
        bboxExtent = [
          Infinity,
          Infinity,
          Number.NEGATIVE_INFINITY,
          Number.NEGATIVE_INFINITY
        ];
      }

      let features = json.features;
      //console.log("Features length - " + features.length);
      for (let l = 0; l < features.length; l++) {
        Util.geojson2mapml(features[l], options, layer, bboxExtent);
      }
    } else if (jsonType === 'FEATURE') {
      let clone_feature = feature.cloneNode(true);
      let curr_feature = clone_feature.querySelector('map-feature');

      // Setting bbox if it exists
      if (json.bbox) {
        layer
          .querySelector('layer-')
          .insertAdjacentHTML(
            'afterbegin',
            "<map-meta name='extent' content='top-left-longitude=" +
              json.bbox[0] +
              ', top-left-latitude=' +
              json.bbox[1] +
              ', bottom-right-longitude=' +
              json.bbox[2] +
              ',bottom-right-latitude=' +
              json.bbox[3] +
              "'></map-meta>"
          );
      } else if (
        typeof bboxExtent === 'object' &&
        bboxExtent.length === undefined
      ) {
        bboxExtent = [
          Infinity,
          Infinity,
          Number.NEGATIVE_INFINITY,
          Number.NEGATIVE_INFINITY
        ];
      }

      // Setting featurecaption
      let featureCaption = layer.querySelector('layer-').getAttribute('label');
      if (typeof options.caption === 'function') {
        featureCaption = options.caption(json);
      } else if (typeof options.caption === 'string') {
        featureCaption = json.properties[options.caption];
        // if property does not exist
        if (featureCaption === undefined) {
          featureCaption = options.caption;
        }
      } else if (json.id) {
        // when no caption option available try setting id as featurecaption
        featureCaption = json.id;
      }
      curr_feature.querySelector('map-featurecaption').innerHTML =
        featureCaption;

      // Setting Properties
      let p;
      // if properties function is passed
      if (typeof options.properties === 'function') {
        p = options.properties(json);
        // if function output is not an element, ignore the properties.
        if (!(p instanceof Element)) {
          p = false;
          console.error(
            'options.properties function returns a string instead of an HTMLElement.'
          );
        }
      } else if (typeof options.properties === 'string') {
        // if properties string is passed
        curr_feature
          .querySelector('map-properties')
          .insertAdjacentHTML('beforeend', options.properties);
        p = false;
      } else if (options.properties instanceof HTMLElement) {
        // if an HTMLElement is passed - NOT TESTED
        p = options.properties;
      } else {
        // If no properties function, string or HTMLElement is passed
        p = Util._properties2Table(json.properties);
      }

      if (p) {
        curr_feature.querySelector('map-properties').appendChild(p);
      }

      // Setting map-geometry
      let g = Util.geojson2mapml(json.geometry, options, layer, bboxExtent);
      if (typeof options.geometryFunction === 'function') {
        curr_feature
          .querySelector('map-geometry')
          .appendChild(options.geometryFunction(g, json));
      } else {
        curr_feature.querySelector('map-geometry').appendChild(g);
      }

      // Appending feature to layer
      layer.querySelector('layer-').appendChild(curr_feature);
    } else if (geometryType.includes(jsonType)) {
      //console.log("Geometry Type - " + jsonType);
      switch (jsonType) {
        case 'POINT':
          bboxExtent = Util._updateExtent(
            bboxExtent,
            json.coordinates[0],
            json.coordinates[1]
          );
          out = json.coordinates[0] + ' ' + json.coordinates[1];

          // Create Point element
          let clone_point = point.cloneNode(true);
          clone_point = clone_point.querySelector('map-point');

          // Create map-coords to add to the polygon
          let clone_coords = coords.cloneNode(true);
          clone_coords = clone_coords.querySelector('map-coordinates');

          clone_coords.innerHTML = out;

          clone_point.appendChild(clone_coords);
          //console.log(clone_point);
          return clone_point;

        case 'LINESTRING':
          let clone_linestring = linestring.cloneNode(true);
          let linestring_coordindates =
            clone_linestring.querySelector('map-coordinates');

          out = '';

          for (let x = 0; x < json.coordinates.length; x++) {
            bboxExtent = Util._updateExtent(
              bboxExtent,
              json.coordinates[x][0],
              json.coordinates[x][1]
            );
            out =
              out + json.coordinates[x][0] + ' ' + json.coordinates[x][1] + ' ';
          }

          linestring_coordindates.innerHTML = out;
          //console.log(clone_linestring.querySelector('map-linestring'));
          return clone_linestring.querySelector('map-linestring');

        case 'POLYGON':
          let clone_polygon = polygon.cloneNode(true);
          clone_polygon = clone_polygon.querySelector('map-polygon');

          // Going over each coordinates
          for (let y = 0; y < json.coordinates.length; y++) {
            let out = '';
            let clone_coords = coords.cloneNode(true);
            clone_coords = clone_coords.querySelector('map-coordinates');

            // Going over coordinates for the polygon
            for (let x = 0; x < json.coordinates[y].length; x++) {
              bboxExtent = Util._updateExtent(
                bboxExtent,
                json.coordinates[y][x][0],
                json.coordinates[y][x][1]
              );
              out =
                out +
                json.coordinates[y][x][0] +
                ' ' +
                json.coordinates[y][x][1] +
                ' ';
            }

            // Create map-coordinates element and append it to clone_polygon
            clone_coords.innerHTML = out;

            clone_polygon.appendChild(clone_coords);
          }
          //console.log(clone_polygon);
          return clone_polygon;

        case 'MULTIPOINT':
          out = '';
          // Create multipoint element
          let clone_multipoint = multiPoint.cloneNode(true);
          clone_multipoint = clone_multipoint.querySelector('map-multipoint');

          for (let i = 0; i < json.coordinates.length; i++) {
            bboxExtent = Util._updateExtent(
              bboxExtent,
              json.coordinates[i][0],
              json.coordinates[i][1]
            );
            out =
              out + json.coordinates[i][0] + ' ' + json.coordinates[i][1] + ' ';
          }
          clone_multipoint.querySelector('map-coordinates').innerHTML = out;
          return clone_multipoint;

        case 'MULTILINESTRING':
          let clone_multilinestring = multilinestring.cloneNode(true);
          clone_multilinestring = clone_multilinestring.querySelector(
            'map-multilinestring'
          );

          for (let i = 0; i < json.coordinates.length; i++) {
            let out = '';
            let clone_coords = coords.cloneNode(true);
            clone_coords = clone_coords.querySelector('map-coordinates');
            for (let y = 0; y < json.coordinates[i].length; y++) {
              bboxExtent = Util._updateExtent(
                bboxExtent,
                json.coordinates[i][y][0],
                json.coordinates[i][y][1]
              );
              out =
                out +
                json.coordinates[i][y][0] +
                ' ' +
                json.coordinates[i][y][1] +
                ' ';
            }
            clone_coords.innerHTML = out;
            clone_multilinestring.appendChild(clone_coords);
          }
          return clone_multilinestring;

        case 'MULTIPOLYGON':
          let m = multiPolygon.cloneNode(true);
          m = m.querySelector('map-multiPolygon');

          // Going over each Polygon
          for (let i = 0; i < json.coordinates.length; i++) {
            let clone_polygon = polygon.cloneNode(true);
            clone_polygon = clone_polygon.querySelector('map-polygon');

            // Going over each coordinates
            for (let y = 0; y < json.coordinates[i].length; y++) {
              let out = '';
              let clone_coords = coords.cloneNode(true);
              clone_coords = clone_coords.querySelector('map-coordinates');

              // Going over coordinates for the polygon
              for (let x = 0; x < json.coordinates[i][y].length; x++) {
                bboxExtent = Util._updateExtent(
                  bboxExtent,
                  json.coordinates[i][y][x][0],
                  json.coordinates[i][y][x][1]
                );
                out =
                  out +
                  json.coordinates[i][y][x][0] +
                  ' ' +
                  json.coordinates[i][y][x][1] +
                  ' ';
              }

              // Create map-coordinates element and append it to clone_polygon
              clone_coords.innerHTML = out;

              clone_polygon.appendChild(clone_coords);
            }
            m.appendChild(clone_polygon);
          }
          return m;
        case 'GEOMETRYCOLLECTION': // ---------------------------------------------------------------------------
          let g = geometrycollection.cloneNode(true);
          g = g.querySelector('map-geometrycollection');
          //console.log(json.geometries);
          for (let i = 0; i < json.geometries.length; i++) {
            let fg = Util.geojson2mapml(
              json.geometries[i],
              options,
              layer,
              bboxExtent
            );
            g.appendChild(fg);
          }
          return g;
      }
    }
    //Add default bbox
    if (setExtent) {
      layer
        .querySelector('layer-')
        .insertAdjacentHTML(
          'afterbegin',
          "<map-meta name='extent' content='top-left-longitude=" +
            bboxExtent[0] +
            ', top-left-latitude=' +
            bboxExtent[1] +
            ', bottom-right-longitude=' +
            bboxExtent[2] +
            ',bottom-right-latitude=' +
            bboxExtent[3] +
            "'></map-meta>"
        );
    }
    return layer.querySelector('layer-');
  },

  // Takes an array of length n to return an array of arrays with length 2, helper function
  //    for mapml2geojson
  // _breakArray: arr(float) -> arr(arr(float, float))
  _breakArray: function (arr) {
    let size = 2;
    let arrayOfArrays = [];
    // removing anything other than numbers, ., - (used to remove <map-span> tags)
    arr = arr.filter((x) => !/[^\d.-]/g.test(x)).filter((x) => x);
    for (let i = 0; i < arr.length; i += size) {
      arrayOfArrays.push(arr.slice(i, i + size).map(Number));
    }
    return arrayOfArrays;
  },

  // Takes an HTML Table to return geojson properties, helper function
  //    for mapml2geojson
  // _table2properties: HTML Table -> geojson
  _table2properties: function (table) {
    // removing thead, if it exists
    let head = table.querySelector('thead');
    if (head !== null) {
      table.querySelector('thead').remove();
    }
    let json = {};
    table.querySelectorAll('tr').forEach((tr) => {
      let tableData = tr.querySelectorAll('th, td');
      json[tableData[0].innerHTML] = tableData[1].innerHTML;
    });
    return json;
  },

  // Converts a geometry element (el) to geojson, helper function
  //    for mapml2geojson, NOTE - el can not be a map-geometrycollection
  // _geometry2geojson: (child of <map-geometry>), Proj4, Proj4, Bool -> geojson
  _geometry2geojson: function (el, source, dest, transform) {
    // remove map-a, map-span elements if the geometry is wrapped in them
    while (
      el.nodeName.toUpperCase() === 'MAP-SPAN' ||
      el.nodeName.toUpperCase() === 'MAP-A'
    ) {
      el = el.firstElementChild;
    }
    let elem = el.nodeName;
    let j = {};
    let coord;

    switch (elem.toUpperCase()) {
      case 'MAP-POINT':
        j.type = 'Point';
        if (transform) {
          let pointConv = proj4.transform(
            source,
            dest,
            el
              .querySelector('map-coordinates')
              .innerHTML.split(/[<>\ ]/g)
              .map(Number)
          );
          j.coordinates = [pointConv.x, pointConv.y];
        } else {
          j.coordinates = el
            .querySelector('map-coordinates')
            .innerHTML.split(/[<>\ ]/g)
            .map(Number);
        }
        break;
      case 'MAP-LINESTRING':
        j.type = 'LineString';
        coord = el.querySelector('map-coordinates').innerHTML.split(/[<>\ ]/g);
        coord = Util._breakArray(coord);
        if (transform) {
          coord = Util._pcrsToGcrs(coord, source, dest);
        }
        j.coordinates = coord;
        break;
      case 'MAP-POLYGON':
        j.type = 'Polygon';
        j.coordinates = [];
        let x = 0;
        el.querySelectorAll('map-coordinates').forEach((coord) => {
          coord = coord.innerHTML.split(/[<>\ ]/g);
          coord = Util._breakArray(coord);
          if (transform) {
            coord = Util._pcrsToGcrs(coord, source, dest);
          }
          j.coordinates[x] = coord;
          x++;
        });
        break;
      case 'MAP-MULTIPOINT':
        j.type = 'MultiPoint';
        coord = Util._breakArray(
          el.querySelector('map-coordinates').innerHTML.split(/[<>\ ]/g)
        );
        if (transform) {
          coord = Util._pcrsToGcrs(coord, source, dest);
        }
        j.coordinates = coord;
        break;
      case 'MAP-MULTILINESTRING':
        j.type = 'MultiLineString';
        j.coordinates = [];
        let i = 0;
        el.querySelectorAll('map-coordinates').forEach((coord) => {
          coord = coord.innerHTML.split(/[<>\ ]/g);
          coord = Util._breakArray(coord);
          if (transform) {
            coord = Util._pcrsToGcrs(coord, source, dest);
          }
          j.coordinates[i] = coord;
          i++;
        });
        break;
      case 'MAP-MULTIPOLYGON':
        j.type = 'MultiPolygon';
        j.coordinates = [];
        let p = 0;
        el.querySelectorAll('map-polygon').forEach((poly) => {
          let y = 0;
          j.coordinates.push([]);
          poly.querySelectorAll('map-coordinates').forEach((coord) => {
            coord = coord.innerHTML.split(/[<>\ ]/g);
            coord = Util._breakArray(coord);
            if (transform) {
              coord = Util._pcrsToGcrs(coord, source, dest);
            }
            j.coordinates[p].push([]);
            j.coordinates[p][y] = coord;
            y++;
          });
          p++;
        });
        break;
    }
    return j;
  },

  // _pcrsToGcrs: arrof([x,y]) Proj4, Proj4 -> arrof[x,y]
  _pcrsToGcrs: function (arr, source, dest) {
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
      let conv = proj4.transform(source, dest, arr[i]);
      conv = [conv.x, conv.y];
      newArr.push(conv);
    }
    return newArr;
  },

  // Takes an <layer-> element and returns a geojson feature collection object
  // The options object can contain the following:
  //      propertyFunction   - function(<map-properties>), A function that maps the features' <map-properties> element to   a GeoJSON "properties" member.
  //      transform          - Bool, Transform coordinates to gcrs values, defaults to True
  // mapml2geojson: <layer-> Object -> GeoJSON
  mapml2geojson: function (element, options = {}) {
    let defaults = {
      propertyFunction: null,
      transform: true
    };
    // assign default values for undefined options
    options = Object.assign({}, defaults, options);

    let json = {};
    json.type = 'FeatureCollection';
    json.title = element.getAttribute('label');
    json.features = [];

    // Transforming Coordinates to gcrs if transformation = true and coordinate is not (EPSG:3857 or EPSG:4326)
    let source = null;
    let dest = null;
    if (options.transform) {
      source = new proj4.Proj(element.parentElement._map.options.crs.code);
      dest = new proj4.Proj('EPSG:4326');
      if (
        element.parentElement._map.options.crs.code === 'EPSG:3857' ||
        element.parentElement._map.options.crs.code === 'EPSG:4326'
      ) {
        options.transform = false;
      }
    }

    // Setting all meta settings, if any
    let metas = element.querySelectorAll('map-meta');
    metas.forEach((meta) => {
      let name = meta.getAttribute('name');
      if (name === 'extent') {
        let content = meta.getAttribute('content');
        let arr = content.split(',');
        let ex = {};
        for (let i = 0; i < arr.length; i++) {
          let s = arr[i].split('=');
          s[0] = s[0].trim(); // removing whitespace
          s[1] = parseFloat(s[1]);
          ex[s[0]] = s[1];
        }
        json.bbox = [
          ex['top-left-longitude'],
          ex['top-left-latitude'],
          ex['bottom-right-longitude'],
          ex['bottom-right-latitude']
        ];
      }
    });

    // Iterating over each feature
    let features = element.querySelectorAll('map-feature');
    let num = 0;

    // Going over each feature in the layer
    features.forEach((feature) => {
      //console.log(feature);

      json.features[num] = { type: 'Feature' };
      json.features[num].geometry = {};
      json.features[num].properties = {};

      // setting properties when function presented
      if (!feature.querySelector('map-properties')) {
        json.features[num].properties = null;
      } else if (typeof options.propertyFunction === 'function') {
        let properties = options.propertyFunction(
          feature.querySelector('map-properties')
        );
        json.features[num].properties = properties;
      } else if (
        feature.querySelector('map-properties').querySelector('table') !== null
      ) {
        // setting properties when table presented
        let table = feature
            .querySelector('map-properties')
            .querySelector('table')
            .cloneNode(true),
          properties = Util._table2properties(table);
        json.features[num].properties = properties;
      } else {
        // when no table present, strip any possible html tags to only get text
        json.features[num].properties = {
          prop0: feature
            .querySelector('map-properties')
            .innerHTML.replace(/(<([^>]+)>)/gi, '')
        };
      }

      let geom = feature.querySelector('map-geometry').firstElementChild;

      // remove map-a, map-span elements if the geometry is wrapped in them
      while (
        geom.nodeName.toUpperCase() === 'MAP-SPAN' ||
        geom.nodeName.toUpperCase() === 'MAP-A'
      ) {
        geom = geom.firstElementChild;
      }

      // Adding Geometry
      if (geom.nodeName.toUpperCase() !== 'MAP-GEOMETRYCOLLECTION') {
        json.features[num].geometry = Util._geometry2geojson(
          geom,
          source,
          dest,
          options.transform
        );
      } else {
        json.features[num].geometry.type = 'GeometryCollection';
        json.features[num].geometry.geometries = [];

        let geoms = geom.children;
        Array.from(geoms).forEach((g) => {
          // omit all map-span, map-a that may be present in geometry-collection
          let n = g.nodeName.toUpperCase();
          if (n === 'MAP-SPAN' || n === 'MAP-A') {
            g = g.cloneNode(true);
            [...g.querySelectorAll('map-a, map-span')].forEach((e) =>
              e.replaceWith(...e.children)
            );
            Array.from(g.children).forEach((i) => {
              i = Util._geometry2geojson(i, source, dest, options.transform);
              json.features[num].geometry.geometries.push(i);
            });
          } else {
            g = Util._geometry2geojson(g, source, dest, options.transform);
            json.features[num].geometry.geometries.push(g);
          }
        });
      }
      //going to next feature
      num++;
    });

    return json;
  },

  // Takes leaflet bound, leaflet map and min and max zoom limit,
  // return the maximum zoom level that can show the bound completely
  // getMaxZoom: L.Bound, L.Map, Number, Number -> Number
  getMaxZoom: function (bound, map, minZoom, maxZoom) {
    if (!bound) return;

    let newZoom = map.getZoom(),
      scale = map.options.crs.scale(newZoom),
      mapCenterTCRS = map.options.crs.transformation.transform(
        bound.getCenter(true),
        scale
      );

    let mapHalf = map.getSize().divideBy(2),
      mapTlNew = mapCenterTCRS.subtract(mapHalf).round(),
      mapBrNew = mapCenterTCRS.add(mapHalf).round();

    let mapTlPCRSNew = Util.pixelToPCRSPoint(
        mapTlNew,
        newZoom,
        map.options.projection
      ),
      mapBrPCRSNew = Util.pixelToPCRSPoint(
        mapBrNew,
        newZoom,
        map.options.projection
      );

    let mapPCRS = L.bounds(mapTlPCRSNew, mapBrPCRSNew),
      zOffset = mapPCRS.contains(bound) ? 1 : -1;

    while (
      (zOffset === -1 && !mapPCRS.contains(bound) && newZoom - 1 >= minZoom) ||
      (zOffset === 1 && mapPCRS.contains(bound) && newZoom + 1 <= maxZoom)
    ) {
      newZoom += zOffset;
      scale = map.options.crs.scale(newZoom);
      mapCenterTCRS = map.options.crs.transformation.transform(
        bound.getCenter(true),
        scale
      );

      mapTlNew = mapCenterTCRS.subtract(mapHalf).round();
      mapBrNew = mapCenterTCRS.add(mapHalf).round();
      mapTlPCRSNew = Util.pixelToPCRSPoint(
        mapTlNew,
        newZoom,
        map.options.projection
      );
      mapBrPCRSNew = Util.pixelToPCRSPoint(
        mapBrNew,
        newZoom,
        map.options.projection
      );

      mapPCRS = L.bounds(mapTlPCRSNew, mapBrPCRSNew);
    }

    if (
      zOffset === 1 &&
      newZoom - 1 >= 0 &&
      !(newZoom === maxZoom && mapPCRS.contains(bound))
    )
      newZoom--;
    return newZoom;
  },
  getClosest(node, selector) {
    if (!node) {
      return null;
    }
    if (node instanceof ShadowRoot) {
      return Util.getClosest(node.host, selector);
    }

    if (node instanceof HTMLElement) {
      if (node.matches(selector)) {
        return node;
      } else {
        return Util.getClosest(node.parentNode, selector);
      }
    }

    return Util.getClosest(node.parentNode, selector);
  }
};
