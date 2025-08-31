import type { SummarizeArticleOutput } from '@/ai/flows/summarize-articles';

export type Article = SummarizeArticleOutput & { id: string; title: string };

const articlesData: Omit<Article, 'id'>[] = [
  {
    title: 'Breakthrough Makes LLMs 20x Faster on Consumer GPUs',
    summary: 'A new technique called "Flash-Decoding" allows large language models to run up to 20 times faster on simple GPUs by optimizing memory usage. This breakthrough could make powerful AI more accessible to developers and researchers with limited hardware.',
    originalArticleUrl: 'https://huggingface.co/papers/2311.12999',
    featuredImage: 'https://picsum.photos/seed/llm1/600/400',
  },
  {
    title: 'Microsoft Phi-2: Small Model, Giant Performance',
    summary: 'Microsoft\'s new Phi-2, a 2.7 billion-parameter model, is showing remarkable performance that rivals models up to 25 times larger. It excels at reasoning tasks and is small enough to run on local machines, paving the way for more powerful on-device AI applications.',
    originalArticleUrl: 'https://www.reddit.com/r/LocalLLaMA/comments/18h4s1b/microsoft_phi2_the_surprising_reason_it_rivals/',
    featuredImage: 'https://picsum.photos/seed/llm2/600/400',
  },
  {
    title: 'Ollama Update Simplifies Running Local LLMs',
    summary: 'The latest version of Ollama introduces a more streamlined process for running various open-source models like Llama 2 and Mistral locally. This update simplifies model management and improves performance, making it easier than ever to experiment with LLMs on your own computer.',
    originalArticleUrl: 'https://www.reddit.com/r/LocalLLM/comments/18gnsdf/ollama_v0119_is_out_now/',
    featuredImage: 'https://picsum.photos/seed/llm3/600/400',
  },
  {
    title: 'Fine-Tuning Mistral 7B on a Single Consumer GPU',
    summary: 'A comprehensive guide explains how to fine-tune the Mistral 7B model on a single 24GB VRAM GPU. The process involves using QLoRA and other memory-saving techniques to achieve impressive results, enabling customized AI models without needing a massive server farm.',
    originalArticleUrl: 'https://huggingface.co/papers/2310.06747',
    featuredImage: 'https://picsum.photos/seed/llm4/600/400',
  },
  {
    title: 'Merge Multiple LLMs into One with "mergekit"',
    summary: 'The "mergekit" library allows developers to merge multiple pre-trained language models into a single, more capable model. This technique, known as "model frankensteining," can lead to superior performance by combining the strengths of different architectures.',
    originalArticleUrl: 'https://www.reddit.com/r/LocalLLaMA/comments/18f3v3p/merging_models_with_mergekit_a_practical_guide/',
    featuredImage: 'https://picsum.photos/seed/llm5/600/400',
  },
  {
    title: 'Scaling LLMs by Making Them Deeper, Not Wider',
    summary: 'A new "depth-up-scaling" method proves that making a model deeper, rather than wider, can significantly improve performance without a proportional increase in parameters. This was demonstrated on the TinyLlama model, suggesting a new direction for efficient model scaling.',
    originalArticleUrl: 'https://huggingface.co/papers/2401.02559',
    featuredImage: 'https://picsum.photos/seed/llm6/600/400',
  }
];

export const articles: Article[] = articlesData.map((article, index) => ({
    ...article,
    id: (index + 1).toString(),
}));


export const getArticles = async (): Promise<Article[]> => {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(articles);
        }, 500);
    });
};

export const getArticleById = async (id: string): Promise<Article | undefined> => {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(articles.find(article => article.id === id));
        }, 300);
    });
}
