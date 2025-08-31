'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, provider, signInWithRedirect } from '@/lib/firebase';
import { Button } from './ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (user) {
    return (
      <Button variant="outline" onClick={handleSignOut}>
        <LogOut />
        Sign Out
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleSignIn}>
      <LogIn />
      Sign In
    </Button>
  );
}
