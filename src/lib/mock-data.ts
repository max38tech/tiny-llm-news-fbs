import type { SummarizeArticleOutput } from '@/ai/flows/summarize-articles';

export type Article = SummarizeArticleOutput & { id: string; title: string };

const articlesData: Omit<Article, 'id'>[] = [
  {
    title: 'Breakthrough Makes LLMs 20x Faster on Consumer GPUs',
    summary: 'A groundbreaking new technique named "Flash-Decoding" has been developed, enabling Large Language Models (LLMs) to perform inference tasks up to 20 times faster on standard consumer-grade GPUs. This optimization method works by significantly improving how memory is used during the decoding process, which is often a major bottleneck. By reducing memory access latency and increasing parallelism, Flash-Decoding allows for much more efficient computation. The implications of this are vast, as it could dramatically lower the hardware barrier for running powerful AI models. This accessibility would empower a wider range of developers, researchers, and hobbyists to innovate and experiment with state-of-the-art AI without requiring expensive, enterprise-level hardware. The technique could accelerate the adoption of complex AI in everyday applications, from on-device assistants to more responsive and intelligent creative tools. It represents a significant step towards democratizing access to high-performance artificial intelligence.',
    originalArticleUrl: 'https://huggingface.co/papers/2311.12999',
    featuredImage: 'https://picsum.photos/seed/llm1/600/400',
  },
  {
    title: 'Microsoft Phi-2: Small Model, Giant Performance',
    summary: 'Microsoft has introduced Phi-2, a compact 2.7 billion-parameter language model that is delivering performance comparable to models up to 25 times its size. This remarkable efficiency is attributed to its high-quality training data, which includes a carefully curated mix of synthetic and web-based sources focused on "common sense" reasoning and general knowledge. Phi-2 excels particularly in complex reasoning tasks, such as question answering and coding, outperforming many larger models in benchmark tests. Its small footprint means it can run effectively on local machines, including laptops and even some mobile devices. This capability is a game-changer for on-device AI, opening the door for more sophisticated and private applications that do not need to rely on cloud servers. Phi-2\'s success challenges the "bigger is always better" paradigm in AI, highlighting the critical importance of data quality and training methodology in creating powerful yet efficient models.',
    originalArticleUrl: 'https://www.reddit.com/r/LocalLLaMA/comments/18h4s1b/microsoft_phi2_the_surprising_reason_it_rivals/',
    featuredImage: 'https://picsum.photos/seed/llm2/600/400',
  },
  {
    title: 'Ollama Update Simplifies Running Local LLMs',
    summary: 'The latest release of Ollama, a popular tool for running LLMs locally, has introduced significant improvements that streamline the entire user experience. This update features a simplified model management system, allowing users to download, switch between, and manage various open-source models like Llama 2, Mistral, and Phi-2 with single commands. Performance has also been enhanced, with faster model loading times and more efficient resource utilization on both Mac and PC. One of the key additions is a unified API endpoint, making it easier for developers to integrate local LLMs into their own applications without complex configurations. The goal of the project is to make experimenting with powerful language models as easy as running a single line in the terminal. This focus on simplicity and accessibility is lowering the barrier to entry for many developers and AI enthusiasts looking to explore the capabilities of local LLMs on their personal computers.',
    originalArticleUrl: 'https://www.reddit.com/r/LocalLLM/comments/18gnsdf/ollama_v0119_is_out_now/',
    featuredImage: 'https://picsum.photos/seed/llm3/600/400',
  },
  {
    title: 'Fine-Tuning Mistral 7B on a Single Consumer GPU',
    summary: 'A new, comprehensive guide details the process of fine-tuning the powerful Mistral 7B model on a single consumer-grade GPU with 24GB of VRAM. This has traditionally been a task requiring significant computational resources, often beyond the reach of individual developers. The guide leverages several memory-saving techniques, most notably QLoRA (Quantized Low-Rank Adaptation), which drastically reduces the memory footprint of the model during training. By quantizing the model to 4-bit precision and only training a small set of adapter weights, the process becomes manageable on hardware like an NVIDIA 3090 or 4090. The tutorial walks through every step, from setting up the environment and preparing the dataset to launching the training script and evaluating the results. This approach enables the creation of highly customized AI models for specific tasks or domains, democratizing the ability to build upon foundational models without needing access to a massive server farm, and fostering innovation in the open-source community.',
    originalArticleUrl: 'https://huggingface.co/papers/2310.06747',
    featuredImage: 'https://picsum.photos/seed/llm4/600/400',
  },
  {
    title: 'Merge Multiple LLMs into One with "mergekit"',
    summary: 'The innovative "mergekit" library is gaining traction among AI developers for its ability to merge multiple pre-trained language models into a single, more powerful model. This technique, whimsically dubbed "model frankensteining," allows developers to combine the specialized strengths of different architectures. For instance, a model proficient in coding can be merged with another that excels at creative writing to produce a hybrid model with both capabilities. The library provides several merging methods, such as linear and spherical interpolation (SLERP), which average the weights of the parent models in different ways. Early results are promising, with many merged models demonstrating superior performance on a variety of benchmarks compared to their individual parent models. This approach represents a new and exciting frontier in model development, enabling the creation of highly customized and capable models without the prohibitive cost of training a new one from scratch, fostering a culture of experimentation.',
    originalArticleUrl: 'https://www.reddit.com/r/LocalLLaMA/comments/18f3v3p/merging_models_with_mergekit_a_practical_guide/',
    featuredImage: 'https://picsum.photos/seed/llm5/600/400',
  },
  {
    title: 'Scaling LLMs by Making Them Deeper, Not Wider',
    summary: 'Challenging conventional wisdom, a recent study has shown that making language models deeper (adding more layers) can be a more efficient scaling strategy than making them wider (increasing the number of parameters per layer). This "depth-up-scaling" (DUS) method was tested on the TinyLlama model, a compact 1.1B parameter model. By applying DUS, the researchers were able to significantly improve the model\'s performance on reasoning and language understanding tasks with only a modest increase in the total parameter count. The core idea is that additional layers allow for more sequential processing and the development of more complex hierarchical representations of language, which is particularly beneficial for reasoning. This finding could have a significant impact on the future of model architecture, suggesting a path towards building more capable and efficient models. It provides a valuable blueprint for how to best allocate a given parameter budget to maximize performance, especially for smaller models designed to run on resource-constrained devices.',
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
