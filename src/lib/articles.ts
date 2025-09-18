import type { SummarizeArticleOutput } from '@/ai/flows/summarize-articles';
import { getArticles as getArticlesFromDb } from '@/lib/firebase/service';

export type Article = SummarizeArticleOutput & { id: string; title: string; createdAt: string; };

export const getArticles = async (): Promise<Article[]> => {
    // This now fetches from our Firestore database.
    return await getArticlesFromDb(20); // Fetch the latest 20 articles
};

export const getArticleById = async (id: string): Promise<Article | undefined> => {
    // In a real app, this would fetch from a database.
    // This part is not implemented yet, but we can add it later if needed.
    const articles = await getArticlesFromDb();
    return articles.find(article => article.id === id);
};
