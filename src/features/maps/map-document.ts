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
  <style>
    html, body, #map { height: 100%; margin: 0; }
    #status { position: absolute; z-index: 1000; top: 12px; right: 12px;
      max-width: calc(100% - 76px); padding: 8px 12px; border-radius: 6px;
      background: white; color: #172554; font: 14px system-ui, sans-serif; }
    .lab-marker {
      box-sizing: border-box; display: grid; place-items: center; border-radius: 50% 50% 50% 12%;
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
  <script>
    const status = document.getElementById('status');
    if (!window.L || !window.L.version) {
      status.textContent = 'Peta gagal dimuat. Periksa koneksi internet.';
    } else {
      const map = L.map('map', { minZoom: 3 }).setView([${latitude}, ${longitude}], 17);
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 19,
        maxZoom: 21,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
        referrerPolicy: 'strict-origin-when-cross-origin',
      });
      tiles.on('tileload', () => { status.hidden = true; });
      tiles.on('tileerror', () => {
        status.textContent = 'Sebagian peta gagal dimuat.';
        status.hidden = false;
      });
      tiles.addTo(map);

      function send(message) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
        else if (window.parent !== window) window.parent.postMessage(message, '*');
      }

      const markers = L.layerGroup().addTo(map);
      let points;
      let pointKey;
      let selection;
      let focusRevision;

      function addMarkers(labs) {
        markers.clearLayers();
        const groups = new Map();
        for (const lab of labs) {
          const key = lab.latitude + ',' + lab.longitude;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(lab);
        }
        return Array.from(groups.values(), (group) => {
          const first = group[0];
          const marker = L.marker([first.latitude, first.longitude], {
            icon: L.divIcon({
              className: 'lab-pin-container', iconSize: [34, 34], iconAnchor: [17, 31],
              html: '<div class="lab-marker" style="width:34px;height:34px"><span>'
                + (group.length > 1 ? group.length : '•') + '</span></div>',
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
        });
      }

      window.techLabUpdateMap = (next) => {
        const key = JSON.stringify(next.labs);
        const changed = key !== pointKey;
        if (changed) {
          points = addMarkers(next.labs);
          pointKey = key;
        }
        if (changed || selection !== next.selectedId) {
          selection = next.selectedId;
          for (const { marker, group } of points) {
            const selected = group.some((lab) => lab.id === selection);
            const element = marker.getElement();
            element.firstElementChild.classList.toggle('is-selected', selected);
            element.setAttribute('aria-pressed', String(selected));
            marker.setZIndexOffset(selected ? 1000 : 0);
          }
        }
        if (next.focus && next.focus.revision !== focusRevision) {
          focusRevision = next.focus.revision;
          map.setView([next.focus.latitude, next.focus.longitude], 17);
          map.closePopup();
        }
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
