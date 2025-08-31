'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { auth, provider, signInWithRedirect, getRedirectResult } from '@/lib/firebase';
import { BotMessageSquare, Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          router.push('/admin');
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result: ', error);
        toast({
          title: 'Authentication Failed',
          description: error.message,
          variant: 'destructive',
        });
      });
  }, [router, toast]);

  const handleSignIn = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

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
