import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { searchRecipes } from './services/searchService.js';
import { scrapeRecipeFromUrl } from './services/scrapeService.js';

const app = express();
app.use(express.json());
app.use(cors());

const cache = new Map();

function cacheKey(prefix, args) {
  return prefix + JSON.stringify(args);
}

// simple in-memory caching
function getCached(prefix, args) {
  const key = cacheKey(prefix, args);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < config.cache.duration) {
    return entry.data;
  }
  return null;
}

function setCached(prefix, args, data) {
  cache.set(cacheKey(prefix, args), { ts: Date.now(), data });
}

app.get('/api/hello', (req, res) => {
  res.json({ status: 'ok', message: 'Recipe scraper ready' });
});

app.get('/api/search', async (req, res) => {
  const { query, limit = 5 } = req.query;
  console.log(`[API] /api/search called with query='${query}', limit=${limit}`);
  if (!query) {
    console.log('[API] Missing search query');
    return res.status(400).json({ error: 'Missing search query' });
  }

  const cached = getCached('search', { query, limit });
  if (cached) {
    console.log('[API] Returning cached search result');
    return res.json(cached);
  }

  try {
    const recipes = await searchRecipes(query, parseInt(limit));
    const data = { recipes, total: recipes.length, query };
    setCached('search', { query, limit }, data);
    console.log(`[API] Returning ${recipes.length} recipes for query='${query}'`);
    res.json(data);
  } catch (err) {
    console.error('[API] Search failed:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

app.get('/api/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const cached = getCached('scrape', { url });
  if (cached) return res.json(cached);

  try {
    const recipe = await scrapeRecipeFromUrl(url);
    setCached('scrape', { url }, recipe);
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(4000, () => {
  console.log('Backend running on http://localhost:4000');
});
