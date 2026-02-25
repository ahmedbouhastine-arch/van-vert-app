
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthenticatedLayout } from './_components/AuthenticatedLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </FirebaseClientProvider>
  );
}
