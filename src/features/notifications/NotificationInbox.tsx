import { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { View } from 'react-native';
import { AppPage } from '../../components/AppPage';
import { Text } from '../../components/Text';
import { ActionButton } from '../../components/ActionButton';
import { useAuth } from '../auth/AuthProvider';
import { getFirebaseFirestore } from '../../services/firebase/firestore';
import { dateTime, ui } from '../permission/ui';

type Notice = {
  id: string;
  title: string;
  body: string;
  path: string;
  delivery: string;
  createdAt: import('firebase/firestore').Timestamp | null;
};
export function NotificationInbox() {
  const { account } = useAuth();
  if (!account) return <Redirect href="/" />;
  return <Inbox key={account.uid} uid={account.uid} />;
}
function Inbox({ uid }: { uid: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState(false);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(getFirebaseFirestore(), 'users', uid, 'notifications'),
          orderBy('createdAt', 'desc'),
          limit(50),
        ),
        { includeMetadataChanges: true },
        (snapshot) => {
          setItems(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Notice));
          setLoading(false);
          setError(false);
          setCached(snapshot.metadata.fromCache);
        },
        () => {
          setError(true);
          setLoading(false);
        },
      ),
    [uid, retry],
  );
  return (
    <AppPage title="Pemberitahuan" subtitle="Pembukaan sesi, perubahan jadwal, dan keputusan izin.">
      <ActionButton
        title="Kembali"
        secondary
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/profil');
        }}
      />
      {loading && <Text style={ui.copy}>Memuat pemberitahuan…</Text>}
      {cached && (
        <Text style={ui.meta}>
          Data tersimpan ditampilkan. Sambungkan jaringan untuk mendapatkan pembaruan.
        </Text>
      )}
      {error && (
        <>
          <Text style={ui.error}>Pemberitahuan belum dapat dimuat. Periksa koneksi.</Text>
          <ActionButton title="Coba lagi" onPress={() => setRetry((value) => value + 1)} />
        </>
      )}
      {!loading && !error && !items.length && <Text style={ui.copy}>Belum ada pemberitahuan.</Text>}
      {items.map((item) => (
        <View key={item.id} style={ui.card}>
          <Text style={ui.heading}>{item.title}</Text>
          <Text style={ui.copy}>{item.body}</Text>
          <Text style={ui.meta}>{dateTime(item.createdAt)}</Text>
          <Text style={ui.meta}>
            {item.delivery === 'confirmed'
              ? 'Layanan push telah meneruskan pemberitahuan. Tampilan di perangkat mengikuti pengaturan notifikasi.'
              : item.delivery === 'accepted'
                ? 'Diterima layanan push; penerimaan perangkat belum dikonfirmasi.'
                : ['failed', 'inactive', 'no-device'].includes(item.delivery)
                  ? 'Push perangkat tidak tersedia atau salah satu pengirimannya gagal. Informasi tetap dapat dibaca di sini.'
                  : 'Pengiriman push sedang diproses.'}
          </Text>
          {/^\/(sesi|izin)\/[A-Za-z0-9_.-]+$/.test(item.path) && (
            <ActionButton
              title="Lihat detail"
              secondary
              onPress={() => router.push(item.path as '/izin')}
            />
          )}
        </View>
      ))}
    </AppPage>
  );
}
