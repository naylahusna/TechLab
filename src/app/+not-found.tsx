import { Redirect } from 'expo-router';

import { useRole } from '../core/role-context';

export default function NotFoundRoute() {
  const { currentUser } = useRole();
  return <Redirect href={currentUser ? '/jadwal' : '/'} />;
}
