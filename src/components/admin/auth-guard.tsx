'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
        <div className="p-4 md:p-8 space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-8 w-1/4" />
            <div className="mt-8 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return null;
}
