import type { MapCenter } from './map-viewport-model';

export const campusCenter: MapCenter = { latitude: -7.0482375, longitude: 110.440765625 };

export function mapDocument() {
  const { latitude, longitude } = campusCenter;
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="anonymous">
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css"
    integrity="sha256-qx5w1Z7EBGW65+cDDaLzzPKBM/1QLmK9WY7vut/XpzI=" crossorigin="anonymous">
  <style>
    html, body, #map { height: 100%; margin: 0; }
    #status { position: absolute; z-index: 1000; top: 12px; right: 12px;
      max-width: calc(100% - 76px); padding: 8px 12px; border-radius: 6px;
      background: white; color: #172554; font: 14px system-ui, sans-serif; }
    .lab-marker {
      width: 34px; height: 34px; box-sizing: border-box; display: grid; place-items: center; border-radius: 50% 50% 50% 12%;
      transform: rotate(-45deg); border: 2px solid white; background: #4268e8;
      color: white; box-shadow: 0 2px 5px #17255455;
      font: bold 13px system-ui, sans-serif;
    }
    .lab-marker span { transform: rotate(45deg); }
    .lab-marker.is-selected { border-color: #20251f; background: #eafcad; color: #20251f; }
    .lab-choice {
      display: block; width: 100%; margin: 4px 0; text-align: left; padding: 8px;
      border: 1px solid #d6dbe8; border-radius: 6px; background: white; color: #20251f;
      cursor: pointer; font: 14px system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <div id="map" aria-label="Peta area laboratorium Informatika UNDIP"></div>
  <div id="status" role="status">Memuat peta…</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"
    integrity="sha256-RamwepGJzlYFTGIKlHzPQeKR5YyV6bYVM7dAqqZe5cs=" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js"
    integrity="sha256-Hmz4yz61/ZCYeaob82o4P7UGyaWy27+rq85lopTdH8s=" crossorigin="anonymous"></script>
  <script>
    const status = document.getElementById('status');
    if (!window.L || !window.L.version) {
      status.textContent = 'Peta gagal dimuat. Periksa koneksi internet.';
    } else {
      const map = L.map('map', { minZoom: 3, maxZoom: 21, zoomControl: false }).setView([${latitude}, ${longitude}], 17);
      map.attributionControl.addAttribution(
        '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · '
        + '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · '
        + '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>'
      );

      function showBasemapError() {
        status.textContent = 'Peta dasar gagal dimuat. Marker lab tetap bisa dipilih.';
        status.hidden = false;
      }

      try {
        const basemap = L.maplibreGL({
          style: 'https://tiles.openfreemap.org/styles/liberty',
          attributionControl: false,
        }).addTo(map);
        const renderer = basemap.getMaplibreMap();
        renderer.on('load', () => { status.hidden = true; });
        renderer.on('error', showBasemapError);
      } catch {
        showBasemapError();
      }

      function send(message) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
        else if (window.parent !== window) window.parent.postMessage(message, '*');
      }

      const markers = L.layerGroup().addTo(map);
      let points = [];
      let labs = [];
      let pinsSeparated = map.getZoom() >= 20;
      let pointKey;
      let selection;
      let focusRevision;
      let zoomSteps = 0;

      function addMarkers(labs) {
        markers.clearLayers();
        const groups = new Map();
        for (const lab of labs) {
          const key = lab.latitude + ',' + lab.longitude;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(lab);
        }
        return Array.from(groups.values()).flatMap((group) => {
          if (!pinsSeparated || group.length > 3) return [createMarker(group, 0)];
          // Separate pins on screen while keeping every marker anchored to the stored coordinate.
          return group
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, 'id'))
            .map((lab, index) => createMarker([lab], [0, 42, -42][index]));
        });
      }

      function createMarker(group, offsetX) {
        const first = group[0];
        const pin = document.createElement('div');
        pin.className = 'lab-marker';
        const label = document.createElement('span');
        const shortLabel = first.name.match(/^Lab Informatika ([A-Z])$/i)?.[1];
        label.textContent = group.length > 1 ? String(group.length) : (shortLabel?.toUpperCase() ?? '•');
        pin.append(label);
        const marker = L.marker([first.latitude, first.longitude], {
          icon: L.divIcon({
            className: 'lab-pin-container', iconSize: [34, 34], iconAnchor: [17 - offsetX, 31],
            html: pin,
          }),
          title: group.length > 1 ? group.length + ' laboratorium di lokasi ini' : first.name,
          riseOnHover: true,
        }).addTo(markers);

        marker.getElement().setAttribute('aria-label', marker.options.title);
        if (group.length === 1) {
          marker.on('click', () => send({ type: 'select', id: first.id }));
        } else {
          const choices = document.createElement('div');
          for (const lab of group) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'lab-choice';
            button.textContent = lab.name;
            button.addEventListener('click', () => {
              marker.closePopup();
              send({ type: 'select', id: lab.id });
            });
            choices.append(button);
          }
          marker.bindPopup(choices);
        }
        return { marker, group };
      }

      function highlightSelection() {
        for (const { marker, group } of points) {
          const selected = group.some((lab) => lab.id === selection);
          const element = marker.getElement();
          element.firstElementChild.classList.toggle('is-selected', selected);
          element.setAttribute('aria-pressed', String(selected));
          marker.setZIndexOffset(selected ? 1000 : 0);
        }
      }

      map.on('zoomend', () => {
        const separatePins = map.getZoom() >= 20;
        if (separatePins === pinsSeparated) return;
        pinsSeparated = separatePins;
        points = addMarkers(labs);
        highlightSelection();
      });

      window.techLabUpdateMap = (next) => {
        const key = JSON.stringify(next.labs);
        const changed = key !== pointKey;
        if (changed) {
          labs = next.labs;
          points = addMarkers(labs);
          pointKey = key;
        }
        if (changed || selection !== next.selectedId) {
          selection = next.selectedId;
          highlightSelection();
        }
        if (next.focus && next.focus.revision !== focusRevision) {
          focusRevision = next.focus.revision;
          map.setView([next.focus.latitude, next.focus.longitude], 17);
          map.closePopup();
        }
        const zoomDelta = next.zoomSteps - zoomSteps;
        zoomSteps = next.zoomSteps;
        if (zoomDelta) map.setZoom(map.getZoom() + zoomDelta, { animate: false });
      };
      if (window.ResizeObserver) {
        new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(document.getElementById('map'));
      }
      window.addEventListener('message', (event) => {
        if (event.source === window.parent && event.data?.type === 'techlab-map/update') {
          window.techLabUpdateMap(event.data.state);
        }
      });
      send({ type: 'ready' });
    }
  </script>
</body>
</html>`;
}
