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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateArticle } from '@/lib/firebase/service';

const editArticleSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    summary: z.string().min(10, 'Summary must be at least 10 characters.'),
});

type EditArticleData = z.infer<typeof editArticleSchema>;

export function PostsTable({ articles: initialArticles }: { articles: Article[] }) {
  const { toast } = useToast();
  const [articles, setArticles] = useState(initialArticles);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const form = useForm<EditArticleData>({
    resolver: zodResolver(editArticleSchema),
  });

  const handleDelete = (articleId: string) => {
    // In a real app, this would be an API call
    setArticles(articles.filter(a => a.id !== articleId));
    toast({
      title: 'Post Deleted',
      description: 'The article has been removed successfully.',
    });
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
                <TableCell className="hidden md:table-cell">{(new Date()).toLocaleDateString()}</TableCell>
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
