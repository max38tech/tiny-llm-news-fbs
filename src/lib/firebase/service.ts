import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { Article } from '@/lib/articles';

const ARTICLES_COLLECTION = 'articles';

// Type for the data we send to Firestore (omitting the id)
type ArticleData = Omit<Article, 'id'>;

export const addArticle = async (article: ArticleData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
      ...article,
      createdAt: new Date(), // Add a timestamp
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw new Error('Failed to add article to the database');
  }
};

export const getArticles = async (count: number = 10): Promise<Article[]> => {
    try {
        const articlesCollection = collection(db, ARTICLES_COLLECTION);
        const q = query(articlesCollection, orderBy('createdAt', 'desc'), limit(count));
        const querySnapshot = await getDocs(q);
        
        const articles: Article[] = [];
        querySnapshot.forEach((doc) => {
            articles.push({ id: doc.id, ...doc.data() } as Article);
        });

        return articles;
    } catch (e) {
        console.error("Error getting documents: ", e);
        return []; // Return empty array on error
    }
};
