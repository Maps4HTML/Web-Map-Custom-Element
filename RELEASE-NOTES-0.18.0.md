# Release Notes — v0.18.0

_Changes since [v0.17.0](https://github.com/Maps4HTML/MapML.js/releases/tag/v0.17.0)._

## Features
- Implement the search control UI, including a custom search handler with a
  geonames.org example, localization for search messages, non-Latin character
  search support, and multiple search-link handling. The search panel grabs
  focus on mouse enter and stays open until dismissed.
- Add `HTMLMapmlViewerElement.zoomToExtent(xmin, ymin, xmax, ymax)` to support
  custom search handler development.

## Fixes
- Harden pasted-content handling
- Add missing UK locale keys.

## Build / Tooling
- Update Node to v22 LTS, add Playwright browser caching, prevent `npm ci` from
  installing browsers, and ignore postinstall scripts.

## Other
- Make zoom/reload control icons bolder to match the search icon; update
  screenshots accordingly.

---

### Commits
- Harden pasted-content handling; add missing UK locale keys (`4f191331`)
- Fix search control placement when added via `controlslist="search"` after map
  creation (`d99a1564`)
- Update Node to v22 LTS; add Playwright browser caching; prevent `npm ci` from
  installing browsers; ignore postinstall scripts (`b0a44a28`)
- Implement search control UI (`e5f6d147`)
