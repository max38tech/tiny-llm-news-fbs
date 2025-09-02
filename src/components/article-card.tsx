import Image from 'next/image';
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
} from '@/components/ui/dialog';
import { ArrowUpRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const preview = article.summary.split(' ').slice(0, 25).join(' ');

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
      <CardHeader>
        {article.featuredImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
            <Image
              src={article.featuredImage}
              alt={article.title || 'Article image'}
              data-ai-hint="tech llm"
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardTitle className="pt-4">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">
          {preview}...
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="pl-1 text-accent">
                more...
              </Button>
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
            </DialogContent>
          </Dialog>
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" className="pl-0">
          <Link href={article.originalArticleUrl} target="_blank" rel="noopener noreferrer">
            Read Original Article
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
