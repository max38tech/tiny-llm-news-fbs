'use client';

import Link from 'next/link';
import type { Article } from '@/lib/articles';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowUpRight, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type ArticleCardProps = {
  article: Article;
  onMarkAsRead: (articleId: string) => void;
};

export function ArticleCard({ article, onMarkAsRead }: ArticleCardProps) {
  const preview = article.summary.split(' ').slice(0, 30).join(' ');

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the dialog from opening
    onMarkAsRead(article.id);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer hover:-translate-y-1 group relative">
           <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={handleHideClick}
              aria-label="Mark as read"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle>{article.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                {preview}...
              </p>
            </CardContent>
          <CardFooter>
            <span className="text-sm text-muted-foreground">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{article.title}</DialogTitle>
          <DialogDescription asChild>
              <ScrollArea className="max-h-[60vh] pr-4">
                  <p className="py-4 text-foreground/90">{article.summary}</p>
              </ScrollArea>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
             <Button asChild variant="link" className="pl-0">
                <Link href={article.originalArticleUrl} target="_blank" rel="noopener noreferrer">
                    Read Original Article
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}