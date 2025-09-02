import type { SummarizeArticleOutput } from '@/ai/flows/summarize-articles';

export type Article = SummarizeArticleOutput & { id: string; title: string };

export const getArticles = async (): Promise<Article[]> => {
    // In a real app, this would fetch from a database.
    // For now, we return an empty array as the AI pipeline is not yet connected to a DB.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([]);
        }, 500);
    });
};

export const getArticleById = async (id: string): Promise<Article | undefined> => {
    // In a real app, this would fetch from a database.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, 300);
    });
}
