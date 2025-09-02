'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth, provider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from '@/lib/firebase';
import { BotMessageSquare, Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, check if the user is already signed in.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/admin');
        return;
      }
      // If no user, then check for redirect result.
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            // This will trigger the onAuthStateChanged listener above
            // and redirect to /admin.
            toast({
                title: 'Signed In',
                description: 'Successfully authenticated.',
            });
          }
          setLoading(false); // Done checking, show the page.
        })
        .catch((error) => {
          console.error('Error getting redirect result: ', error);
          toast({
            title: 'Authentication Failed',
            description: error.message,
            variant: 'destructive',
          });
          setLoading(false);
        });
    });
    
    return () => unsubscribe();

  }, [router, toast]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
             <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                    <BotMessageSquare className="h-10 w-10 text-primary" />
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


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <BotMessageSquare className="h-10 w-10 text-primary" />
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
