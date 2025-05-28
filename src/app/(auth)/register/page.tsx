
import { RegisterForm } from '@/components/auth/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | ChirpSpark',
  description: 'Create a new ChirpSpark account.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
