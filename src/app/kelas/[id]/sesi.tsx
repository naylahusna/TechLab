import { Redirect, useLocalSearchParams } from 'expo-router';

export default function SessionsRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (typeof id !== 'string' || !id) return <Redirect href="/kelas" />;
  return <Redirect href={`/kelas/${id}/jadwal`} />;
}
