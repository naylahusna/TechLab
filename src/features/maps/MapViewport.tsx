import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

import { mapDocument, type MapCenter } from './map-document';

const attributionUrl = 'https://www.openstreetmap.org/copyright';

export function MapViewport({ center }: { center: MapCenter }) {
  return (
    <WebView
      accessibilityLabel="Peta laboratorium"
      applicationNameForUserAgent="TechLab/1.0 (https://github.com/naylahusna/TechLab)"
      originWhitelist={['*']}
      onShouldStartLoadWithRequest={({ url }) => {
        if (url === attributionUrl) {
          void Linking.openURL(url).catch(() => undefined);
        }
        return url === 'about:blank';
      }}
      onOpenWindow={({ nativeEvent: { targetUrl } }) => {
        if (targetUrl === attributionUrl) {
          void Linking.openURL(targetUrl).catch(() => undefined);
        }
      }}
      source={{ html: mapDocument(center) }}
      style={{ flex: 1 }}
    />
  );
}
