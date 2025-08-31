# **App Name**: LLM Daily Digest

## Core Features:

- Article Scraping & Filtering: AI-powered tool to scrape news articles and blog posts from specified URLs (e.g., https://huggingface.co/papers, https://www.reddit.com/r/LocalLLaMA/, https://www.reddit.com/r/LocalLLM/) and Google Searches, focusing on content relevant to running small LLMs on limited resources.
- Article Summarization: AI-driven tool to summarize scraped articles, extracting key information and insights related to small LLMs. The output includes the original article link for reference.
- Image Generation or Selection: The AI tool will, if available, use a featured image from the original article, otherwise generate a relevant AI image based on the article's content.
- Article Display: Display the summarized articles on the main page, including the title, summary, featured image, and a link to the original article.
- Admin Configuration: Admin page for managing URL sources, scraping frequency (e.g., 4 times daily), maximum posts per scrape, and pausing/restarting the AI service. The AI will only select up to three articles per posting run.
- Post Management: Admin page for editing and deleting any generated post to ensure content quality and relevance.

## Style Guidelines:

- Primary color: Saturated purple (#9C27B0) to reflect AI and innovation.
- Background color: Very dark gray (#1E1E1E) for a modern, readable design in a dark color scheme.
- Accent color: Bright fuchsia (#E91E63) for highlighting key elements and calls to action.
- Body and headline font: 'Inter', a sans-serif, will be used for both body text and headlines, providing a clean and modern reading experience.
- Use simple, line-based icons to represent different categories and actions.
- A clean, card-based layout will present summarized articles clearly.  The most recent articles appear first.
- Subtle animations to highlight updates as new information comes in. Asynchronously load new articles to provide a fast experience