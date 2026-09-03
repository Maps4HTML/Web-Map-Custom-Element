import { DomUtil, SVG, DomEvent, stamp } from 'leaflet';
export var createLayerControlHTML = async function () {
  var fieldset = DomUtil.create('fieldset', 'mapml-layer-item'),
    input = DomUtil.create('input'),
    layerItemName = DomUtil.create('span', 'mapml-layer-item-name'),
    settingsButtonNameIcon = DomUtil.create('span'),
    layerItemProperty = DomUtil.create(
      'div',
      'mapml-layer-item-properties',
      fieldset
    ),
    layerItemSettings = DomUtil.create(
      'div',
      'mapml-layer-item-settings',
      fieldset
    ),
    itemToggleLabel = DomUtil.create(
      'label',
      'mapml-layer-item-toggle',
      layerItemProperty
    ),
    layerItemControls = DomUtil.create(
      'div',
      'mapml-layer-item-controls',
      layerItemProperty
    ),
    opacityControl = DomUtil.create(
      'details',
      'mapml-layer-item-opacity mapml-control-layers',
      layerItemSettings
    ),
    opacity = DomUtil.create('input'),
    opacityControlSummary = DomUtil.create('summary'),
    svgSettingsControlIcon = SVG.create('svg'),
    settingsControlPath1 = SVG.create('path'),
    settingsControlPath2 = SVG.create('path'),
    extentsFieldset = DomUtil.create('fieldset', 'mapml-layer-grouped-extents'),
    mapEl = this.parentNode;

  // append the paths in svg for the remove layer and toggle icons
  svgSettingsControlIcon.setAttribute('viewBox', '0 0 24 24');
  svgSettingsControlIcon.setAttribute('height', '22');
  svgSettingsControlIcon.setAttribute('width', '22');
  svgSettingsControlIcon.setAttribute('fill', 'currentColor');
  settingsControlPath1.setAttribute('d', 'M0 0h24v24H0z');
  settingsControlPath1.setAttribute('fill', 'none');
  settingsControlPath2.setAttribute(
    'd',
    'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
  );
  svgSettingsControlIcon.appendChild(settingsControlPath1);
  svgSettingsControlIcon.appendChild(settingsControlPath2);

  layerItemSettings.hidden = true;
  settingsButtonNameIcon.setAttribute('aria-hidden', true);

  let removeControlButton = DomUtil.create(
    'button',
    'mapml-layer-item-remove-control',
    layerItemControls
  );
  removeControlButton.type = 'button';
  removeControlButton.title = mapEl.locale.lmRemoveLayer;
  removeControlButton.innerHTML = "<span aria-hidden='true'>&#10005;</span>";
  removeControlButton.classList.add('mapml-button');
  DomEvent.on(removeControlButton, 'click', DomEvent.stop);
  DomEvent.on(
    removeControlButton,
    'click',
    (e) => {
      let fieldset = 0,
        elem,
        root;
      root =
        mapEl.tagName === 'MAPML-VIEWER'
          ? mapEl.shadowRoot
          : mapEl.querySelector('.mapml-web-map').shadowRoot;
      if (
        e.target.closest('fieldset').nextElementSibling &&
        !e.target.closest('fieldset').nextElementSibling.disbaled
      ) {
        elem = e.target.closest('fieldset').previousElementSibling;
        while (elem) {
          fieldset += 2; // find the next layer menu item
          elem = elem.previousElementSibling;
        }
      } else {
        // focus on the link
        elem = 'link';
      }
      mapEl.removeChild(
        e.target.closest('fieldset').querySelector('span').layer._layerEl
      );
      elem = elem
        ? root.querySelector('.leaflet-control-attribution').firstElementChild
        : (elem = root.querySelectorAll('input')[fieldset]);
      elem.focus();
    },
    this._layer
  );

  let itemSettingControlButton = DomUtil.create(
    'button',
    'mapml-layer-item-settings-control',
    layerItemControls
  );
  itemSettingControlButton.type = 'button';
  itemSettingControlButton.title = mapEl.locale.lmLayerSettings;
  itemSettingControlButton.setAttribute('aria-expanded', false);
  itemSettingControlButton.classList.add('mapml-button');
  DomEvent.on(
    itemSettingControlButton,
    'click',
    (e) => {
      let layerControl = this._layer._layerEl._layerControl._container;
      if (!layerControl._isExpanded && e.pointerType === 'touch') {
        layerControl._isExpanded = true;
        return;
      }
      if (layerItemSettings.hidden === true) {
        itemSettingControlButton.setAttribute('aria-expanded', true);
        layerItemSettings.hidden = false;
      } else {
        itemSettingControlButton.setAttribute('aria-expanded', false);
        layerItemSettings.hidden = true;
      }
    },
    this._layer
  );

  input.defaultChecked = this.checked;
  input.type = 'checkbox';
  input.setAttribute('class', 'leaflet-control-layers-selector');
  layerItemName.layer = this._layer;
  const changeCheck = function () {
    this.checked = !this.checked;
    this.dispatchEvent(new CustomEvent('map-change'));
    this._layerControlCheckbox.focus();
  };
  input.addEventListener('change', changeCheck.bind(this));
  if (this._layer._legendUrl) {
    // `_legendUrl` is already scheme-allowlisted in
    // MapLayer.parseLicenseAndLegend (via Util.sanitizeUrl) before
    // being stored on the layer, so it is safe to assign directly
    // to `.href` here. `rel="noopener noreferrer"` closes the
    // reverse-tabnabbing and referrer-leak side channels for the
    // author-supplied cross-origin destination.
    layerItemName.innerText = this._layer._title;

    let legendControl = DomUtil.create(
        'details',
        'mapml-layer-item-legend mapml-control-layers',
        layerItemSettings
      ),
      legendSummary = DomUtil.create('summary'),
      legendLink = document.createElement('a'),
      legendImage = document.createElement('img');

    legendSummary.innerText = mapEl.locale.lmLegend;
    legendControl.appendChild(legendSummary);

    legendLink.href = this._layer._legendUrl;
    legendLink.target = '_blank';
    legendLink.rel = 'noopener noreferrer';
    legendLink.draggable = false;
    legendLink.className = 'mapml-layer-item-legend-link';

    legendImage.src = this._layer._legendUrl;
    legendImage.alt = `${this._layer._title} ${mapEl.locale.lmLegend}`;
    legendImage.loading = 'lazy';
    legendImage.decoding = 'async';
    legendImage.className = 'mapml-layer-item-legend-image';
    legendImage.addEventListener('error', () => {
      legendLink.textContent = mapEl.locale.lmOpenInNewTab;
      legendImage.remove();
    });

    legendLink.appendChild(legendImage);
    legendControl.appendChild(legendLink);
  } else {
    // textContent (not innerHTML) so that a malicious layer title
    // cannot inject markup into the layer control.
    layerItemName.textContent = this._layer._title;
  }
  layerItemName.id = 'mapml-layer-item-name-{' + stamp(layerItemName) + '}';
  opacityControlSummary.innerText = mapEl.locale.lcOpacity;
  opacityControlSummary.id =
    'mapml-layer-item-opacity-' + stamp(opacityControlSummary);
  opacityControl.appendChild(opacityControlSummary);
  opacityControl.appendChild(opacity);
  opacity.setAttribute('type', 'range');
  opacity.setAttribute('min', '0');
  opacity.setAttribute('max', '1.0');
  opacity.setAttribute('value', this._layer._container.style.opacity || '1.0');
  opacity.setAttribute('step', '0.1');
  opacity.setAttribute(
    'aria-labelledby',
    'mapml-layer-item-opacity-' + stamp(opacityControlSummary)
  );

  const changeOpacity = function (e) {
    if (e && e.target && e.target.value >= 0 && e.target.value <= 1.0) {
      this._layer.changeOpacity(e.target.value);
    }
  };
  opacity.value = this._layer._container.style.opacity || '1.0';
  opacity.addEventListener('change', changeOpacity.bind(this));

  fieldset.setAttribute('aria-grabbed', 'false');
  fieldset.setAttribute('aria-labelledby', layerItemName.id);

  fieldset.ontouchstart = fieldset.onmousedown = (downEvent) => {
    if (
      (downEvent.target.parentElement.tagName.toLowerCase() === 'label' &&
        downEvent.target.tagName.toLowerCase() !== 'input') ||
      downEvent.target.tagName.toLowerCase() === 'label'
    ) {
      downEvent =
        downEvent instanceof TouchEvent ? downEvent.touches[0] : downEvent;
      let control = fieldset,
        controls = fieldset.parentNode,
        moving = false,
        yPos = downEvent.clientY,
        originalPosition = Array.from(
          controls.querySelectorAll('fieldset')
        ).indexOf(fieldset);

      document.body.ontouchmove = document.body.onmousemove = (moveEvent) => {
        moveEvent.preventDefault();
        moveEvent =
          moveEvent instanceof TouchEvent ? moveEvent.touches[0] : moveEvent;

        // Fixes flickering by only moving element when there is enough space
        let offset = moveEvent.clientY - yPos;
        moving = Math.abs(offset) > 15 || moving;
        if (
          (controls && !moving) ||
          (controls && controls.childElementCount <= 1) ||
          controls.getBoundingClientRect().top >
            control.getBoundingClientRect().bottom ||
          controls.getBoundingClientRect().bottom <
            control.getBoundingClientRect().top
        ) {
          return;
        }

        controls.classList.add('mapml-draggable');
        control.style.transform = 'translateY(' + offset + 'px)';
        control.style.pointerEvents = 'none';

        let x = moveEvent.clientX,
          y = moveEvent.clientY,
          root =
            mapEl.tagName === 'MAPML-VIEWER'
              ? mapEl.shadowRoot
              : mapEl.querySelector('.mapml-web-map').shadowRoot,
          elementAt = root.elementFromPoint(x, y),
          swapControl =
            !elementAt || !elementAt.closest('fieldset')
              ? control
              : elementAt.closest('fieldset');

        swapControl =
          Math.abs(offset) <= swapControl.offsetHeight ? control : swapControl;

        control.setAttribute('aria-grabbed', 'true');
        control.setAttribute('aria-dropeffect', 'move');
        if (swapControl && controls === swapControl.parentNode) {
          swapControl =
            swapControl !== control.nextSibling
              ? swapControl
              : swapControl.nextSibling;
          if (control !== swapControl) {
            yPos = moveEvent.clientY;
            control.style.transform = null;
          }
          controls.insertBefore(control, swapControl);
        }
      };

      document.body.ontouchend = document.body.onmouseup = () => {
        let newPosition = Array.from(
          controls.querySelectorAll('fieldset')
        ).indexOf(fieldset);
        control.setAttribute('aria-grabbed', 'false');
        control.removeAttribute('aria-dropeffect');
        control.style.pointerEvents = null;
        control.style.transform = null;
        if (originalPosition !== newPosition) {
          let controlsElems = controls.children,
            zIndex = 1;
          // re-order layer elements DOM order
          for (let c of controlsElems) {
            let layerEl = c.querySelector('span').layer._layerEl;
            layerEl.setAttribute('data-moving', '');
            mapEl.insertAdjacentElement('beforeend', layerEl);
            layerEl.removeAttribute('data-moving');
          }
          // update zIndex of all map-layer elements
          let layers = mapEl.querySelectorAll('map-layer,layer-');
          for (let i = 0; i < layers.length; i++) {
            let layer = layers[i]._layer;
            if (layer.options.zIndex !== zIndex) {
              layer.setZIndex(zIndex);
            }
            zIndex++;
          }
        }
        controls.classList.remove('mapml-draggable');
        document.body.ontouchmove =
          document.body.onmousemove =
          document.body.onmouseup =
            null;
      };
    }
  };

  itemToggleLabel.appendChild(input);
  itemToggleLabel.appendChild(layerItemName);
  itemSettingControlButton.appendChild(settingsButtonNameIcon);
  settingsButtonNameIcon.appendChild(svgSettingsControlIcon);

  let mapml = this.src ? this.shadowRoot : this;
  var styleLinks = mapml.querySelectorAll(
    'map-link[rel=style],map-link[rel="self style"],map-link[rel="style self"]'
  );
  let styles;
  if (styleLinks) {
    styles = this.getAlternateStyles(styleLinks);
    if (styles) {
      layerItemSettings.appendChild(styles);
    }
  }

  this._layerControlCheckbox = input;
  this._layerControlLabel = itemToggleLabel;
  this._opacityControl = opacityControl;
  this._opacitySlider = opacity;
  this._layerControlHTML = fieldset;
  this._layerItemSettingsHTML = layerItemSettings;
  this._propertiesGroupAnatomy = extentsFieldset;
  this._styles = styles;
  extentsFieldset.setAttribute('aria-label', 'Sublayers');
  extentsFieldset.setAttribute('hidden', '');
  let mapExtents = mapml.querySelectorAll('map-extent:not([hidden])');
  let mapExtentLayerControls = [];
  for (let i = 0; i < mapExtents.length; i++) {
    mapExtentLayerControls.push(mapExtents[i].whenReady());
    // if any map-extent is not hidden, the parent fieldset should not be hidden
    extentsFieldset.removeAttribute('hidden');
  }
  await Promise.all(mapExtentLayerControls);
  for (let i = 0; i < mapExtents.length; i++) {
    extentsFieldset.appendChild(mapExtents[i].getLayerControlHTML());
  }
  layerItemSettings.appendChild(extentsFieldset);
  return this._layerControlHTML;
};
