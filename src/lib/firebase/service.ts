import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Article } from '@/lib/articles';
import type { SettingsData } from '@/components/admin/settings-form';

const ARTICLES_COLLECTION = 'articles';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'appSettings';

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
            const data = doc.data();
            const articleData = {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to a serializable format (ISO string)
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Article;
            articles.push(articleData);
        });

        return articles;
    } catch (e) {
        console.error("Error getting documents: ", e);
        return []; // Return empty array on error
    }
};

export const updateArticle = async (id: string, data: { title: string; summary: string }): Promise<void> => {
    try {
        const articleDocRef = doc(db, ARTICLES_COLLECTION, id);
        await updateDoc(articleDocRef, data);
    } catch (e) {
        console.error('Error updating document: ', e);
        throw new Error('Failed to update article in the database');
    }
}

export const saveSettings = async (settings: SettingsData): Promise<void> => {
    try {
        const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(settingsDocRef, settings, { merge: true });
    } catch (e) {
        console.error('Error saving settings: ', e);
        throw new Error('Failed to save settings to the database');
    }
}

export const getSettings = async (): Promise<SettingsData | null> => {
    try {
        const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as SettingsData;
        }
        return null;
    } catch (e) {
        console.error('Error fetching settings: ', e);
        return null;
    }
}
