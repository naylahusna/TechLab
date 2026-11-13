import { Redirect } from 'expo-router';
import { useAuth } from '../features/auth/AuthProvider';
import { AuthForm } from '../features/auth/AuthForm';

export default function RegisterRoute() {
  const { profile } = useAuth();
  return profile ? <Redirect href="/beranda" /> : <AuthForm mode="register" />;
}
