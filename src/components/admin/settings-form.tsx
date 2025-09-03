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
import { runArticlePipeline, ArticlePipelineOutput } from '@/ai/flows/run-article-pipeline';
import { summarizeArticle } from '@/ai/flows/summarize-articles';
import { generateArticleImage } from '@/ai/flows/generate-article-image';
import { addArticle } from '@/lib/firebase/service';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, saveSettings } from '@/lib/firebase/service';


const settingsSchema = z.object({
  sources: z.string().min(10, 'Please provide at least one URL.'),
  frequency: z.string(),
  maxPosts: z.coerce.number().min(1, 'Must be at least 1.').max(10, 'Cannot exceed 10.'),
});

export type SettingsData = z.infer<typeof settingsSchema>;

type FoundArticle = ArticlePipelineOutput['foundArticles'][0];

const defaultSources = [
  'https://huggingface.co/papers',
  'https://www.reddit.com/r/LocalLLaMA/',
  'https://www.reddit.com/r/LocalLLM/',
].join('\n');

export function SettingsForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
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
      try {
        const settings = await getSettings();
        if (settings) {
          form.reset(settings);
        }
      } catch (error) {
          console.error("Failed to load settings:", error);
          toast({
              title: "Error",
              description: "Could not load settings from the database.",
              variant: "destructive",
          })
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [form, toast]);

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
  
  const processArticle = async (article: FoundArticle) => {
    try {
        setProcessingStatus(`Summarizing: ${article.title}`);
        const summaryOutput = await summarizeArticle({ articleUrl: article.link });

        let finalImage = summaryOutput.featuredImage;

        if (!finalImage) {
            setProcessingStatus(`Generating image for: ${article.title}`);
            const imageOutput = await generateArticleImage({ articleDescription: `${summaryOutput.title} - ${summaryOutput.summary}` });
            finalImage = imageOutput.imageUrl;
        }
        
        setProcessingStatus(`Saving: ${article.title}`);
        await addArticle({
          ...summaryOutput,
          featuredImage: finalImage,
        });

    } catch (error) {
        console.error(`Error processing article ${article.link}:`, error);
        // We can show a toast here if we want to notify about individual failures
    }
  };

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    setProcessingStatus('Finding articles...');
    toast({
      title: 'Starting AI Pipeline',
      description: 'Finding articles. This may take a moment...',
    });

    try {
      const sources = form.getValues('sources').split('\n');
      const sourceUrl = sources[0];

      if (!sourceUrl) {
        toast({
          title: 'Error',
          description: 'Please provide at least one source URL.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      const result = await runArticlePipeline({ sourceUrl });
      
      if (!result.foundArticles || result.foundArticles.length === 0) {
        toast({
          title: 'Pipeline Complete!',
          description: "The scraper couldn't find any new article links on the source page.",
          duration: 9000,
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: 'Articles Found!',
        description: `Now processing ${result.foundArticles.length} articles. This may take a few minutes.`,
      });

      let articlesAdded = 0;
      for (const article of result.foundArticles) {
        await processArticle(article);
        articlesAdded++;
      }
      
      setProcessingStatus('');
      toast({
        title: 'Pipeline Complete!',
        description: `${articlesAdded} new articles were added.`,
        duration: 9000,
      });

      if (articlesAdded > 0) {
        router.refresh();
      }

    } catch (error) {
      console.error('Pipeline failed:', error);
      toast({
        title: 'Pipeline Failed',
        description: (error as Error).message || 'Something went wrong while finding articles.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };


  const onServiceToggle = (action: 'pause') => {
    toast({
      title: `Service Paused`,
      description: `The AI scraping service has been paused.`,
    });
  };

  const buttonText = isProcessing ? processingStatus || 'Processing...' : 'Start / Run Now';

  return (
    <Form {...form}>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          {isLoading ? (
             <div className="space-y-8">
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
          ) : (
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
          )}
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
                            {buttonText}
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
    </Form>
  );
}
