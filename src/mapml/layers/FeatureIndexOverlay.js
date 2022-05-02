export var FeatureIndexOverlay = L.Layer.extend({
    onAdd: function (map) {
        let svgInnerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 100 100"><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M0 0h100v100H0z" color="#000" overflow="visible"/></svg>`;

        this._container = L.DomUtil.create("div", "mapml-feature-index-box", map._container);
        this._container.innerHTML = svgInnerHTML;

        this._output = L.DomUtil.create("output", "mapml-feature-index", map._container);
        this._output.setAttribute("role", "status");
        this._output.setAttribute("aria-live", "polite");
        this._output.setAttribute("aria-atomic", "true");
        this._body = L.DomUtil.create("span", "mapml-feature-index-content", this._output);
        this._body.index = 0;

        map.on("layerchange layeradd layerremove overlayremove", this._toggleEvents, this);
        map.on('moveend focus', this._checkOverlap, this);
        map.on("keydown", this._onKeyDown, this);
        this._addOrRemoveFeatureIndex();
    },

    _checkOverlap: function () {
        this._map.fire("mapkeyboardfocused");
        let bounds = this._map.getPixelBounds();
        let center = bounds.getCenter();
        let wRatio = Math.abs(bounds.min.x - bounds.max.x) / (this._map.options.mapEl.width);
        let hRatio = Math.abs(bounds.min.y - bounds.max.y) / (this._map.options.mapEl.height);

        let w = wRatio * (getComputedStyle(this._container).width).replace(/\D/g,'') / 2;
        let h = hRatio * (getComputedStyle(this._container).height).replace(/\D/g,'') / 2;
        let minPoint = L.point(center.x - w, center.y + h);
        let maxPoint = L.point(center.x + w, center.y - h);
        let b = L.bounds(minPoint, maxPoint);
        let featureIndexBounds = M.pixelToPCRSBounds(b,this._map.getZoom(),this._map.options.projection);

        let features = this._map.featureIndex.inBoundFeatures;
        let index = 1;
        let keys = Object.keys(features);
        let body = this._body;

        body.innerHTML = "";
        body.index = 0;

        body.allFeatures = [];
        keys.forEach(i => {
            let layers = features[i].layer._layers;
            let bounds = L.bounds();

            if(layers) {
                let keys = Object.keys(layers);
                keys.forEach(j => {
                    if(!bounds) bounds = L.bounds(layers[j]._bounds.min, layers[j]._bounds.max);
                    bounds.extend(layers[j]._bounds.min);
                    bounds.extend(layers[j]._bounds.max);
                });
            } else if(features[i].layer._bounds){
                bounds = L.bounds(features[i].layer._bounds.min, features[i].layer._bounds.max);
            }

            if(featureIndexBounds.overlaps(bounds)){
                let group = features[i].path;
                let label = group.getAttribute("aria-label");

                if (index < 8){
                    body.appendChild(this._updateOutput(label, index, index));
                }
                if (index % 7 === 0 || index === 1) {
                    body.allFeatures.push([]);
                }
                body.allFeatures[Math.floor((index - 1) / 7)].push({label, index, group});
                if (body.allFeatures[1] && body.allFeatures[1].length === 1){
                    body.appendChild(this._updateOutput("More results", 0, 9));
                }
                index += 1;
            }
        });
        this._addToggleKeys();
    },

    _updateOutput: function (label, index, key) {
        let span = document.createElement("span");
        span.setAttribute("data-index", index);
        span.innerHTML = `<kbd>${key}</kbd>` + " " + label;
        return span;
    },

    _addToggleKeys: function () {
        let allFeatures = this._body.allFeatures;
        for(let i = 0; i < allFeatures.length; i++){
            if(allFeatures[i].length === 0) return;
            if(allFeatures[i - 1]){
                let label = "Previous results";
                allFeatures[i].push({label});
            }

            if(allFeatures[i + 1] && allFeatures[i + 1].length > 0){
                let label = "More results";
                allFeatures[i].push({label});
            }
        }
    },

    _onKeyDown: function (e){
        let body = this._body;
        let key = e.originalEvent.keyCode;
        if (key >= 49 && key <= 55){
            let feature = body.allFeatures[body.index][key - 49];
            let group = feature.group;
            if (group) {
                this._map.featureIndex.currentIndex = feature.index - 1;
                group.focus();
            }
        } else if(key === 56){
            this._newContent(body, -1);
        } else if(key === 57){
            this._newContent(body, 1);
        }
    },

    _newContent: function (body, direction) {
        let index = body.firstChild.getAttribute("data-index");
        let newContent = body.allFeatures[Math.floor(((index - 1) / 7) + direction)];
        if(newContent && newContent.length > 0){
            body.innerHTML = "";
            body.index += direction;
            for(let i = 0; i < newContent.length; i++){
                let feature = newContent[i];
                let index = feature.index ? feature.index : 0;
                let key = i + 1;
                if (feature.label === "More results") key = 9;
                if (feature.label === "Previous results") key = 8;
                body.appendChild(this._updateOutput(feature.label, index, key));
            }
        }
    },

    _toggleEvents: function (){
        this._map.on("viewreset move moveend focus blur", this._addOrRemoveFeatureIndex, this);

    },

    _addOrRemoveFeatureIndex: function (e) {
        let obj = this;
        let features = this._body.allFeatures ? this._body.allFeatures.length : 0;
        setTimeout(function() {
            if (e && e.type === "focus") {
                obj._container.removeAttribute("hidden");
                if (features !== 0) obj._output.classList.remove("mapml-screen-reader-output");
            } else if (e && e.type === "blur") {
                obj._container.setAttribute("hidden", "");
                obj._output.classList.add("mapml-screen-reader-output");
            } else if (obj._map.isFocused) {
                obj._container.removeAttribute("hidden");
                if (features !== 0) {
                    obj._output.classList.remove("mapml-screen-reader-output");
                } else {
                    obj._output.classList.add("mapml-screen-reader-output");
                }
            } else {
                obj._container.setAttribute("hidden", "");
                obj._output.classList.add("mapml-screen-reader-output");
            }
        }, 0);

    },

});

export var featureIndexOverlay = function (options) {
    return new FeatureIndexOverlay(options);
};