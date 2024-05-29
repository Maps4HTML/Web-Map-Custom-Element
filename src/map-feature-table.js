import './leaflet.js'; // bundled with proj4, proj4leaflet, modularized
import './mapml.js';
import { MapViewer } from './mapml-viewer.js';

export class MapFeatureTable extends HTMLElement {
  // don't need attributes, so no need for static get observedAttributes(),
  // nor attributeChangedCallback(name, oldValue, newValue) tbd
  //
  get styleString() {
    return `table {
        border-collapse: collapse;
        border: 2px solid rgb(200,200,200);
        letter-spacing: 1px;
        font-size: 0.8rem;
      }

      td, th {
        border: 1px solid rgb(190,190,190);
        padding: 10px 20px;
      }

      th {
        background-color: rgb(235,235,235);
      }

      td {
        text-align: center;
      }

      tr:nth-child(even) td {
        background-color: rgb(250,250,250);
      }

      tr:nth-child(odd) td {
        background-color: rgb(245,245,245);
      }

      caption {
        padding: 10px;
      }`;
  }
  set styleString(style) {
    this.styleString = style;
  }
  get tableString() {
    return `<table>
      <caption>A map of the provinces and territories of Canada, 2024</caption>
      <!-- the colgroup structures the table  https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup#usage_notes -->
      <colgroup>
        <!-- the first column is optionally subdivided into two compartments left and right (?) --> 
        <col>
        <!-- the second column has an inline style specifiying the border style --> 
        <col style="border: 2px solid black">
        <!-- this groups the remaining 9 columns into one related block of columns -->
        <!-- column groups can be styled via some css properties, see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col#usage_notes -->
        <col span="4">
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Feature Name</th><!-- map-featurecaption is the accessible name -->
          <th scope="col">Feature Properties</th> 
          <th scope="col">Geometry details</th> <!-- geom. type, any links from the geom to elsewhere are presented as a list here -->
          <th scope="col">Zoom to here link</th> <!-- set the map extent to the bounds of the feature, regenerate table -->
          <th scope="col">Layer</th>
          <th scope="col">Rank by: Least distance from map center</th>
        </tr>
      </thead>
      <tbody>
        <!-- one row (tr) for each layer, whether it has features or not -->
        <tr>
          <!-- the rowspan attribute value should be set to the count of features from this layer -->
          <!-- the colspan attribute -->
          <th scope="row">Manitoba</th>
          <td>
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td rowspan="13">Canada's Provinces and Territories</td>
          <td>1</td>
        </tr>
        <tr>
          <th scope="row">Saskatchewan</th>
          <td>
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>2</td>
        </tr>
        <tr>
          <th scope="row">Nunavut</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>3</td>
        </tr>
        <tr>
          <th scope="row">Alberta</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>4</td>
        </tr>
        <tr>
          <th scope="row">Quebec</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>5</td>
        </tr>
        <tr>
          <th scope="row">Ontario</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>6</td>
        </tr>
        <tr>
          <th scope="row">Northwest Territories</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>7</td>
        </tr>
        <tr>
          <th scope="row">Newfoundland and Labrador</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>8</td>
        </tr>
        <tr>
          <th scope="row">British Columbia</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>9</td>
        </tr>
        <tr>
          <th scope="row">Yukon</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>10</td>
        </tr>
        <tr>
          <th scope="row">New Brunswick</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>11</td>
        </tr>
        <tr>
          <th scope="row">Prince Edward Island</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>12</td>
        </tr>
        <tr>
          <th scope="row">Nova Scotia</th>
          <td>                
          </td>
          <td>Details of the geometry: identify its type, and list any links in it</td>
          <td><a href="Zoom to here link">Filter map contents by bounds</a></td>
          <td>13</td>
        </tr>
      </tbody>
    </table>`;
  }
  set tableString(table) {
    this.tableString = table;
  }

  constructor() {
    // Always call super first in constructor
    super();
  }
  connectedCallback() {
    // the connectedCallback is a lifecycle callback. The viewer will create
    // a MapFeatureTable, and replace itself in the light DOM with the
    // <map-feature-table>, using the dimensions of the viewer by default
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    let s = document.createElement('style');
    s.innerHTML = this.styleString;
    this.shadowRoot.appendChild(s);
    let t = document.createElement('template');
    t.innerHTML = this.tableString;
    this.shadowRoot.appendChild(t.content.firstChild.cloneNode(true));
    /* jshint ignore:start */
    this.parentNode.replaceChild(this.viewer, this);
    /* jshint ignore:end */
  }
}
