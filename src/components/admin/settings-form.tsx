'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Loader2 } from 'lucide-react';
import { runArticlePipeline } from '@/ai/flows/run-article-pipeline';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, saveSettings } from '@/lib/firebase/service';


const settingsSchema = z.object({
  sources: z.string().min(10, 'Please provide at least one URL.'),
  frequency: z.string(),
  maxPosts: z.coerce.number().min(1, 'Must be at least 1.').max(10, 'Cannot exceed 10.'),
});

export type SettingsData = z.infer<typeof settingsSchema>;

const defaultSources = [
  'https://huggingface.co/papers',
  'https://www.reddit.com/r/LocalLLaMA/',
  'https://www.reddit.com/r/LocalLLM/',
].join('\n');

export function SettingsForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      sources: defaultSources,
      frequency: '4',
      maxPosts: 3,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const settings = await getSettings();
      if (settings) {
        form.reset(settings);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, [form]);

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    try {
        await saveSettings(data);
        toast({
          title: 'Settings Saved!',
          description: 'Your new settings have been applied.',
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
        toast({
            title: 'Error',
            description: 'Failed to save settings.',
            variant: 'destructive',
        });
    }
  };
  
  const handleRunPipeline = async () => {
    setIsProcessing(true);
    toast({
      title: 'Starting AI Pipeline',
      description: 'Finding and processing articles. This may take a moment...',
    });

    try {
      // For now, we'll just run the pipeline on the first source URL.
      // A full implementation would run this on a schedule for all sources.
      const sources = form.getValues('sources').split('\n');
      const sourceUrl = sources[0];

      if (!sourceUrl) {
        toast({
          title: 'Error',
          description: 'Please provide at least one source URL.',
          variant: 'destructive',
        });
        return;
      }

      const result = await runArticlePipeline({ sourceUrl });
      
      toast({
        title: 'Pipeline Complete!',
        description: `${result.articlesAdded} new articles were added.`,
      });

      // Refresh the page to see the new posts
      router.refresh();

    } catch (error) {
      console.error('Pipeline failed:', error);
      toast({
        title: 'Pipeline Failed',
        description: 'Something went wrong while processing articles.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };


  const onServiceToggle = (action: 'pause') => {
    toast({
      title: `Service Paused`,
      description: `The AI scraping service has been paused.`,
    });
  };

  if (isLoading) {
    return (
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Content Scraping</CardTitle>
                        <CardDescription>Configure where and how the AI finds content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <FormLabel>URL Sources</FormLabel>
                            <div className="h-[9.5rem] w-full animate-pulse rounded-md bg-muted"></div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <FormLabel>Scraping Frequency</FormLabel>
                                <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Max Posts per Run</FormLabel>
                                <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="h-10 w-28 animate-pulse rounded-md bg-muted"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Content Scraping</CardTitle>
                        <CardDescription>Configure where and how the AI finds content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                        control={form.control}
                        name="sources"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>URL Sources</FormLabel>
                            <FormControl>
                                <Textarea rows={5} placeholder="Enter one URL per line" {...field} />
                            </FormControl>
                            <FormDescription>
                                The AI will scrape these URLs for relevant articles.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Scraping Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">Once daily</SelectItem>
                                    <SelectItem value="2">Twice daily</SelectItem>
                                    <SelectItem value="4">4 times daily</SelectItem>
                                    <SelectItem value="8">8 times daily</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormDescription>How often to check for new articles.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="maxPosts"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Posts per Run</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Max articles to post each time the service runs.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                    </CardContent>
                </Card>
                
                <Button type="submit">Save Settings</Button>
            </form>
            </Form>
      </div>
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>AI Service Control</CardTitle>
                <CardDescription>Manage the status of the automated AI service.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
                 <p className="text-sm text-muted-foreground">
                    Use these controls to manually run, pause, or resume the automatic fetching and posting of articles.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleRunPipeline} disabled={isProcessing}>
                        {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="mr-2 h-4 w-4" />
                        )}
                        {isProcessing ? 'Processing...' : 'Start / Run Now'}
                    </Button>
                    <Button variant="destructive" onClick={() => onServiceToggle('pause')}>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
