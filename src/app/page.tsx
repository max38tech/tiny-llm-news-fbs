import { getArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/article-card';

export default async function Home() {
  const articles = await getArticles();

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
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
