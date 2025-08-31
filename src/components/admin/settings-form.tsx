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
import { Play, Pause } from 'lucide-react';

const settingsSchema = z.object({
  sources: z.string().min(10, 'Please provide at least one URL.'),
  frequency: z.string(),
  maxPosts: z.coerce.number().min(1, 'Must be at least 1.').max(10, 'Cannot exceed 10.'),
});

const defaultSources = [
  'https://huggingface.co/papers',
  'https://www.reddit.com/r/LocalLLaMA/',
  'https://www.reddit.com/r/LocalLLM/',
].join('\n');

export function SettingsForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      sources: defaultSources,
      frequency: '4',
      maxPosts: 3,
    },
  });

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    toast({
      title: 'Settings Saved!',
      description: 'Your new settings have been applied.',
    });
    console.log(data);
  }
  
  const onServiceToggle = (action: 'start' | 'pause') => {
    toast({
      title: `Service ${action === 'start' ? 'Started' : 'Paused'}`,
      description: `The AI scraping service has been ${action === 'start' ? 'restarted' : 'paused'}.`,
    });
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
                                    </Trigger>
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
                    Use these controls to pause or resume the automatic fetching and posting of articles.
                </p>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => onServiceToggle('start')}>
                        <Play className="mr-2 h-4 w-4" />
                        Start / Resume
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
