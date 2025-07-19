// Minimal server created 

import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Enhanced recipe scraping endpoint
app.get('/api/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(html);
    
    // Enhanced recipe extraction - try multiple selectors for different sites
    const recipe = {
      title: '',
      ingredients: [],
      instructions: [],
      prepTime: '',
      cookTime: '',
      servings: '',
      image: ''
    };

    // Title extraction
    recipe.title = $('h1.recipe-title, h1[class*="title"], .recipe-header h1, h1').first().text().trim() || 'Recipe Title Not Found';

    // Ingredients extraction
    $('.ingredients li, .ingredient-item, [class*="ingredient"], .recipe-ingredients li').each((i, el) => {
      const ingredient = $(el).text().trim();
      if (ingredient) recipe.ingredients.push(ingredient);
    });

    // Instructions extraction
    $('.instructions li, .recipe-steps li, [class*="instruction"], .recipe-directions li').each((i, el) => {
      const instruction = $(el).text().trim();
      if (instruction) recipe.instructions.push(instruction);
    });

    // Time and servings extraction
    recipe.prepTime = $('[class*="prep"], [class*="preparation"]').text().trim() || '';
    recipe.cookTime = $('[class*="cook"], [class*="cooking"]').text().trim() || '';
    recipe.servings = $('[class*="serving"], [class*="yield"]').text().trim() || '';

    // Image extraction
    recipe.image = $('.recipe-image img, .recipe-header img, [class*="recipe"] img').first().attr('src') || '';

    res.json(recipe);
  } catch (err) {
    console.error('Scraping error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Search recipes endpoint
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  try {
    // This would typically integrate with a recipe API like Spoonacular or Edamam
    // For now, we'll return a mock response
    res.json({
      recipes: [
        {
          id: 1,
          title: `Search results for: ${query}`,
          image: 'https://via.placeholder.com/300x200',
          source: 'Example Recipe Site'
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/hello', (req, res) => {
    res.json({ msg: 'Hello from Express! Recipe scraper is running.' })
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
