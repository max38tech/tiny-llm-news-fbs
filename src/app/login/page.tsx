'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth, provider, signInWithPopup, onAuthStateChanged, getRedirectResult, User } from '@/lib/firebase';
import { Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function Logo() {
    return (
      <div className="flex items-center justify-center -mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-primary"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
    );
  }

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        router.push('/admin');
      } else {
        // This handles both the initial state and sign-out
        setUser(null);
        setLoading(false);
      }
    });

    // Check for redirect result as a fallback.
    getRedirectResult(auth)
      .catch((error) => {
          // This can happen if there's no redirect result, which is normal.
          // We only want to log more serious errors.
          if (error.code !== 'auth/no-redirect-result') {
            console.error('Error getting redirect result: ', error);
            toast({
                title: 'Authentication Failed',
                description: error.message,
                variant: 'destructive',
            });
          }
      });

    return () => unsubscribe();
  }, [router, toast]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the redirect.
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Error signing in with Google: ', error);
        toast({
          title: 'Authentication Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };
  
  if (loading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
             <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                    <Logo />
                    <h1>LLM Daily Digest</h1>
                </div>
                <div className="w-full rounded-lg border p-6 shadow-lg space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    )
  }

  // Don't render the sign-in page if we are about to redirect
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <Logo />
          <h1>LLM Daily Digest</h1>
        </div>
        <div className="w-full rounded-lg border p-6 shadow-lg">
          <h2 className="mb-4 text-center text-xl font-semibold">Admin Sign In</h2>
          <Button onClick={handleSignIn} className="w-full">
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </div>
         <p className="text-center text-sm text-muted-foreground">
            Access the admin dashboard to manage your AI news feed.
        </p>
      </div>
    </div>
  );
}
