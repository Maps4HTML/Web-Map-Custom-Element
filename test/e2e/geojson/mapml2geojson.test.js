import { test, expect, chromium } from '@playwright/test';

test.describe("GeoJSON API - mapml2geojson", () => {
    let page;
    let context;
    test.beforeAll(async function() {
      context = await chromium.launchPersistentContext('');
      page = context.pages().find((page) => page.url() === 'about:blank') || await context.newPage();
      await page.goto("mapml2geojson.html");
    });

    test.afterAll(async function () {
      await context.close();
    });

  test("Point Geometry", async () => {
    const out0 = await page.$eval(
      "body > p#json0",
      (p) => JSON.parse(p.innerHTML)
    );
    expect(out0).toEqual(point);
  });

  test("Line Geometry", async () => {
   const out1 = await page.$eval(
     "body > p#json1",
     (p) => JSON.parse(p.innerHTML)
   );
   expect(out1).toEqual(line);
 });

  test("Polygon Geometry with holes", async () => {
   const out2 = await page.$eval(
     "body > p#json2",
     (p) => JSON.parse(p.innerHTML)
   );
   expect(out2).toEqual(polygon);
 });

  test("MultiPoint Geometry", async () => {
   const out3 = await page.$eval(
     "body > p#json3",
     (p) => JSON.parse(p.innerHTML)
   );
   expect(out3).toEqual(multipoint);
 });

 test("MultiLineString Geometry", async () => {
   const out4 = await page.$eval(
     "body > p#json4",
     (p) => JSON.parse(p.innerHTML)
   );
   expect(out4).toEqual(multilinestring);
 });

 test("MultiPolygon Geometry", async () => {
   const out5 = await page.$eval(
     "body > p#json5",
     (p) => JSON.parse(p.innerHTML)
   );
   expect(out5).toEqual(multipolygon);
 });

 test("Feature Collections", async () => {
  const out6 = await page.$eval(
    "body > p#json6",
    (p) => JSON.parse(p.innerHTML)
  );
  expect(out6).toEqual(featurecollection);
});

test("Geometry Collection", async () => {
   const out7 = await page.$eval(
     "body > p#json7",
     (p) => JSON.parse(p.innerHTML)
   );
   expect(out7).toEqual(geometrycollection);
 });

});

let point = {
   "title": "Point Geometry",
   "type": "FeatureCollection",
   "features": [{
       "type": "Feature",
       "geometry": {
           "type": "Point",
           "coordinates": [-75.6916809, 45.4186964]
       },
       "properties": {
           "prop0": "This is a Point"
       }
   }]
  };

let line = {
 "title": "Line Geometry",
 "type": "FeatureCollection",
 "features": [{
     "type": "Feature",
     "geometry": {
         "type": "LineString",
         "coordinates": [
           [-75.6168365, 45.471929], 
           [-75.6855011, 45.458445], 
           [-75.7016373, 45.4391764], 
           [-75.7030106, 45.4259255], 
           [-75.7236099, 45.4208652], 
           [-75.7565689, 45.4117074], 
           [-75.7833481, 45.384225], 
           [-75.8197403, 45.3714435], 
           [-75.8516693, 45.377714]
       ]
     },
     "properties": {
         "prop0": "This is a Line"
     }
 }]
};

let polygon = {
 "title": "Polygon Geometry",
 "type": "FeatureCollection",
 "features": [{
     "type": "Feature",
     "geometry": {
         "type": "Polygon",
         "coordinates": [
            [
                [-75.5859375, 45.4656690],
                [-75.6813812, 45.4533876],
                [-75.6961441, 45.4239978],
                [-75.7249832, 45.4083331],
                [-75.7792282, 45.3772317],
                [-75.7534790, 45.3294614],
                [-75.5831909, 45.3815724],
                [-75.6024170, 45.4273712],
                [-75.5673981, 45.4639834],
                [-75.5859375, 45.4656690]
            ], 
            [
                [-75.6596588, 45.4211062],
                [-75.6338958, 45.4254436],
                [-75.6277127, 45.4066458],
                [-75.6572542, 45.4097792],
                [-75.6596588, 45.4211062]
            ]
        ]
     },
     "properties": {
         "prop0": "This is a Polygon"
     }
 }]
};

let multipoint = {
 "title": "MultiPoint Geometry",
 "type": "FeatureCollection",
 "features": [{
     "type": "Feature",
     "geometry": {
         "type": "MultiPoint",
         "coordinates": [
             [-75.7016373, 45.4391764],
             [-75.7236099, 45.4208652],
             [-75.7833481, 45.384225]
         ]
     },
     "properties": {
         "prop0": "This is a multipoint"
     }
 }]
};

let multilinestring = {
 "title": "MultiLineString Geometry",
 "type": "FeatureCollection",
 "features": [{
     "type": "Feature",
     "geometry": {
         "type": "MultiLineString",
         "coordinates": [
             [
                 [-75.6168365, 45.471929],
                 [-75.6855011, 45.458445],
                 [-75.7016373, 45.4391764],
                 [-75.7030106, 45.4259255]
             ], 
             [
                 [-75.7565689, 45.4117074],
                 [-75.7833481, 45.384225],
                 [-75.8197403, 45.3714435],
                 [-75.8516693, 45.377714]
             ]
          ]
     },
     "properties": {
         "prop0": "This is a MultiLineString"
     }
 }]
};

let multipolygon = {
   "title": "MultiPolygon Geometry",
   "type": "FeatureCollection",
   "features": [{
       "type": "Feature",
       "geometry": {
           "type": "MultiPolygon",
           "coordinates": [
               [
                   [[-75.5859375, 45.4656690],
                   [-75.6813812, 45.4533876],
                   [-75.6961441, 45.4239978],
                   [-75.7249832, 45.4083331],
                   [-75.7792282, 45.3772317],
                   [-75.7534790, 45.3294614],
                   [-75.5831909, 45.3815724],
                   [-75.6024170, 45.4273712],
                   [-75.5673981, 45.4639834],
                   [-75.5859375, 45.4656690]]
               ], 
               [
                   [[-75.6744295, 45.4728920],
                   [-75.7053451, 45.4439942],
                   [-75.7063756, 45.4249616],
                   [-75.7489704, 45.4177324],
                   [-75.7788555, 45.4003785],
                   [-75.7943133, 45.4321899],
                   [-75.6744295, 45.4728920]]
               ]
           ]
       },
       "properties": {
           "prop0": "This is a MultiPolygon"
       }
   }]
  };

let featurecollection = {
    "type":"FeatureCollection",
    "title":"Test MapML",
    "features":[
       {
          "type":"Feature",
          "geometry":{
             "type":"Polygon",
             "coordinates":[
                [
                   [
                      -75.5859375,
                      45.465669
                   ],
                   [
                      -75.6813812,
                      45.4533876
                   ],
                   [
                      -75.6961441,
                      45.4239978
                   ],
                   [
                      -75.7249832,
                      45.4083331
                   ],
                   [
                      -75.7792282,
                      45.3772317
                   ],
                   [
                      -75.753479,
                      45.3294614
                   ],
                   [
                      -75.5831909,
                      45.3815724
                   ],
                   [
                      -75.602417,
                      45.4273712
                   ],
                   [
                      -75.5673981,
                      45.4639834
                   ],
                   [
                      -75.5859375,
                      45.465669
                   ]
                ]
             ]
          },
          "properties":{
             "id":"24e21a60be4811d892e2080020a0f4c9",
             "label_fr":"Québec",
             "label_en":"Québec",
             "label_ab":"Québec",
             "type_fr":"CITY-Ville",
             "type_en":"CITY-City"
          }
       },
       {
          "type":"Feature",
          "geometry":{
             "type":"LineString",
             "coordinates":[
                [
                   -75.6168365,
                   45.471929
                ],
                [
                   -75.6855011,
                   45.458445
                ],
                [
                   -75.7016373,
                   45.4391764
                ],
                [
                   -75.7030106,
                   45.4259255
                ],
                [
                   -75.7236099,
                   45.4208652
                ],
                [
                   -75.7565689,
                   45.4117074
                ],
                [
                   -75.7833481,
                   45.384225
                ],
                [
                   -75.8197403,
                   45.3714435
                ],
                [
                   -75.8516693,
                   45.377714
                ]
             ]
          },
          "properties":{
             "prop0":"This is a Line"
          }
       },
       {
          "type":"Feature",
          "geometry":{
             "type":"Point",
             "coordinates":[
                -75.6916809,
                45.4186964
             ]
          },
          "properties":{
             "prop0":"This is a Point"
          }
       },
       {
          "type":"Feature",
          "geometry":{
             "type":"MultiPoint",
             "coordinates":[
                [
                   -75.7016373,
                   45.4391764
                ],
                [
                   -75.7236099,
                   45.4208652
                ],
                [
                   -75.7833481,
                   45.384225
                ]
             ]
          },
          "properties":{
             "prop0":"This is a multipoint"
          }
       },
       {
          "type":"Feature",
          "geometry":{
             "type":"MultiLineString",
             "coordinates":[
                [
                   [
                      -75.6168365,
                      45.471929
                   ],
                   [
                      -75.6855011,
                      45.458445
                   ],
                   [
                      -75.7016373,
                      45.4391764
                   ],
                   [
                      -75.7030106,
                      45.4259255
                   ]
                ],
                [
                   [
                      -75.7565689,
                      45.4117074
                   ],
                   [
                      -75.7833481,
                      45.384225
                   ],
                   [
                      -75.8197403,
                      45.3714435
                   ],
                   [
                      -75.8516693,
                      45.377714
                   ]
                ]
             ]
          },
          "properties":{
             "prop0":"This is a MultiLineString"
          }
       },
       {
          "type":"Feature",
          "geometry":{
             "type":"MultiPolygon",
             "coordinates":[
                [
                   [
                      [
                         -75.5859375,
                         45.465669
                      ],
                      [
                         -75.6813812,
                         45.4533876
                      ],
                      [
                         -75.6961441,
                         45.4239978
                      ],
                      [
                         -75.7249832,
                         45.4083331
                      ],
                      [
                         -75.7792282,
                         45.3772317
                      ],
                      [
                         -75.753479,
                         45.3294614
                      ],
                      [
                         -75.5831909,
                         45.3815724
                      ],
                      [
                         -75.602417,
                         45.4273712
                      ],
                      [
                         -75.5673981,
                         45.4639834
                      ],
                      [
                         -75.5859375,
                         45.465669
                      ]
                   ]
                ],
                [
                   [
                      [
                         -75.6744295,
                         45.472892
                      ],
                      [
                         -75.7053451,
                         45.4439942
                      ],
                      [
                         -75.7063756,
                         45.4249616
                      ],
                      [
                         -75.7489704,
                         45.4177324
                      ],
                      [
                         -75.7788555,
                         45.4003785
                      ],
                      [
                         -75.7943133,
                         45.4321899
                      ],
                      [
                         -75.6744295,
                         45.472892
                      ]
                   ],
                   [
                      [
                         -75.6744295,
                         45.472892
                      ],
                      [
                         -75.7053451,
                         45.4439942
                      ],
                      [
                         -75.7063756,
                         45.4249616
                      ],
                      [
                         -75.7489704,
                         45.4177324
                      ],
                      [
                         -75.7788555,
                         45.4003785
                      ],
                      [
                         -75.7943133,
                         45.4321899
                      ],
                      [
                         -75.6744295,
                         45.472892
                      ]
                   ]
                ]
             ]
          },
          "properties":{
             "prop0":"This is a MultiPolygon"
          }
       },
       {
          "type":"Feature",
          "geometry":{
             "type":"Polygon",
             "coordinates":[
                [
                   [
                      -75.5859375,
                      45.465669
                   ],
                   [
                      -75.6813812,
                      45.4533876
                   ],
                   [
                      -75.6961441,
                      45.4239978
                   ],
                   [
                      -75.7249832,
                      45.4083331
                   ],
                   [
                      -75.7792282,
                      45.3772317
                   ],
                   [
                      -75.753479,
                      45.3294614
                   ],
                   [
                      -75.5831909,
                      45.3815724
                   ],
                   [
                      -75.602417,
                      45.4273712
                   ],
                   [
                      -75.5673981,
                      45.4639834
                   ],
                   [
                      -75.5859375,
                      45.465669
                   ]
                ],
                [
                   [
                      -75.6467062,
                      45.4215881
                   ],
                   [
                      -75.6889363,
                      45.4049585
                   ],
                   [
                      -75.6693647,
                      45.3767494
                   ],
                   [
                      -75.627064,
                      45.3924229
                   ],
                   [
                      -75.6467062,
                      45.4215881
                   ]
                ]
             ]
          },
          "properties":{
             "prop0":"This is a Polygon with holes"
          }
       }
    ]
 };

 let geometrycollection = {
   "title": "Geometry Collection",
   "type": "FeatureCollection",
   "features": [{
       "type": "Feature",
       "geometry": {
            "type": "GeometryCollection",
            "geometries": 
            [
             {
              "type": "Polygon",
              "coordinates": [
                  [
                     [-75.5859375, 45.4656690],
                     [-75.6813812, 45.4533876],
                     [-75.6961441, 45.4239978],
                     [-75.7249832, 45.4083331],
                     [-75.7792282, 45.3772317],
                     [-75.7534790, 45.3294614],
                     [-75.5831909, 45.3815724],
                     [-75.6024170, 45.4273712],
                     [-75.5673981, 45.4639834],
                     [-75.5859375, 45.4656690]
                 ]
              ]
             },
             {
                 "type": "LineString",
                 "coordinates": [
                     [-75.6168365, 45.471929],
                     [-75.6855011, 45.458445],
                     [-75.7016373, 45.4391764],
                     [-75.7030106, 45.4259255],
                     [-75.7236099, 45.4208652],
                     [-75.7565689, 45.4117074],
                     [-75.7833481, 45.384225],
                     [-75.8197403, 45.3714435],
                     [-75.8516693, 45.377714]
                 ]
             },
             {
                 "type": "Point",
                 "coordinates": [-75.6916809, 45.4186964]
             }
            ]
        },
                "properties": {
            "prop0": "This is a Geometry Collection"
        }
    }]
};