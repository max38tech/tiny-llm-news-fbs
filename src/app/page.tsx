
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import type { Article } from '@/lib/articles';
import { getArticles } from '@/lib/firebase/service';
import { ArticleCard } from '@/components/article-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams, useRouter } from 'next/navigation';

const ARTICLES_PER_PAGE = 9;

function HomeContent() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());

  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get('q') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const articles = await getArticles(); 
        setAllArticles(articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    const storedReadArticles = localStorage.getItem('readArticles');
    if (storedReadArticles) {
      setReadArticles(new Set(JSON.parse(storedReadArticles)));
    }
  }, []);

  const handleMarkAsRead = (articleId: string) => {
    const newReadArticles = new Set(readArticles);
    newReadArticles.add(articleId);
    setReadArticles(newReadArticles);
    localStorage.setItem('readArticles', JSON.stringify(Array.from(newReadArticles)));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', e.target.value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`);
  };

  const filteredArticles = useMemo(() => {
    return allArticles
      .filter(article => !readArticles.has(article.id))
      .filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allArticles, readArticles, searchQuery]);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  
  if (isLoading) {
    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        ))}
        </div>
    );
  }

  return (
    <>
      <div className="mb-8 max-w-md">
        <Input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {paginatedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} onMarkAsRead={handleMarkAsRead} />
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
            <h2 className="text-2xl font-semibold">No Articles Found</h2>
            <p>Try adjusting your search or check back later.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}


function LoadingSkeleton() {
    return (
        <div>
            <div className="mb-8 max-w-md">
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-4 rounded-lg border p-6">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                     <Skeleton className="h-5 w-24" />
                </div>
            ))}
            </div>
        </div>
    )
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
              Latest News
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              AI-curated digest on running small Language Models on local machines.
            </p>
          </header>
          <Suspense fallback={<LoadingSkeleton />}>
            <HomeContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
