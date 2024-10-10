const express = require('express');
const app = express();
const path = require('path');
const serveStatic = require('serve-static');
const port = 30001;

//then loads in the index file
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, 'e2e/core')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map-extent')));
app.use(express.static(path.join(__dirname, 'e2e/elements/mapml-viewer')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map-feature')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map-a')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map-input')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map-link')));
app.use(express.static(path.join(__dirname, 'e2e/elements/map-style')));
app.use(express.static(path.join(__dirname, 'e2e/elements/layer-')));
app.use(express.static(path.join(__dirname, 'e2e/api')));
app.use(express.static(path.join(__dirname, 'e2e/data')));
app.use(express.static(path.join(__dirname, 'e2e/geojson')));
// serveStatic enables byte range requests, only required on this directory
app.use(serveStatic(path.join(__dirname, 'e2e/layers')));
app.use(express.static(path.join(__dirname, 'e2e/mapml-viewer')));
app.use(express.static(path.join(__dirname, 'e2e/web-map')));

app.get('/data/query/us_map_query', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/tiles/cbmt/us_map_query.mapml',
    { headers: { 'Content-Type': 'text/mapml' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/query-response-fallback-cs-meta.mapml', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/tiles/cbmt/query-response-fallback-cs-meta.mapml',
    { headers: { 'Content-Type': 'text/mapml' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/query-response-fallback-cs-no-meta.mapml', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/tiles/cbmt/query-response-fallback-cs-no-meta.mapml',
    { headers: { 'Content-Type': 'text/mapml' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
// unable to figure out how to map any .mapml file to the text/mapml content type
// had to hard-code this file
app.get('/layers/queryableMapExtent.mapml', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/layers/queryableMapExtent.mapml',
    { headers: { 'Content-Type': 'text/mapml' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/query/html_query_response', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/tiles/cbmt/html_query_response.html',
    { headers: { 'Content-Type': 'text/html' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/query/DouglasFir', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/tiles/cbmt/DouglasFir.mapml',
    { headers: { 'Content-Type': 'text/mapml' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/noMapMeta', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/noMapMeta.mapml',
    { headers: { 'Content-Type': 'text/mapml' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/query/map.geojson', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/geojson/map.geojson',
    { headers: { 'Content-Type': 'application/geo+json' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});
app.get('/data/query/items.json', (req, res, next) => {
  res.sendFile(
    __dirname + '/e2e/data/geojson/items.json',
    { headers: { 'Content-Type': 'application/json' } },
    (err) => {
      if (err) {
        res.status(403).send('Error.');
      }
    }
  );
});

app.use('/data', express.static(path.join(__dirname, 'e2e/data/tiles/cbmt')));
app.use('/data', express.static(path.join(__dirname, 'e2e/data/tiles/wgs84')));
app.use('/images', express.static(path.join(__dirname, 'e2e/data/images')));
app.use('/features', express.static(path.join(__dirname, 'e2e/features')));
app.use(
  '/data',
  express.static(path.join(__dirname, 'e2e/data/tiles/osmtile'))
);
app.use(
  '/data/cbmt/0',
  express.static(path.join(__dirname, 'e2e/data/tiles/cbmt/0'))
);
app.use(
  '/data/cbmt/2',
  express.static(path.join(__dirname, 'e2e/data/tiles/cbmt/2'))
);
app.use(
  '/data/cbmt/3',
  express.static(path.join(__dirname, 'e2e/data/tiles/cbmt/3'))
);
app.use(
  '/data/wgs84/0',
  express.static(path.join(__dirname, 'e2e/data/tiles/wgs84/0'))
);
app.use(
  '/data/wgs84/1',
  express.static(path.join(__dirname, 'e2e/data/tiles/wgs84/1'))
);
app.use(
  '/data/osmtile/2',
  express.static(path.join(__dirname, 'e2e/data/tiles/osmtile/2'))
);

console.log('Running on localhost:' + port);

app.listen(port);
