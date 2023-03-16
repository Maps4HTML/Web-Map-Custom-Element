import { test, expect, chromium } from '@playwright/test';

test.describe("Playwright MapFeature Custom Element Tests", () => {
    let page;
    let context;
    test.beforeAll(async () => {
      context = await chromium.launchPersistentContext('');
      page = context.pages().find((page) => page.url() === 'about:blank') || await context.newPage();
      await page.goto("mapFeature.html");
    });

    test.afterAll(async function () {
      await context.close();
    });

    test("Shadowroot tests of <layer- > with src attribute", async () => {
        let shadowAttached = await page.$eval(
            "body > map",
            (map) => map.layers[1].shadowRoot !== null
        );
        expect(shadowAttached).toEqual(true);

        // remove and then re-add <layer- > element
        shadowAttached = await page.$eval(
            "body > map",
            (map) => {
                let layer = map.layers[1];
                map.removeChild(layer);
                map.appendChild(layer);
                return layer.shadowRoot !== null;
            }
        );
        expect(shadowAttached).toEqual(true);
    });

    test("MapFeature interactivity tests", async () => {
        let label = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(1)",
            g => g.getAttribute('aria-label')
        );
        expect(label).toEqual("Accessible Square");
        
        // change <map-feature> attributes
        await page.$eval(
            "body > map", 
            async (map) => {
                let layer = map.querySelector('layer-'),
                    mapFeature = layer.querySelector('map-feature');
                mapFeature.setAttribute('zoom', "4");
            }
        );
        await page.waitForTimeout(200);
        label = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(1)",
            g => g.getAttribute('aria-label')
        );
        // the <map-feature> el is re-rendered and re-attach to the map
        expect(label).toEqual("Feature");

        // change characterData of <map-feature>'s children elements
        await page.reload();
        await page.waitForTimeout(500);
        label = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(1)",
            g => g.getAttribute('aria-label')
        );
        expect(label).toEqual("Accessible Square");
        await page.$eval(
            "body > map", 
            (map) => {
                let layer = map.querySelector('layer-'),
                    mapFeature = layer.querySelector('map-feature'),
                    mapCoord = mapFeature.querySelector('map-coordinates');
                mapCoord.innerHTML = "12 11 12 11 12 12 11 12"
            }
        );
        label = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(1)",
            g => g.getAttribute('aria-label')
        );
        // the <map-feature> el is re-rendered and re-attach to the map
        expect(label).toEqual("Feature");
    });

    test("Get feature extent", async () => {
        await page.reload();
        await page.waitForTimeout(500);
        const extent = await page.$eval(
            "body > map", 
            (map) => {
                let layer = map.querySelector('layer-'),
                    mapFeature = layer.querySelector('map-feature');
                return mapFeature.extent;
            }            
        )
        const expectedExtent = {
            "topLeft": {
                "tcrs": [
                    {
                        "horizontal": 971.0344827586206,
                        "vertical": 971.0344827586206
                    },
                    {
                        "horizontal": 1656.470588235294,
                        "vertical": 1656.470588235294
                    },
                    {
                        "horizontal": 2816,
                        "vertical": 2816
                    },
                    {
                        "horizontal": 4693.333333333333,
                        "vertical": 4693.333333333333
                    },
                    {
                        "horizontal": 8045.714285714285,
                        "vertical": 8045.714285714285
                    },
                    {
                        "horizontal": 14080,
                        "vertical": 14080
                    },
                    {
                        "horizontal": 23466.666666666668,
                        "vertical": 23466.666666666668
                    },
                    {
                        "horizontal": 40228.57142857143,
                        "vertical": 40228.57142857143
                    },
                    {
                        "horizontal": 70399.99999999999,
                        "vertical": 70399.99999999999
                    },
                    {
                        "horizontal": 117333.33333333333,
                        "vertical": 117333.33333333333
                    },
                    {
                        "horizontal": 201142.85714285713,
                        "vertical": 201142.85714285713
                    },
                    {
                        "horizontal": 335238.0952380952,
                        "vertical": 335238.0952380952
                    },
                    {
                        "horizontal": 563199.9999999999,
                        "vertical": 563199.9999999999
                    },
                    {
                        "horizontal": 971034.4827586205,
                        "vertical": 971034.4827586205
                    },
                    {
                        "horizontal": 1656470.588235294,
                        "vertical": 1656470.588235294
                    },
                    {
                        "horizontal": 2815999.9999999995,
                        "vertical": 2815999.9999999995
                    },
                    {
                        "horizontal": 4693333.333333333,
                        "vertical": 4693333.333333333
                    },
                    {
                        "horizontal": 8045714.285714285,
                        "vertical": 8045714.285714285
                    },
                    {
                        "horizontal": 14079999.999999998,
                        "vertical": 14079999.999999998
                    },
                    {
                        "horizontal": 23466666.666666664,
                        "vertical": 23466666.666666664
                    },
                    {
                        "horizontal": 40228571.428571425,
                        "vertical": 40228571.428571425
                    },
                    {
                        "horizontal": 70400000,
                        "vertical": 70400000
                    },
                    {
                        "horizontal": 117333333.33333334,
                        "vertical": 117333333.33333334
                    },
                    {
                        "horizontal": 201142857.14285713,
                        "vertical": 201142857.14285713
                    },
                    {
                        "horizontal": 335238095.2380952,
                        "vertical": 335238095.2380952
                    },
                    {
                        "horizontal": 563200000,
                        "vertical": 563200000
                    }
                ],
                "tilematrix": [
                    {
                        "horizontal": 3.7931034482758617,
                        "vertical": 3.7931034482758617
                    },
                    {
                        "horizontal": 6.470588235294117,
                        "vertical": 6.470588235294117
                    },
                    {
                        "horizontal": 11,
                        "vertical": 11
                    },
                    {
                        "horizontal": 18.333333333333332,
                        "vertical": 18.333333333333332
                    },
                    {
                        "horizontal": 31.428571428571427,
                        "vertical": 31.428571428571427
                    },
                    {
                        "horizontal": 55,
                        "vertical": 55
                    },
                    {
                        "horizontal": 91.66666666666667,
                        "vertical": 91.66666666666667
                    },
                    {
                        "horizontal": 157.14285714285714,
                        "vertical": 157.14285714285714
                    },
                    {
                        "horizontal": 274.99999999999994,
                        "vertical": 274.99999999999994
                    },
                    {
                        "horizontal": 458.3333333333333,
                        "vertical": 458.3333333333333
                    },
                    {
                        "horizontal": 785.7142857142857,
                        "vertical": 785.7142857142857
                    },
                    {
                        "horizontal": 1309.5238095238094,
                        "vertical": 1309.5238095238094
                    },
                    {
                        "horizontal": 2199.9999999999995,
                        "vertical": 2199.9999999999995
                    },
                    {
                        "horizontal": 3793.1034482758614,
                        "vertical": 3793.1034482758614
                    },
                    {
                        "horizontal": 6470.588235294117,
                        "vertical": 6470.588235294117
                    },
                    {
                        "horizontal": 10999.999999999998,
                        "vertical": 10999.999999999998
                    },
                    {
                        "horizontal": 18333.333333333332,
                        "vertical": 18333.333333333332
                    },
                    {
                        "horizontal": 31428.571428571428,
                        "vertical": 31428.571428571428
                    },
                    {
                        "horizontal": 54999.99999999999,
                        "vertical": 54999.99999999999
                    },
                    {
                        "horizontal": 91666.66666666666,
                        "vertical": 91666.66666666666
                    },
                    {
                        "horizontal": 157142.85714285713,
                        "vertical": 157142.85714285713
                    },
                    {
                        "horizontal": 275000,
                        "vertical": 275000
                    },
                    {
                        "horizontal": 458333.3333333334,
                        "vertical": 458333.3333333334
                    },
                    {
                        "horizontal": 785714.2857142857,
                        "vertical": 785714.2857142857
                    },
                    {
                        "horizontal": 1309523.8095238095,
                        "vertical": 1309523.8095238095
                    },
                    {
                        "horizontal": 2200000,
                        "vertical": 2200000
                    }
                ],
                "gcrs": {
                    "horizontal": -68.95132026921893,
                    "vertical": 32.845234777064036
                },
                "pcrs": {
                    "horizontal": 2597607.840149015,
                    "vertical": 2056592.1598509848
                }
            },
            "bottomRight": {
                "tcrs": [
                    {
                        "horizontal": 1059.310344827586,
                        "vertical": 1059.310344827586
                    },
                    {
                        "horizontal": 1807.0588235294113,
                        "vertical": 1807.0588235294113
                    },
                    {
                        "horizontal": 3072,
                        "vertical": 3072
                    },
                    {
                        "horizontal": 5119.999999999999,
                        "vertical": 5119.999999999999
                    },
                    {
                        "horizontal": 8777.142857142855,
                        "vertical": 8777.142857142855
                    },
                    {
                        "horizontal": 15359.999999999998,
                        "vertical": 15359.999999999998
                    },
                    {
                        "horizontal": 25599.999999999996,
                        "vertical": 25599.999999999996
                    },
                    {
                        "horizontal": 43885.71428571428,
                        "vertical": 43885.71428571428
                    },
                    {
                        "horizontal": 76799.99999999999,
                        "vertical": 76799.99999999999
                    },
                    {
                        "horizontal": 127999.99999999999,
                        "vertical": 127999.99999999999
                    },
                    {
                        "horizontal": 219428.5714285714,
                        "vertical": 219428.5714285714
                    },
                    {
                        "horizontal": 365714.2857142856,
                        "vertical": 365714.2857142856
                    },
                    {
                        "horizontal": 614399.9999999999,
                        "vertical": 614399.9999999999
                    },
                    {
                        "horizontal": 1059310.3448275859,
                        "vertical": 1059310.3448275859
                    },
                    {
                        "horizontal": 1807058.8235294113,
                        "vertical": 1807058.8235294113
                    },
                    {
                        "horizontal": 3071999.9999999995,
                        "vertical": 3071999.9999999995
                    },
                    {
                        "horizontal": 5119999.999999999,
                        "vertical": 5119999.999999999
                    },
                    {
                        "horizontal": 8777142.857142856,
                        "vertical": 8777142.857142856
                    },
                    {
                        "horizontal": 15359999.999999998,
                        "vertical": 15359999.999999998
                    },
                    {
                        "horizontal": 25599999.999999996,
                        "vertical": 25599999.999999996
                    },
                    {
                        "horizontal": 43885714.285714276,
                        "vertical": 43885714.285714276
                    },
                    {
                        "horizontal": 76799999.99999999,
                        "vertical": 76799999.99999999
                    },
                    {
                        "horizontal": 127999999.99999999,
                        "vertical": 127999999.99999999
                    },
                    {
                        "horizontal": 219428571.4285714,
                        "vertical": 219428571.4285714
                    },
                    {
                        "horizontal": 365714285.7142857,
                        "vertical": 365714285.7142857
                    },
                    {
                        "horizontal": 614399999.9999999,
                        "vertical": 614399999.9999999
                    }
                ],
                "tilematrix": [
                    {
                        "horizontal": 4.137931034482758,
                        "vertical": 4.137931034482758
                    },
                    {
                        "horizontal": 7.058823529411763,
                        "vertical": 7.058823529411763
                    },
                    {
                        "horizontal": 12,
                        "vertical": 12
                    },
                    {
                        "horizontal": 19.999999999999996,
                        "vertical": 19.999999999999996
                    },
                    {
                        "horizontal": 34.28571428571428,
                        "vertical": 34.28571428571428
                    },
                    {
                        "horizontal": 59.99999999999999,
                        "vertical": 59.99999999999999
                    },
                    {
                        "horizontal": 99.99999999999999,
                        "vertical": 99.99999999999999
                    },
                    {
                        "horizontal": 171.42857142857142,
                        "vertical": 171.42857142857142
                    },
                    {
                        "horizontal": 299.99999999999994,
                        "vertical": 299.99999999999994
                    },
                    {
                        "horizontal": 499.99999999999994,
                        "vertical": 499.99999999999994
                    },
                    {
                        "horizontal": 857.142857142857,
                        "vertical": 857.142857142857
                    },
                    {
                        "horizontal": 1428.5714285714282,
                        "vertical": 1428.5714285714282
                    },
                    {
                        "horizontal": 2399.9999999999995,
                        "vertical": 2399.9999999999995
                    },
                    {
                        "horizontal": 4137.931034482757,
                        "vertical": 4137.931034482757
                    },
                    {
                        "horizontal": 7058.823529411763,
                        "vertical": 7058.823529411763
                    },
                    {
                        "horizontal": 11999.999999999998,
                        "vertical": 11999.999999999998
                    },
                    {
                        "horizontal": 19999.999999999996,
                        "vertical": 19999.999999999996
                    },
                    {
                        "horizontal": 34285.71428571428,
                        "vertical": 34285.71428571428
                    },
                    {
                        "horizontal": 59999.99999999999,
                        "vertical": 59999.99999999999
                    },
                    {
                        "horizontal": 99999.99999999999,
                        "vertical": 99999.99999999999
                    },
                    {
                        "horizontal": 171428.5714285714,
                        "vertical": 171428.5714285714
                    },
                    {
                        "horizontal": 299999.99999999994,
                        "vertical": 299999.99999999994
                    },
                    {
                        "horizontal": 499999.99999999994,
                        "vertical": 499999.99999999994
                    },
                    {
                        "horizontal": 857142.857142857,
                        "vertical": 857142.857142857
                    },
                    {
                        "horizontal": 1428571.4285714284,
                        "vertical": 1428571.4285714284
                    },
                    {
                        "horizontal": 2399999.9999999995,
                        "vertical": 2399999.9999999995
                    }
                ],
                "gcrs": {
                    "horizontal": -21.136072852126574,
                    "vertical": 32.84534046279946
                },
                "pcrs": {
                    "horizontal": 5984281.280162558,
                    "vertical": -1330081.280162558
                }
            },
            "projection": "CBMTILE"
        };
        expect(extent).toEqual(expectedExtent);
    });

    test("Get GeoJSON representation of map-geometry", async () => {
        const geojson = await page.$eval(
            "body > map", 
            (map) => {
                let layer = map.querySelector('layer-'),
                    mapFeature = layer.querySelector('map-feature');
                return mapFeature.geometryToGeoJSON();
            }   
        )
        const expectedGeoJSON = {
            "0": {
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -94.99984966849256,
                                49.00009891208923
                            ],
                            [
                                -94.99983600199188,
                                49.000098912067
                            ],
                            [
                                -94.99983600195664,
                                49.00010790408876
                            ],
                            [
                                -94.99984966846026,
                                49.00010790411096
                            ]
                        ]
                    ]
                },
                "properties": {
                    "prop0": "Testtest"
                }
            }
        }
        expect(geojson).toEqual(expectedGeoJSON);
    });

    test("Default click() and focus() methods", async () => {
        const popup = await page.$eval(
            "body > map", 
            (map) => {
                let layer = map.querySelector('layer-'),
                    mapFeature = layer.querySelector('map-feature');
                mapFeature.click();
                return mapFeature._featureLayer?.isPopupOpen();
            }   
        );
        expect(popup).toEqual(true);
        let focus = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(1)",
            (g) => g.classList.contains("focus")
        )
        expect(focus).toEqual(true);
        await page.click("body > map");
        focus = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(1)",
            (g) => g.classList.contains("focus")
        );
        expect(focus).toEqual(false);

        const layerCount = await page.$eval(
            "body > map",
            (map) => {
                let layer = map.querySelector('layer-'),
                    nextFeature = layer.querySelectorAll('map-feature')[1];
                nextFeature.click();
                return map.layers.length;
            }
        )
        expect(layerCount).toEqual(3);
        focus = await page.$eval(
            "body > map > div > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > div > div.mapml-vector-container > svg > g > g:nth-child(2)",
            (g) => {
                for (let path of g.querySelectorAll('path')) {
                    if (!path.classList.contains("map-a-visited")) {
                        return false;
                    }
                }
                return true;
            }
        )
        expect(focus).toEqual(true);
    });

    test("Custom click() and focus() methods", async () => {
        const isClicked = await page.$eval(
            "body > map", 
            (map) => {
                let layer = map.querySelector('layer-'),
                mapFeature = layer.querySelector('map-feature');
                // define custom click() and focus() methods
                mapFeature.onclick = function (e) {
                    let target = e.target || this;
                    target.classList.add("click");
                }
                mapFeature.onfocus = function (e) {
                    let target = e.target || this;
                    target.classList.add("focus");
                }
                mapFeature.click();
                mapFeature.focus();
                return mapFeature.classList.contains("click") && mapFeature.classList.contains("focus");
            }   
        );
        expect(isClicked).toEqual(true);
    })
})