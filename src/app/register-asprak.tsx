import { Redirect } from 'expo-router';
import { AuthForm } from '../features/auth/AuthForm';
import { useAuth } from '../features/auth/AuthProvider';

export default function RegisterAsprakRoute() {
  const { profile } = useAuth();
  return profile ? <Redirect href="/beranda" /> : <AuthForm mode="register-asprak" />;
}
