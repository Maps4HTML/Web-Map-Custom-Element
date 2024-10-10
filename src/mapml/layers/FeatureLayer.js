import { Util } from '../utils/Util';
import { path } from '../features/path';
import { geometry } from '../features/geometry';

export var FeatureLayer = L.FeatureGroup.extend({
  /*
   * M.MapML turns any MapML feature data into a Leaflet layer. Based on L.GeoJSON.
   *
   * Used by MapMLLayer to create _mapmlvectors property, used to render features
   */
  initialize: function (mapml, options) {
    /*
        mapml:
        1. for query: an array of map-feature elements that it fetches
        2. for static templated feature: null
        3. for non-templated feature: layer- (with no src) or mapml file (with src)
      */
    // options.extent: when you use a FeatureLayer, you can either get it to calculate the
    // .layerBounds dynamically (the default), based on adds/removes of features from the layer/
    // or you can construct it with a bounds (via options.extent),
    // which will then remain static for the lifetime of the layer

    L.FeatureGroup.prototype.initialize.call(this, null, options);
    // this.options.static is false ONLY for tiled vector features
    // this._staticFeature is ONLY true when not used by TemplatedFeaturesLayer
    // this.options.query true when created by QueryHandler.js

    if (!this.options.tiles) {
      // not a tiled vector layer
      this._container = null;
      if (this.options.query) {
        this._container = L.DomUtil.create(
          'div',
          'leaflet-layer',
          this.options.pane
        );
        // must have leaflet-pane class because of new/changed rule in leaflet.css
        // info: https://github.com/Leaflet/Leaflet/pull/4597
        L.DomUtil.addClass(
          this._container,
          'leaflet-pane mapml-vector-container'
        );
      } else if (this.options._leafletLayer) {
        this._container = L.DomUtil.create(
          'div',
          'leaflet-layer',
          this.options.pane
        );
        L.DomUtil.addClass(
          this._container,
          'leaflet-pane mapml-vector-container'
        );
        // static mapmlvector should always at the top
        //        this._container.style.zIndex = 1000;
      } else {
        // if the current featureLayer is a sublayer of templatedFeatureLayer,
        // append <svg> directly to the templated feature container (passed in as options.pane)
        this._container = this.options.pane;
        L.DomUtil.addClass(
          this._container,
          'leaflet-pane mapml-vector-container'
        );
      }
      L.setOptions(this.options.renderer, { pane: this._container });
    }
    if (this.options.query) {
      this._queryFeatures = mapml.features ? mapml.features : mapml;
    } else if (!mapml) {
      // use this.options._leafletLayer to distinguish the featureLayer constructed for initialization and for templated features / tiles
      if (this.options._leafletLayer) {
        // this._staticFeature should be set to true to make sure the _getEvents works properly
        this._features = {};
        this._staticFeature = true;
      }
    }
  },

  isVisible: function () {
    let map = this.options.mapEl._map;
    // if query, isVisible is unconditionally true
    if (this.options.query) return true;
    // if the featureLayer is for static features, i.e. it is the mapmlvector layer,
    // if it is empty, isVisible = false
    // this._staticFeature: flag to determine if the featureLayer is used by static features only
    // this._features: check if the current static featureLayer is empty
    // (Object.keys(this._features).length === 0 => this._features is an empty object)
    else if (this._staticFeature && Object.keys(this._features).length === 0) {
      return false;
    } else {
      let mapZoom = map.getZoom(),
        zoomBounds = this.zoomBounds || this.options.zoomBounds,
        layerBounds = this.layerBounds || this.options.layerBounds,
        withinZoom = zoomBounds
          ? mapZoom <= zoomBounds.maxZoom && mapZoom >= zoomBounds.minZoom
          : false;
      return (
        withinZoom &&
        this._layers &&
        layerBounds &&
        layerBounds.overlaps(
          Util.pixelToPCRSBounds(
            map.getPixelBounds(),
            mapZoom,
            map.options.projection
          )
        )
      );
    }
  },

  onAdd: function (map) {
    this._map = map;
    L.FeatureGroup.prototype.onAdd.call(this, map);
    if (this._staticFeature) {
      this._validateRendering();
    }
    if (this._queryFeatures)
      map.on('featurepagination', this.showPaginationFeature, this);
  },
  addLayer: function (layerToAdd) {
    L.FeatureGroup.prototype.addLayer.call(this, layerToAdd);
    // static FeatureLayer (e.g. MapMLLayer._mapmlvectors) NEVER has a
    // .layerBounds property, so if there is this.options.layerBounds, don't
    // go copying it to this.layerBounds.  Same for zoomBounds.
    // bug alert: it's necessary to create a new bounds object to initialize
    // this.layerBounds, to avoid changing the layerBounds of the first geometry
    // added to this layer
    if (!this.options.layerBounds) {
      this.layerBounds = this.layerBounds
        ? this.layerBounds.extend(layerToAdd.layerBounds)
        : L.bounds(layerToAdd.layerBounds.min, layerToAdd.layerBounds.max);

      if (this.zoomBounds) {
        if (layerToAdd.zoomBounds.minZoom < this.zoomBounds.minZoom)
          this.zoomBounds.minZoom = layerToAdd.zoomBounds.minZoom;
        if (layerToAdd.zoomBounds.maxZoom > this.zoomBounds.maxZoom)
          this.zoomBounds.maxZoom = layerToAdd.zoomBounds.maxZoom;
        if (layerToAdd.zoomBounds.minNativeZoom < this.zoomBounds.minNativeZoom)
          this.zoomBounds.minNativeZoom = layerToAdd.zoomBounds.minNativeZoom;
        if (layerToAdd.zoomBounds.maxNativeZoom > this.zoomBounds.maxNativeZoom)
          this.zoomBounds.maxNativeZoom = layerToAdd.zoomBounds.maxNativeZoom;
      } else {
        this.zoomBounds = layerToAdd.zoomBounds;
      }
    }
    if (this._staticFeature) {
      // TODO: validate the use the feature.zoom which is new (was in createGeometry)
      let featureZoom = layerToAdd.options.mapmlFeature.zoom;
      if (featureZoom in this._features) {
        this._features[featureZoom].push(layerToAdd);
      } else {
        this._features[featureZoom] = [layerToAdd];
      }
      // hide/display features based on the their zoom limits
      this._validateRendering();
    }
    layerToAdd.options.group.addEventListener('mouseover', function () {
      // Move hovered element to the end of its parent container
      this.parentNode.appendChild(this);
    });
    //layerToAdd.options.group.addEventListener('mouseout', function () {
    //  // bring g element back to it's original location
    //  const originalPosition = Array.prototype.slice
    //    .call(this.parentNode.children)
    //    .indexOf(layerToAdd.options.group);
    //  let beforeElement = this.parentNode.children[originalPosition + 1];
    //  this.parentNode.insertBefore(this, beforeElement);
    //});
    return this;
  },
  addRendering: function (featureToAdd) {
    L.FeatureGroup.prototype.addLayer.call(this, featureToAdd);
  },
  onRemove: function (map) {
    if (this._queryFeatures) {
      map.off('featurepagination', this.showPaginationFeature, this);
      delete this._queryFeatures;
      L.DomUtil.remove(this._container);
    }
    L.FeatureGroup.prototype.onRemove.call(this, map);
    this._map.featureIndex.cleanIndex();
  },

  removeLayer: function (featureToRemove) {
    L.FeatureGroup.prototype.removeLayer.call(this, featureToRemove);
    if (!this.options.layerBounds) {
      delete this.layerBounds;
      // this ensures that the <layer->.extent gets recalculated if needed
      delete this.options._leafletLayer.bounds;
      delete this.zoomBounds;
      // this ensures that the <layer->.extent gets recalculated if needed
      delete this.options._leafletLayer.zoomBounds;
      delete this._layers[featureToRemove._leaflet_id];
      this._removeFromFeaturesList(featureToRemove);
      // iterate through all remaining layers
      let layerBounds, zoomBounds;
      let layerIds = Object.keys(this._layers);
      // re-calculate the layerBounds and zoomBounds for the whole layer when
      // a feature is permanently removed from the overall layer
      // bug alert: it's necessary to create a new bounds object to initialize
      // this.layerBounds, to avoid changing the layerBounds of the first geometry
      // added to this layer
      for (let id of layerIds) {
        let layer = this._layers[id];
        if (layerBounds) {
          layerBounds.extend(layer.layerBounds);
        } else {
          layerBounds = L.bounds(layer.layerBounds.min, layer.layerBounds.max);
        }
        if (zoomBounds) {
          if (layer.zoomBounds.minZoom < zoomBounds.minZoom)
            zoomBounds.minZoom = layer.zoomBounds.minZoom;
          if (layer.zoomBounds.maxZoom > zoomBounds.maxZoom)
            zoomBounds.maxZoom = layer.zoomBounds.maxZoom;
          if (layer.zoomBounds.minNativeZoom < zoomBounds.minNativeZoom)
            zoomBounds.minNativeZoom = layer.zoomBounds.minNativeZoom;
          if (layer.zoomBounds.maxNativeZoom > zoomBounds.maxNativeZoom)
            zoomBounds.maxNativeZoom = layer.zoomBounds.maxNativeZoom;
        } else {
          zoomBounds = {};
          zoomBounds.minZoom = layer.zoomBounds.minZoom;
          zoomBounds.maxZoom = layer.zoomBounds.maxZoom;
          zoomBounds.minNativeZoom = layer.zoomBounds.minNativeZoom;
          zoomBounds.maxNativeZoom = layer.zoomBounds.maxNativeZoom;
        }
      }
      // If the last feature is removed, we should remove the .layerBounds and
      // .zoomBounds properties, so that the FeatureLayer may be ignored
      if (layerBounds) {
        this.layerBounds = layerBounds;
      } else {
        delete this.layerBounds;
      }
      if (zoomBounds) {
        this.zoomBounds = zoomBounds;
      } else {
        delete this.zoomBounds;
        delete this.options.zoomBounds;
      }
    }
    return this;
  },
  /**
   * Remove the geomtry rendering (an svg g/ M.Geomtry) from the L.FeatureGroup
   * _layers array, so that it's not visible on the map, but still contributes
   * to the bounds and zoom limits of the FeatureLayer.
   *
   * @param {type} featureToRemove
   * @returns {undefined}
   */
  removeRendering: function (featureToRemove) {
    L.FeatureGroup.prototype.removeLayer.call(this, featureToRemove);
  },
  _removeFromFeaturesList: function (feature) {
    for (let zoom in this._features)
      for (let i = 0; i < this._features[zoom].length; ++i) {
        let feature = this._features[zoom][i];
        if (feature._leaflet_id === feature._leaflet_id) {
          this._features[zoom].splice(i, 1);
          break;
        }
      }
  },
  getEvents: function () {
    if (this._staticFeature) {
      return {
        moveend: this._handleMoveEnd,
        zoomend: this._handleZoomEnd
      };
    }
    return {};
  },

  // for query
  showPaginationFeature: function (e) {
    if (this.options.query && this._queryFeatures[e.i]) {
      let feature = this._queryFeatures[e.i];
      feature._linkEl.shadowRoot.replaceChildren();
      this.clearLayers();
      // append all map-meta from mapml document
      if (feature.meta) {
        for (let i = 0; i < feature.meta.length; i++) {
          feature._linkEl.shadowRoot.appendChild(feature.meta[i]);
        }
      }
      feature._linkEl.shadowRoot.appendChild(feature);
      feature.addFeature(this);
      e.popup._navigationBar.querySelector('p').innerText =
        e.i + 1 + '/' + this.options._leafletLayer._totalFeatureCount;
      e.popup._content
        .querySelector('iframe')
        .setAttribute('sandbox', 'allow-same-origin allow-forms');
      e.popup._content.querySelector('iframe').srcdoc =
        feature.querySelector('map-properties').innerHTML;
      // "zoom to here" link need to be re-set for every pagination
      this._map.fire('attachZoomLink', { i: e.i, currFeature: feature });
      this._map.once(
        'popupclose',
        function (e) {
          this.shadowRoot.innerHTML = '';
        },
        feature._linkEl
      );
    }
  },

  _handleMoveEnd: function () {
    this._removeCSS();
  },

  _handleZoomEnd: function (e) {
    // handle zoom end gets called twice for every zoom, this condition makes it go through once only.
    if (this.zoomBounds) {
      this._validateRendering();
    }
  },
  /*
   * _validateRendering prunes the features currently in the _features hashmap (created
   * by us).  _features categorizes features by zoom, and is used to remove or add
   * features from the map based on the map-feature min/max getters.  It also
   * maintains the _map.featureIndex property, which is used to control the tab
   * order for interactive (static) features currently rendered on the map.
   * @private
   *  */
  _validateRendering: function () {
    // since features are removed and re-added by zoom level, need to clean the feature index before re-adding
    if (this._map) this._map.featureIndex.cleanIndex();
    let map = this._map || this.options._leafletLayer._map;
    // it's important that we not try to validate rendering if the FeatureLayer
    // isn't actually  being rendered (i.e. on the map.  the _map property can't
    // be used because once it's assigned  (by onAdd, above) it's never unassigned.
    if (!map.hasLayer(this)) return;
    if (this._features) {
      for (let zoom in this._features) {
        for (let k = 0; k < this._features[zoom].length; k++) {
          let geometry = this._features[zoom][k],
            renderable = geometry._checkRender(
              map.getZoom(),
              this.zoomBounds.minZoom,
              this.zoomBounds.maxZoom
            );
          if (!renderable) {
            // insert a placeholder in the dom rendering for the geometry
            // so that it retains its layering order when it is next rendered
            let placeholder = document.createElement('span');
            placeholder.id = geometry._leaflet_id;
            // geometry.defaultOptions.group is the rendered svg g element in sd
            geometry.defaultOptions.group.insertAdjacentElement(
              'beforebegin',
              placeholder
            );
            // removing the rendering without removing the feature from the feature list
            this.removeRendering(geometry);
          } else if (
            // checking for _map so we do not enter this code block during the connectedCallBack of the map-feature
            !map.hasLayer(geometry) &&
            !geometry._map
          ) {
            this.addRendering(geometry);
            // update the layerbounds
            let placeholder =
              geometry.defaultOptions.group.parentNode.querySelector(
                `span[id="${geometry._leaflet_id}"]`
              );
            placeholder.replaceWith(geometry.defaultOptions.group);
          }
        }
      }
    }
  },

  _setZoomTransform: function (center, clampZoom) {
    var scale = this._map.getZoomScale(this._map.getZoom(), clampZoom),
      translate = center
        .multiplyBy(scale)
        .subtract(this._map._getNewPixelOrigin(center, this._map.getZoom()))
        .round();

    if (any3d) {
      L.setTransform(this._layers[clampZoom], translate, scale);
    } else {
      L.setPosition(this._layers[clampZoom], translate);
    }
  },

  /**
   * Render a <map-feature> as a Leaflet layer that can be added to a map or
   * LayerGroup as required.  Kind of a "factory" method.
   *
   * Uses this.options, so if you need to, you can construct a FeatureLayer
   * with options set as required
   *
   * @param feature - a <map-feature> element
   * @param {String} fallbackCS - "gcrs" | "pcrs"
   * @param {String} tileZoom - the zoom of the map at which the coordinates will exist
   *
   * @returns Geometry, which is an L.FeatureGroup
   * @public
   */
  createGeometry: function (feature, fallbackCS, tileZoom) {
    // was let options = this.options, but that was causing unwanted side-effects
    // because we were adding .layerBounds and .zoomBounds to it before passing
    // to _createGeometry, which meant that FeatureLayer was sprouting
    // options.layerBounds and .zoomBounds when it should not have those props
    let options = Object.assign({}, this.options);

    if (options.filter && !options.filter(feature)) {
      return;
    }

    if (feature.classList.length) {
      options.className = feature.classList.value;
    }
    // tileZoom is only used when the map-feature is discarded i.e. for rendering
    // vector tiles' feature geometries in bulk (in this case only the geomtry
    // is rendered on a tile-shaped FeatureLayer
    let zoom = feature.zoom ?? tileZoom,
      title = feature.querySelector('map-featurecaption');
    title = title ? title.innerHTML : 'Feature';

    if (feature.querySelector('map-properties')) {
      options.properties = document.createElement('div');
      options.properties.classList.add('mapml-popup-content');
      options.properties.insertAdjacentHTML(
        'afterbegin',
        feature.querySelector('map-properties').innerHTML
      );
    }
    let cs =
      feature.getElementsByTagName('map-geometry')[0]?.getAttribute('cs') ??
      fallbackCS;
    // options.layerBounds and options.zoomBounds are set by TemplatedTileLayer._createFeatures
    // each geometry needs bounds so that it can be a good community member of this._layers
    if (this._staticFeature || this.options.query) {
      options.layerBounds = Util.extentToBounds(feature.extent, 'PCRS');
      options.zoomBounds = feature.extent.zoom;
    }
    let geom = this._geometryToLayer(feature, options, cs, +zoom, title);
    if (geom && Object.keys(geom._layers).length !== 0) {
      // if the layer is being used as a query handler output, it will have
      // a color option set.  Otherwise, copy classes from the feature
      if (!geom.options.color && feature.hasAttribute('class')) {
        geom.options.className = feature.getAttribute('class');
      }
      geom.defaultOptions = geom.options;
      this.resetStyle(geom);

      if (options.onEachFeature) {
        geom.bindTooltip(title, { interactive: true, sticky: true });
      }
      if (feature.tagName.toUpperCase() === 'MAP-FEATURE') {
        feature._groupEl = geom.options.group;
      }
      return geom;
    }
  },

  resetStyle: function (layer) {
    var style = this.options.style;
    if (style) {
      // reset any custom styles
      L.Util.extend(layer.options, layer.defaultOptions);
      this._setLayerStyle(layer, style);
    }
  },

  setStyle: function (style) {
    this.eachLayer(function (layer) {
      this._setLayerStyle(layer, style);
    }, this);
  },

  _setLayerStyle: function (layer, style) {
    if (typeof style === 'function') {
      style = style(layer.feature);
    }
    if (layer.setStyle) {
      layer.setStyle(style);
    }
  },
  _removeCSS: function () {
    let toDelete = this._container.querySelectorAll(
      'link[rel=stylesheet],style'
    );
    for (let i = 0; i < toDelete.length; i++) {
      this._container.removeChild(toDelete[i]);
    }
  },
  _geometryToLayer: function (feature, vectorOptions, cs, zoom, title) {
    let geom = feature.getElementsByTagName('map-geometry')[0],
      group = [],
      groupOptions = {},
      svgGroup = L.SVG.create('g'),
      copyOptions = Object.assign({}, vectorOptions);
    svgGroup._featureEl = feature; // rendered <g> has a reference to map-feature
    if (geom) {
      for (let geo of geom.querySelectorAll(
        'map-polygon, map-linestring, map-multilinestring, map-point, map-multipoint'
      )) {
        group.push(
          path(
            geo,
            Object.assign(copyOptions, {
              nativeCS: cs,
              nativeZoom: zoom,
              projection: this.options.projection,
              featureID: feature.id,
              group: svgGroup,
              wrappers: this._getGeometryParents(geo.parentElement),
              featureLayer: this,
              _leafletLayer: this.options._leafletLayer
            })
          )
        );
      }
      let groupOptions = {
          group: svgGroup,
          mapmlFeature: feature,
          featureID: feature.id,
          accessibleTitle: title,
          onEachFeature: vectorOptions.onEachFeature,
          properties: vectorOptions.properties,
          _leafletLayer: this.options._leafletLayer,
          layerBounds: vectorOptions.layerBounds,
          zoomBounds: vectorOptions.zoomBounds
        },
        collections =
          geom.querySelector('map-multipolygon') ||
          geom.querySelector('map-geometrycollection');
      if (collections)
        groupOptions.wrappers = this._getGeometryParents(
          collections.parentElement
        );
      return geometry(group, groupOptions);
    }
  },

  _getGeometryParents: function (subType, elems = []) {
    if (subType && subType.tagName.toUpperCase() !== 'MAP-GEOMETRY') {
      if (
        subType.tagName.toUpperCase() === 'MAP-MULTIPOLYGON' ||
        subType.tagName.toUpperCase() === 'MAP-GEOMETRYCOLLECTION'
      )
        return this._getGeometryParents(subType.parentElement, elems);
      return this._getGeometryParents(
        subType.parentElement,
        elems.concat([subType])
      );
    } else {
      return elems;
    }
  }
});
export var featureLayer = function (mapml, options) {
  return new FeatureLayer(mapml, options);
};
