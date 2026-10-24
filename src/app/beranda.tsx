import { Redirect } from 'expo-router';

import { useRole } from '../core/role-context';

/** Preserve onboarding's destination while the tabs become the main navigation. */
export default function HomeRoute() {
  const { currentUser } = useRole();
  return <Redirect href={currentUser ? '/jadwal' : '/'} />;
}
