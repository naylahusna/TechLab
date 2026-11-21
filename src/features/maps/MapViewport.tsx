import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

import { mapDocument } from './map-document';
import { readMapEvent, type MapState, type MapViewportProps } from './map-viewport-model';

const attributionUrl = 'https://www.openstreetmap.org/copyright';
const source = { html: mapDocument() };

function sendState(view: WebView<unknown>, state: MapState) {
  const serialized = JSON.stringify(state).replace(/</g, '\\u003c');
  view.injectJavaScript(`window.techLabUpdateMap?.(${serialized}); true;`);
}

export function MapViewport({ state, onSelect }: MapViewportProps) {
  const view = useRef<WebView<unknown>>(null);
  const ready = useRef(false);
  useEffect(() => {
    if (ready.current && view.current) sendState(view.current, state);
  }, [state]);

  return (
    <WebView<unknown>
      ref={view}
      accessibilityLabel="Peta laboratorium"
      applicationNameForUserAgent="TechLab/1.0 (https://github.com/naylahusna/TechLab)"
      originWhitelist={['*']}
      onLoadStart={() => { ready.current = false; }}
      onShouldStartLoadWithRequest={({ url }) => {
        if (url === attributionUrl) void Linking.openURL(url).catch(() => undefined);
        return url === 'about:blank';
      }}
      onOpenWindow={({ nativeEvent: { targetUrl } }) => {
        if (targetUrl === attributionUrl) void Linking.openURL(targetUrl).catch(() => undefined);
      }}
      onMessage={({ nativeEvent }) => {
        let message: unknown;
        try {
          message = JSON.parse(nativeEvent.data);
        } catch {
          return;
        }
        const event = readMapEvent(message);
        if (event?.type === 'ready' && view.current) {
          ready.current = true;
          sendState(view.current, state);
        }
        if (event?.type === 'select') onSelect(event.id);
      }}
      source={source}
      style={{ flex: 1 }}
    />
  );
}
