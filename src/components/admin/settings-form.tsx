
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
import { addArticle, addPipelineRunLog } from '@/lib/firebase/service';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, saveSettings } from '@/lib/firebase/service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


const settingsSchema = z.object({
  sources: z.string().min(10, 'Please provide at least one URL.'),
  articleTopic: z.string().min(5, 'Please provide a topic for the AI to focus on.'),
  frequencyValue: z.coerce.number().min(1, 'Must be at least 1.'),
  frequencyUnit: z.enum(['minutes', 'hours']),
  maxPosts: z.coerce.number().min(1, 'Must be at least 1.').max(10, 'Cannot exceed 10.'),
});

export type SettingsData = z.infer<typeof settingsSchema>;

const defaultSources = [
  'https://huggingface.co/papers',
].join('\n');

export function SettingsForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      sources: defaultSources,
      articleTopic: 'running small LLMs on limited resources',
      frequencyValue: 4,
      frequencyUnit: 'hours',
      maxPosts: 3,
    },
  });
  
  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [processingLog]);

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

  const addLogMessage = (message: string) => {
    setProcessingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

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
    setProcessingLog([]);
    addLogMessage('Starting AI Pipeline...');

    let totalArticlesAdded = 0;
    const logForDb: string[] = [];
    const addDbLog = (msg: string) => {
        addLogMessage(msg);
        logForDb.push(msg);
    }

    try {
      const { sources, maxPosts, articleTopic } = form.getValues();
      const sourceUrls = sources.split('\n').filter(s => s.trim() !== '');
      
      if (sourceUrls.length === 0) {
        addDbLog('ERROR: No source URLs provided.');
        toast({
          title: 'Error',
          description: 'Please provide at least one source URL.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      for (const sourceUrl of sourceUrls) {
        if (totalArticlesAdded >= maxPosts) {
            addDbLog(`Maximum post limit (${maxPosts}) reached. Stopping pipeline.`);
            break;
        }

        try {
            addDbLog(`Searching for articles in: ${sourceUrl}`);
            const result = await runArticlePipeline({ sourceUrl, articleTopic });
            
            if (result.message.startsWith('ERROR')) {
                addDbLog(`ERROR processing ${sourceUrl}: ${result.message.replace('ERROR: ', '')}`);
                continue;
            }

            if (!result.processedArticles || result.processedArticles.length === 0) {
              addDbLog(result.message || `No new articles processed from ${sourceUrl}.`);
              continue; // Try next source
            }
            
            addDbLog(`Found and processed ${result.processedArticles.length} articles from ${sourceUrl}.`);
            
            for (const article of result.processedArticles) {
                if (totalArticlesAdded >= maxPosts) break;
                try {
                    addDbLog(`Saving to database: ${article.title}`);
                    await addArticle({
                      ...article,
                      featuredImage: article.featuredImage || '',
                    });
                    addDbLog(`Successfully saved: ${article.title}`);
                    totalArticlesAdded++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    addDbLog(`ERROR saving article "${article.title}": ${errorMessage}`);
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addDbLog(`ERROR processing source ${sourceUrl}: ${errorMessage}`);
            continue; // Continue to the next source even if one fails
        }
      }
      
      addDbLog(`Pipeline complete. Added ${totalArticlesAdded} new articles.`);
      toast({
        title: 'Pipeline Complete!',
        description: `${totalArticlesAdded} new articles were processed. Check the log for details.`,
        duration: 9000,
      });

      if (totalArticlesAdded > 0) {
        addDbLog('Refreshing page data...');
        router.refresh();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDbLog(`PIPELINE FAILED: ${errorMessage}`);
      toast({
        title: 'Pipeline Failed',
        description: 'An unexpected error occurred. Check the log for details.',
        variant: 'destructive',
      });
    } finally {
      addLogMessage('Process finished.');
      logForDb.push('Process finished.');
      const status = logForDb.some(l => l.includes('ERROR')) ? (totalArticlesAdded > 0 ? 'Partial Success' : 'Failure') : 'Success';
      await addPipelineRunLog({ log: logForDb, articlesAdded: totalArticlesAdded, status });
      setIsProcessing(false);
      router.refresh(); // Refresh to show new logs
    }
  };


  const onServiceToggle = (action: 'pause') => {
    toast({
      title: `Service Paused`,
      description: `The AI scraping service has been paused.`,
    });
  };

  const buttonText = isProcessing ? 'Processing...' : 'Start / Run Now';

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
                        <div className="space-y-2">
                            <FormLabel>Article Topic</FormLabel>
                            <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                             <div className="space-y-2">
                                <FormLabel>Scraping Frequency</FormLabel>
                                <div className="flex gap-2">
                                    <div className="h-10 w-1/2 animate-pulse rounded-md bg-muted"></div>
                                    <div className="h-10 w-1/2 animate-pulse rounded-md bg-muted"></div>
                                </div>
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
                                The AI will scrape these URLs for relevant articles. The pipeline will try each URL in order.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="articleTopic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Article Topic</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., running small LLMs on limited resources" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The AI will focus on this topic when summarizing articles.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-6 sm:grid-cols-2">
                         <div className="space-y-2">
                            <FormLabel>Scraping Frequency</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name="frequencyValue"
                                    render={({ field }) => (
                                        <FormItem className="w-1/2">
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="frequencyUnit"
                                    render={({ field }) => (
                                        <FormItem className="w-1/2">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="minutes">Minutes</SelectItem>
                                                    <SelectItem value="hours">Hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <FormDescription className="mt-2">
                                How often to automatically check for new articles.
                            </FormDescription>
                         </div>

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

            {processingLog.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Pipeline Log</CardTitle>
                        <CardDescription>Real-time log of the AI pipeline process.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-64 w-full">
                            <div ref={logContainerRef} className="p-4 bg-muted/50 rounded-lg text-xs font-mono space-y-1">
                                {processingLog.map((log, index) => (
                                    <p key={index} className={cn(
                                        {'text-destructive': log.includes('ERROR') || log.includes('FAILED')}
                                    )}>{log}</p>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                 </Card>
            )}
        </div>
      </div>
    </Form>
  );
}
