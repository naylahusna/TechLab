import { RoleProvider } from './src/core/role-context';
import { RoleSelectionScreen } from './src/features/auth/RoleSelectionScreen';

export default function App() {
  return (
    <RoleProvider>
      <RoleSelectionScreen />
    </RoleProvider>
  );
}
