import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAuth } from '../../auth/AuthProvider';

/** Guard route kelas: hanya asisten yang boleh mengelola kelas. */
export function AssistantRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth.profile) return <Redirect href="/" />;
  if (auth.profile.role !== 'asisten') return <Redirect href="/jadwal" />;
  return <>{children}</>;
}
