import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAuth } from '../../auth/AuthProvider';

export function AssistantRoute({
  children, access = 'assistant',
}: { children: ReactNode; access?: 'assistant' | 'aslab' | 'staff' }) {
  const auth = useAuth();
  if (!auth.profile) return <Redirect href="/" />;
  const isAssistant = auth.profile.role === 'asisten';
  const isAslab = auth.profile.role === 'admin';
  if (!(isAssistant && access !== 'aslab') && !(isAslab && access !== 'assistant')) {
    return <Redirect href={isAslab ? '/lokasi' : '/jadwal'} />;
  }
  return <>{children}</>;
}
