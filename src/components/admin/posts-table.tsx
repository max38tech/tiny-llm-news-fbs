'use client';

import type { Article } from '@/lib/articles';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateArticle, getArticles as getArticlesFromDb, deleteArticle } from '@/lib/firebase/service';
import { Skeleton } from '../ui/skeleton';

const editArticleSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    summary: z.string().min(10, 'Summary must be at least 10 characters.'),
});

type EditArticleData = z.infer<typeof editArticleSchema>;

export function PostsTable() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const form = useForm<EditArticleData>({
    resolver: zodResolver(editArticleSchema),
  });

  useEffect(() => {
    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const fetchedArticles = await getArticlesFromDb();
            setArticles(fetchedArticles);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
            toast({
                title: "Error",
                description: "Could not load articles from the database.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchArticles();
  }, [toast]);

  const handleDelete = async (articleId: string) => {
    try {
        await deleteArticle(articleId);
        setArticles(articles.filter(a => a.id !== articleId));
        toast({
          title: 'Post Deleted',
          description: 'The article has been removed successfully.',
        });
    } catch (error) {
        toast({
            title: 'Delete Failed',
            description: 'Could not delete the article from the database.',
            variant: 'destructive',
        });
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    form.reset({
        title: article.title,
        summary: article.summary,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdate = async (data: EditArticleData) => {
    if (!editingArticle) return;

    try {
        await updateArticle(editingArticle.id, data);
        setArticles(articles.map(a => a.id === editingArticle.id ? { ...a, ...data } : a));
        toast({
            title: 'Post Updated',
            description: 'The article has been saved successfully.',
        });
        setIsEditDialogOpen(false);
    } catch (error) {
        toast({
            title: 'Update Failed',
            description: 'Could not save the changes to the database.',
            variant: 'destructive',
        });
    }
  }

  if (isLoading) {
    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-20 inline-block" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium max-w-sm truncate">{article.title}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(article)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the post.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(article.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
                Make changes to the article summary and title.
            </DialogDescription>
          </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Summary</FormLabel>
                                <FormControl>
                                    <Textarea rows={10} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
