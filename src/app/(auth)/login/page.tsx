
import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | ChirpSpark',
  description: 'Login to your ChirpSpark account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
