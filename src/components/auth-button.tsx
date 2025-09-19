'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, provider, signInWithPopup } from '@/lib/firebase';
import { Button } from './ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push('/admin');
    } catch (error: any) {
      console.error('Error signing in with Google: ', error);
      toast({
          title: 'Authentication Failed',
          description: error.message,
          variant: 'destructive',
        });
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out: ', error);
      toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
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
