// Minimal server created 

import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Simple in-memory cache for search results
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Cache cleanup function
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
};

// Cleanup cache every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

// Rate limiting cleanup
const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
};

// Cleanup rate limits every 2 minutes
setInterval(cleanupRateLimits, 2 * 60 * 1000);

// Middleware for rate limiting
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const userData = requestCounts.get(ip);
    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      userData.count++;
    }
    
    if (userData.count > RATE_LIMIT) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a minute.' 
      });
    }
  }
  
  next();
};

// Enhanced recipe scraping endpoint with better fallback handling
app.get('/api/scrape', rateLimit, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    console.log(`Attempting to scrape: ${url}`);
    
    // Check if this is a known API URL that we can't scrape
    const knownApiUrls = [
      'themealdb.com',
      'edamam.com',
      'spoonacular.com'
    ];
    
    const isApiUrl = knownApiUrls.some(domain => url.includes(domain));
    
    if (isApiUrl) {
      console.log('Detected API URL, providing enhanced recipe data');
      // For API URLs, return enhanced recipe data instead of scraping
      const enhancedRecipe = await getEnhancedRecipeData(url);
      if (enhancedRecipe) {
        return res.json(enhancedRecipe);
      }
    }

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
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

    // Title extraction - try multiple selectors
    const titleSelectors = [
      'h1.recipe-title', 
      'h1[class*="title"]', 
      '.recipe-header h1', 
      'h1',
      '.recipe-name',
      '.entry-title',
      '.post-title',
      '[itemprop="name"]',
      '.recipe-title',
      '.recipe-name'
    ];
    
    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 3) {
        recipe.title = title.replace(/\s+/g, ' ');
        break;
      }
    }
    
    if (!recipe.title) recipe.title = 'Recipe Title Not Found';

    // Ingredients extraction - try multiple selectors
    const ingredientSelectors = [
      '.ingredients li', 
      '.ingredient-item', 
      '[class*="ingredient"]', 
      '.recipe-ingredients li',
      '.wprm-recipe-ingredient',
      '.recipe-ingredient',
      'li[class*="ingredient"]',
      '.recipe-ingredients .ingredient',
      '.ingredients .ingredient',
      '[itemprop="recipeIngredient"]',
      '.ingredient-list li',
      '.ingredients-list li'
    ];
    
    for (const selector of ingredientSelectors) {
      $(selector).each((i, el) => {
        const ingredient = $(el).text().trim();
        // Filter out ingredients that are too long (likely not real ingredients)
        if (ingredient && ingredient.length > 2 && ingredient.length < 200) {
          const cleanIngredient = ingredient.replace(/\s+/g, ' ').replace(/Ad\(.*?\)/g, '').trim();
          if (cleanIngredient && !cleanIngredient.includes('Ad(') && !cleanIngredient.includes('Nutrition')) {
            recipe.ingredients.push(cleanIngredient);
          }
        }
      });
      if (recipe.ingredients.length > 0) break;
    }

    // Instructions extraction - try multiple selectors
    const instructionSelectors = [
      '.instructions li', 
      '.recipe-steps li', 
      '[class*="instruction"]', 
      '.recipe-directions li',
      '.wprm-recipe-instruction',
      '.recipe-instruction',
      'li[class*="step"]',
      '.method li',
      '.recipe-method li',
      '.directions li',
      '[itemprop="recipeInstructions"]',
      '.instruction-list li',
      '.instructions-list li'
    ];
    
    for (const selector of instructionSelectors) {
      $(selector).each((i, el) => {
        const instruction = $(el).text().trim();
        // Filter out instructions that are too short or too long
        if (instruction && instruction.length > 10 && instruction.length < 500) {
          const cleanInstruction = instruction.replace(/\s+/g, ' ').replace(/Ad\(.*?\)/g, '').trim();
          if (cleanInstruction && !cleanInstruction.includes('Ad(') && !cleanInstruction.includes('Nutrition')) {
            recipe.instructions.push(cleanInstruction);
          }
        }
      });
      if (recipe.instructions.length > 0) break;
    }

    // Time and servings extraction
    const prepTime = $('[class*="prep"], [class*="preparation"], .prep-time, [itemprop="prepTime"]').text().trim();
    const cookTime = $('[class*="cook"], [class*="cooking"], .cook-time, [itemprop="cookTime"]').text().trim();
    const servings = $('[class*="serving"], [class*="yield"], .servings, [itemprop="recipeYield"]').text().trim();
    
    recipe.prepTime = prepTime ? prepTime.replace(/\s+/g, ' ').substring(0, 50) : '';
    recipe.cookTime = cookTime ? cookTime.replace(/\s+/g, ' ').substring(0, 50) : '';
    recipe.servings = servings ? servings.replace(/\s+/g, ' ').substring(0, 50) : '';
    
    // Clean up ingredients and instructions - remove duplicates and filter out unwanted content
    recipe.ingredients = [...new Set(recipe.ingredients)].filter(ingredient => 
      ingredient && 
      ingredient.length > 2 && 
      ingredient.length < 200 &&
      !ingredient.includes('Ingredients') &&
      !ingredient.includes('Nutrition') &&
      !ingredient.includes('Ad(') &&
      !ingredient.includes('Cups') &&
      !ingredient.includes('Metric')
    );
    
    recipe.instructions = [...new Set(recipe.instructions)].filter(instruction => 
      instruction && 
      instruction.length > 10 && 
      instruction.length < 500 &&
      !instruction.includes('Instructions') &&
      !instruction.includes('Nutrition') &&
      !instruction.includes('Ad(') &&
      !instruction.includes('Ingredients')
    );

    // Image extraction - try multiple selectors
    const imageSelectors = [
      '.recipe-image img', 
      '.recipe-header img', 
      '[class*="recipe"] img',
      '.entry-image img',
      '.post-image img',
      '.featured-image img',
      'img[class*="recipe"]',
      '[itemprop="image"] img',
      '.recipe-photo img'
    ];
    
    for (const selector of imageSelectors) {
      const img = $(selector).first();
      if (img.length > 0) {
        const src = img.attr('src') || img.attr('data-src');
        if (src) {
          recipe.image = src.startsWith('http') ? src : `https:${src}`;
          break;
        }
      }
    }

    // If we couldn't extract meaningful data, provide fallback
    if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
      console.log('No recipe data extracted, providing fallback data');
      const fallbackRecipe = getFallbackRecipeData(url, recipe.title);
      return res.json(fallbackRecipe);
    }

    res.json(recipe);
  } catch (err) {
    console.error('Scraping error:', err.message);
    // Provide fallback data when scraping fails
    const fallbackRecipe = getFallbackRecipeData(url, 'Recipe');
    res.json(fallbackRecipe);
  }
});

// Enhanced search recipes endpoint with multiple sources and fallback
app.get('/api/search', rateLimit, async (req, res) => {
  const { query, limit = 5 } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  // Check cache first
  const cacheKey = `${query}-${limit}`;
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
    console.log(`Returning cached results for: ${query}`);
    return res.json(cachedResult.data);
  }

  try {
    console.log(`Searching for: ${query} (limit: ${limit})`);
    
    // Try multiple sources (APIs + web scraping)
    let searchResults = [];
    let isFallback = false;
    
    try {
      searchResults = await searchWebForRecipes(query, parseInt(limit));
      console.log(`Found ${searchResults.length} results from multiple sources`);
    } catch (error) {
      console.log('Multi-source search failed:', error.message);
      isFallback = true;
    }
    
    // If no results from APIs/web scraping, use fallback data
    if (searchResults.length === 0) {
      searchResults = getFallbackRecipes(query).slice(0, parseInt(limit));
      isFallback = true;
      console.log(`Using ${searchResults.length} fallback recipes for: ${query}`);
    }
    
    // Check if there are more results available
    const hasMore = parseInt(limit) < 10 && searchResults.length >= parseInt(limit);
    
    const responseData = {
      recipes: searchResults,
      query: query,
      total: searchResults.length,
      hasMore: hasMore,
      isFallback: isFallback,
      message: isFallback ? 
        `Couldn't find live recipes for "${query}". Here are some curated suggestions:` : 
        `Found ${searchResults.length} recipes from multiple sources for "${query}"`
    };

    // Cache the results
    searchCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (err) {
    console.error('Search error:', err.message);
    // Even if everything fails, return fallback data
    const fallbackResults = getFallbackRecipes(query).slice(0, parseInt(limit));
    res.json({
      recipes: fallbackResults,
      query: query,
      total: fallbackResults.length,
      hasMore: false,
      isFallback: true,
      message: `Couldn't find live recipes for "${query}". Here are some curated suggestions:`
    });
  }
});

// TODO: Future enhancement - LLM integration for better content analysis
// This could be implemented using OpenAI API, Anthropic Claude, or local models like Ollama

/*
// Example LLM integration for content validation
async function validateContentWithLLM(title, content, query) {
  try {
    const prompt = `
    Analyze if this content is a legitimate recipe:
    
    Title: "${title}"
    Content preview: "${content.substring(0, 200)}..."
    Search query: "${query}"
    
    Respond with JSON:
    {
      "isRecipe": boolean,
      "confidence": number (0-1),
      "reason": string
    }
    `;
    
    // This would call your preferred LLM API
    const response = await callLLM(prompt);
    const analysis = JSON.parse(response);
    
    return analysis.isRecipe && analysis.confidence > 0.7;
  } catch (error) {
    console.error('LLM validation error:', error);
    return true; // Fallback to allow content through
  }
}

// Example function to extract recipe information using LLMs
async function extractRecipeInfoWithLLM(html, query) {
  try {
    const prompt = `
    Extract recipe information from this HTML content:
    
    Query: "${query}"
    HTML: "${html.substring(0, 1000)}..."
    
    Return JSON with:
    {
      "title": string,
      "ingredients": [string],
      "instructions": [string],
      "prepTime": string,
      "cookTime": string,
      "servings": string,
      "image": string,
      "confidence": number
    }
    `;
    
    const response = await callLLM(prompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('LLM extraction error:', error);
    return null;
  }
}
*/

// Enhanced fallback recipe database
function getFallbackRecipes(query) {
  const queryLower = query.toLowerCase();
  
  const recipeDatabase = {
    // Pasta recipes
    pasta: [
      {
        id: 'pasta-1',
        title: 'Creamy Garlic Pasta',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
        source: 'Italian Kitchen',
        rating: '4.6/5',
        time: '20 mins',
        url: 'https://example.com/pasta1'
      },
      {
        id: 'pasta-2',
        title: 'Spicy Arrabbiata Pasta',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
        source: 'Roman Delights',
        rating: '4.4/5',
        time: '25 mins',
        url: 'https://example.com/pasta2'
      },
      {
        id: 'pasta-3',
        title: 'Pesto Linguine',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop',
        source: 'Genovese Kitchen',
        rating: '4.7/5',
        time: '15 mins',
        url: 'https://example.com/pasta3'
      },
      {
        id: 'pasta-4',
        title: 'Carbonara Pasta',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        source: 'Roman Classics',
        rating: '4.8/5',
        time: '18 mins',
        url: 'https://example.com/pasta4'
      }
    ],
    
    // Chicken recipes
    chicken: [
      {
        id: 'chicken-1',
        title: 'Classic Chicken Fried Rice',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        source: 'Chef\'s Kitchen',
        rating: '4.5/5',
        time: '25 mins',
        url: 'https://example.com/chicken1'
      },
      {
        id: 'chicken-2',
        title: 'Spicy Thai Chicken Rice',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop',
        source: 'Thai Delights',
        rating: '4.8/5',
        time: '35 mins',
        url: 'https://example.com/chicken2'
      },
      {
        id: 'chicken-3',
        title: 'One-Pot Chicken and Rice',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        source: 'Quick Meals',
        rating: '4.3/5',
        time: '20 mins',
        url: 'https://example.com/chicken3'
      },
      {
        id: 'chicken-4',
        title: 'Hainanese Chicken Rice',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        source: 'Asian Classics',
        rating: '4.9/5',
        time: '45 mins',
        url: 'https://example.com/chicken4'
      }
    ],
    
    // Rice recipes
    rice: [
      {
        id: 'rice-1',
        title: 'Creamy Chicken Rice Casserole',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        source: 'Comfort Food',
        rating: '4.6/5',
        time: '45 mins',
        url: 'https://example.com/rice1'
      },
      {
        id: 'rice-2',
        title: 'Mexican Chicken Rice Bowl',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        source: 'Mexican Kitchen',
        rating: '4.4/5',
        time: '30 mins',
        url: 'https://example.com/rice2'
      },
      {
        id: 'rice-3',
        title: 'Jasmine Rice with Vegetables',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        source: 'Asian Fusion',
        rating: '4.2/5',
        time: '25 mins',
        url: 'https://example.com/rice3'
      },
      {
        id: 'rice-4',
        title: 'Spanish Paella Rice',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        source: 'Spanish Delights',
        rating: '4.7/5',
        time: '40 mins',
        url: 'https://example.com/rice4'
      }
    ],
    
    // Dessert recipes
    dessert: [
      {
        id: 'dessert-1',
        title: 'Chocolate Lava Cake',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
        source: 'Sweet Dreams',
        rating: '4.9/5',
        time: '30 mins',
        url: 'https://example.com/dessert1'
      },
      {
        id: 'dessert-2',
        title: 'Classic Tiramisu',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
        source: 'Italian Desserts',
        rating: '4.7/5',
        time: '45 mins',
        url: 'https://example.com/dessert2'
      },
      {
        id: 'dessert-3',
        title: 'Berry Cheesecake',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=300&fit=crop',
        source: 'Bakery Fresh',
        rating: '4.5/5',
        time: '60 mins',
        url: 'https://example.com/dessert3'
      },
      {
        id: 'dessert-4',
        title: 'Apple Pie',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        source: 'American Classics',
        rating: '4.6/5',
        time: '75 mins',
        url: 'https://example.com/dessert4'
      }
    ],
    
    // Asian recipes
    asian: [
      {
        id: 'asian-1',
        title: 'Pad Thai Noodles',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
        source: 'Thai Street Food',
        rating: '4.6/5',
        time: '25 mins',
        url: 'https://example.com/asian1'
      },
      {
        id: 'asian-2',
        title: 'Vietnamese Pho',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop',
        source: 'Pho House',
        rating: '4.8/5',
        time: '40 mins',
        url: 'https://example.com/asian2'
      },
      {
        id: 'asian-3',
        title: 'Korean Bibimbap',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        source: 'Korean Kitchen',
        rating: '4.4/5',
        time: '35 mins',
        url: 'https://example.com/asian3'
      },
      {
        id: 'asian-4',
        title: 'Japanese Ramen',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        source: 'Tokyo Delights',
        rating: '4.9/5',
        time: '50 mins',
        url: 'https://example.com/asian4'
      }
    ],
    
    // Mexican recipes
    mexican: [
      {
        id: 'mexican-1',
        title: 'Authentic Tacos',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        source: 'Taco Fiesta',
        rating: '4.7/5',
        time: '20 mins',
        url: 'https://example.com/mexican1'
      },
      {
        id: 'mexican-2',
        title: 'Chicken Enchiladas',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        source: 'Mexican Delights',
        rating: '4.5/5',
        time: '45 mins',
        url: 'https://example.com/mexican2'
      },
      {
        id: 'mexican-3',
        title: 'Guacamole & Chips',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        source: 'Fresh Mexican',
        rating: '4.3/5',
        time: '10 mins',
        url: 'https://example.com/mexican3'
      },
      {
        id: 'mexican-4',
        title: 'Churros with Chocolate',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
        source: 'Mexican Sweets',
        rating: '4.8/5',
        time: '25 mins',
        url: 'https://example.com/mexican4'
      }
    ],

    // Italian recipes
    italian: [
      {
        id: 'italian-1',
        title: 'Margherita Pizza',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        source: 'Pizza Palace',
        rating: '4.8/5',
        time: '30 mins',
        url: 'https://example.com/italian1'
      },
      {
        id: 'italian-2',
        title: 'Spaghetti Bolognese',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
        source: 'Italian Classics',
        rating: '4.6/5',
        time: '40 mins',
        url: 'https://example.com/italian2'
      },
      {
        id: 'italian-3',
        title: 'Risotto ai Funghi',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop',
        source: 'Milan Kitchen',
        rating: '4.5/5',
        time: '35 mins',
        url: 'https://example.com/italian3'
      }
    ],

    // Quick meals
    quick: [
      {
        id: 'quick-1',
        title: '5-Minute Breakfast Bowl',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        source: 'Quick Bites',
        rating: '4.2/5',
        time: '5 mins',
        url: 'https://example.com/quick1'
      },
      {
        id: 'quick-2',
        title: '15-Minute Stir Fry',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
        source: 'Fast Food',
        rating: '4.4/5',
        time: '15 mins',
        url: 'https://example.com/quick2'
      },
      {
        id: 'quick-3',
        title: '10-Minute Pasta',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
        source: 'Quick Italian',
        rating: '4.3/5',
        time: '10 mins',
        url: 'https://example.com/quick3'
      }
    ]
  };

  // Determine recipe category based on query
  let category = 'chicken'; // default
  
  if (queryLower.includes('pasta') || queryLower.includes('noodle') || queryLower.includes('spaghetti')) {
    category = 'pasta';
  } else if (queryLower.includes('rice')) {
    category = 'rice';
  } else if (queryLower.includes('dessert') || queryLower.includes('cake') || queryLower.includes('sweet') || queryLower.includes('pie')) {
    category = 'dessert';
  } else if (queryLower.includes('asian') || queryLower.includes('thai') || queryLower.includes('vietnamese') || queryLower.includes('korean') || queryLower.includes('pho') || queryLower.includes('laksa') || queryLower.includes('japanese')) {
    category = 'asian';
  } else if (queryLower.includes('mexican') || queryLower.includes('taco') || queryLower.includes('enchilada') || queryLower.includes('churro')) {
    category = 'mexican';
  } else if (queryLower.includes('italian') || queryLower.includes('pizza') || queryLower.includes('risotto')) {
    category = 'italian';
  } else if (queryLower.includes('quick') || queryLower.includes('fast') || queryLower.includes('easy') || queryLower.includes('simple')) {
    category = 'quick';
  } else if (queryLower.includes('chicken')) {
    category = 'chicken';
  }

  return recipeDatabase[category] || recipeDatabase.chicken;
}

// Helper function to get random recipe images based on query
function getRandomRecipeImage(query) {
  const queryLower = query.toLowerCase();
  const images = [
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop'
  ];
  
  // Return a random image
  return images[Math.floor(Math.random() * images.length)];
}

// Function to create dynamic recipes based on search query
function createDynamicRecipes(query) {
  const queryLower = query.toLowerCase();
  const recipes = [];
  
  // Create recipe titles based on the search query
  const recipeTemplates = [
    `Best ${query} Recipe`,
    `Easy ${query} at Home`,
    `Classic ${query} Preparation`,
    `Quick ${query} Guide`,
    `Traditional ${query} Method`,
    `Modern ${query} Twist`,
    `Simple ${query} for Beginners`,
    `Gourmet ${query} Experience`
  ];
  
  // Create 4-6 dynamic recipes
  const numRecipes = Math.min(6, recipeTemplates.length);
  
  for (let i = 0; i < numRecipes; i++) {
    recipes.push({
      id: `dynamic-${i + 1}`,
      title: recipeTemplates[i],
      image: getRandomRecipeImage(query),
      source: 'Web Search',
      rating: `${4.0 + Math.random() * 0.9}`.substring(0, 3) + '/5',
      time: `${15 + Math.floor(Math.random() * 45)} mins`,
      url: `https://example.com/recipe/${i + 1}`
    });
  }
  
  return recipes;
}

// Function to try alternative search strategies
async function tryAlternativeSearchStrategies(query) {
  const results = [];
  
  try {
    // Strategy 1: Try different search engines for more variety
    const searchEngines = [
      `https://www.bing.com/search?q=${encodeURIComponent(query + ' recipe')}`,
      `https://search.yahoo.com/search?p=${encodeURIComponent(query + ' recipe')}`,
      `https://duckduckgo.com/?q=${encodeURIComponent(query + ' recipe')}`
    ];
    
    for (const searchUrl of searchEngines) {
      try {
        const searchResults = await scrapeSearchEngineResults(searchUrl);
        for (const url of searchResults) {
          const recipes = await scrapeRecipeWebsite(url, query);
          results.push(...recipes);
        }
      } catch (error) {
        console.error(`Error with search engine ${searchUrl}:`, error.message);
      }
    }
    
    // Strategy 2: Try broader search terms
    const broaderTerms = [
      `${query} food`,
      `${query} dish`,
      `${query} meal`,
      `${query} cooking`
    ];
    
    for (const term of broaderTerms) {
      try {
        const broaderResults = await scrapeGoogleSearchResults(term);
        for (const url of broaderResults) {
          const recipes = await scrapeRecipeWebsite(url, query);
          results.push(...recipes);
        }
      } catch (error) {
        console.error(`Error with broader search "${term}":`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error in alternative search strategies:', error.message);
  }
  
  return results;
}

// Function to scrape search engine results
async function scrapeSearchEngineResults(searchUrl) {
  const urls = [];
  
  try {
    const { data: html } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 10000
    });

    const $ = cheerio.load(html);
    
    // Extract URLs from search results
    $('a[href^="http"]').each((i, element) => {
      const href = $(element).attr('href');
      if (href && !href.includes('bing.com') && !href.includes('yahoo.com') && !href.includes('youtube.com')) {
        const url = href.split('&')[0]; // Remove tracking parameters
        if (url && !urls.includes(url)) {
          urls.push(url);
        }
      }
    });
    
  } catch (error) {
    console.error('Error scraping search engine results:', error.message);
  }
  
  return urls.slice(0, 3); // Return top 3 results
}

// Function to remove duplicate recipes
function removeDuplicateRecipes(recipes) {
  const seen = new Set();
  const uniqueRecipes = [];
  
  for (const recipe of recipes) {
    // Create a unique key based on title and source
    const key = `${recipe.title.toLowerCase()}-${recipe.source}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRecipes.push(recipe);
    }
  }
  
  return uniqueRecipes;
}

// Function to search the web for recipes with multiple sources
async function searchWebForRecipes(query, limit = 5) {
  const results = [];
  
  try {
    console.log(`Searching for: ${query} (limit: ${limit})`);
    
    // Strategy 1: Try free APIs first (most reliable)
    const apiPromises = [
      searchMealDBRecipes(query, limit), // Completely free, no API key needed
      // searchEdamamRecipes(query, limit), // Uncomment when you have API keys
      // searchSpoonacularRecipes(query, limit) // Uncomment when you have API keys
    ];
    
    const apiResults = await Promise.allSettled(apiPromises);
    apiResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    });
    
    console.log(`Found ${results.length} results from APIs`);
    
    // Strategy 2: If we don't have enough results, try web scraping
    if (results.length < limit) {
      const remainingLimit = limit - results.length;
      const searchUrls = await searchGoogleForRecipes(query);
      console.log(`Found ${searchUrls.length} search results for web scraping`);
      
      // If we don't have enough recipe-specific URLs, skip web scraping
      if (searchUrls.length < 2) {
        console.log('Insufficient search results for web scraping');
        return results;
      }
      
      // Scrape recipes from found websites with timeout
      const scrapePromises = searchUrls.slice(0, remainingLimit).map(async (url) => {
        try {
          const websiteRecipes = await Promise.race([
            scrapeRecipeWebsite(url, query),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 8000)
            )
          ]);
          return websiteRecipes;
        } catch (error) {
          console.error(`Error scraping ${url}:`, error.message);
          return [];
        }
      });
      
      // Wait for all scraping to complete
      const allResults = await Promise.allSettled(scrapePromises);
      allResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(...result.value);
        }
      });
      
      console.log(`Found ${results.length} total results after web scraping`);
    }
    
    // Strategy 3: If still no results, try alternative search strategies
    if (results.length === 0) {
      console.log('No results from primary search, trying alternative strategies');
      const alternativeResults = await tryAlternativeSearchStrategies(query);
      results.push(...alternativeResults);
    }

    // Strategy 4: If still no results, return empty array to trigger fallback
    if (results.length === 0) {
      console.log('No web scraping results found, will use fallback data');
      return [];
    }

  } catch (error) {
    console.error('Web search error:', error.message);
    return []; // Return empty to trigger fallback
  }

  // Remove duplicates and return results
  const uniqueResults = removeDuplicateRecipes(results);
  return uniqueResults.slice(0, limit);
}

// Function to search Google for recipe-related content
async function searchGoogleForRecipes(query) {
  const urls = [];
  
  try {
    // Strategy 1: Direct Google search scraping (primary method)
    const googleResults = await scrapeGoogleSearchResults(query);
    urls.push(...googleResults);
    
    // Strategy 2: DuckDuckGo API as backup
    const searchTerms = [
      `${query} recipe`,
      `${query} cooking instructions`,
      `${query} how to make`,
      `${query} ingredients method`
    ];
    
    for (const searchTerm of searchTerms) {
      try {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}&format=json&no_html=1&skip_disambig=1`;
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          timeout: 8000
        });

        // Extract URLs from results
        if (response.data.RelatedTopics) {
          response.data.RelatedTopics.forEach(topic => {
            if (topic.FirstURL && !urls.includes(topic.FirstURL)) {
              urls.push(topic.FirstURL);
            }
          });
        }
        
        if (response.data.AbstractURL && !urls.includes(response.data.AbstractURL)) {
          urls.push(response.data.AbstractURL);
        }
        
      } catch (error) {
        console.error(`Error searching for "${searchTerm}":`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error in Google search:', error.message);
  }
  
  return [...new Set(urls)].slice(0, 15); // Remove duplicates and limit to 15
}

// Function to scrape Google search results directly
async function scrapeGoogleSearchResults(query) {
  const urls = [];
  
  try {
    // Try multiple search variations to get more results
    const searchVariations = [
      `${query} recipe`,
      `${query} cooking instructions`,
      `${query} how to make`,
      `${query} ingredients method`,
      `${query} food recipe`
    ];
    
    // Recipe-specific domains to prioritize
    const recipeDomains = [
      'allrecipes.com', 'foodnetwork.com', 'epicurious.com', 'bonappetit.com',
      'seriouseats.com', 'thekitchn.com', 'simplyrecipes.com', 'tasteofhome.com',
      'food.com', 'cookinglight.com', 'eatingwell.com', 'delish.com',
      'goodhousekeeping.com', 'womansday.com', 'countryliving.com',
      'bbcgoodfood.com', 'jamieoliver.com', 'gordonramsay.com',
      'pioneerwoman.com', 'smittenkitchen.com', 'pinchofyum.com',
      'minimalistbaker.com', '101cookbooks.com', 'loveandlemons.com'
    ];
    
    // Non-recipe domains to exclude
    const excludeDomains = [
      'stackoverflow.com', 'github.com', 'tiktok.com', 'instagram.com',
      'facebook.com', 'twitter.com', 'youtube.com', 'reddit.com',
      'pinterest.com', 'linkedin.com', 'medium.com', 'dev.to',
      'wikipedia.org', 'quora.com', 'yahoo.com', 'bing.com',
      'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com'
    ];
    
    for (const searchTerm of searchVariations) {
      try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}&num=10`;
        
        const { data: html } = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.google.com/'
          },
          timeout: 10000
        });

        const $ = cheerio.load(html);
        
        // Extract URLs from Google search results - try multiple selectors
        const selectors = [
          'a[href^="http"]',
          '.yuRUbf a',
          '.rc a',
          '.g a',
          '[data-ved] a',
          '.tF2Cxc a',
          '.LC20lb a'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, element) => {
            const href = $(element).attr('href');
            if (href && href.startsWith('http')) {
              const url = href.split('&')[0]; // Remove Google tracking parameters
              const domain = new URL(url).hostname.replace('www.', '');
              
              // Skip excluded domains
              if (excludeDomains.some(exclude => domain.includes(exclude))) {
                return;
              }
              
              // Prioritize recipe domains
              const isRecipeDomain = recipeDomains.some(recipe => domain.includes(recipe));
              
              if (url && !urls.includes(url)) {
                // Add recipe domains to the beginning of the array
                if (isRecipeDomain) {
                  urls.unshift(url);
                } else {
                  urls.push(url);
                }
              }
            }
          });
        }
        
        // Also try to extract from search result snippets
        $('.g, .rc, .yuRUbf, .tF2Cxc').each((i, element) => {
          const $el = $(element);
          const link = $el.find('a').attr('href');
          if (link && link.startsWith('http')) {
            const url = link.split('&')[0];
            const domain = new URL(url).hostname.replace('www.', '');
            
            // Skip excluded domains
            if (excludeDomains.some(exclude => domain.includes(exclude))) {
              return;
            }
            
            if (url && !urls.includes(url)) {
              urls.push(url);
            }
          }
        });
        
        // If we found some URLs, break early to avoid rate limiting
        if (urls.length >= 8) break;
        
      } catch (error) {
        console.error(`Error scraping Google search for "${searchTerm}":`, error.message);
        // Continue with next search term
      }
    }
    
  } catch (error) {
    console.error('Error scraping Google search results:', error.message);
  }
  
  return urls.slice(0, 8); // Return top 8 results
}

// Function to validate and clean recipe content
function validateRecipeContent(title, source, url) {
  // Skip non-recipe sites
  const nonRecipeDomains = [
    'stackoverflow.com', 'github.com', 'tiktok.com', 'instagram.com', 
    'facebook.com', 'twitter.com', 'youtube.com', 'reddit.com',
    'pinterest.com', 'linkedin.com', 'medium.com', 'dev.to',
    'wikipedia.org', 'quora.com', 'yahoo.com', 'bing.com'
  ];
  
  const domain = new URL(url).hostname.replace('www.', '');
  if (nonRecipeDomains.some(site => domain.includes(site))) {
    return false;
  }
  
  // Skip navigation and non-content elements
  const navigationKeywords = [
    'menu', 'navigation', 'header', 'footer', 'sidebar', 'advertisement',
    'subscribe', 'newsletter', 'sign up', 'login', 'register', 'search',
    'about us', 'contact', 'privacy', 'terms', 'cookie', 'sitemap'
  ];
  
  const titleLower = title.toLowerCase();
  if (navigationKeywords.some(keyword => titleLower.includes(keyword))) {
    return false;
  }
  
  // Validate title quality
  if (title.length < 5 || title.length > 200) return false;
  if (title.includes('Error') || title.includes('404') || title.includes('Not Found')) return false;
  
  // Check for recipe-related keywords
  const recipeKeywords = [
    'recipe', 'cook', 'food', 'dish', 'meal', 'ingredients', 'instructions',
    'preparation', 'cooking', 'baking', 'how to make', 'how to cook',
    'directions', 'method', 'steps', 'servings', 'prep time', 'cook time'
  ];
  
  const hasRecipeKeywords = recipeKeywords.some(keyword => titleLower.includes(keyword));
  
  // For non-recipe keywords, require at least 2 recipe-related words
  if (!hasRecipeKeywords) {
    const foodKeywords = [
      'chicken', 'beef', 'pork', 'fish', 'pasta', 'rice', 'bread', 'cake',
      'soup', 'salad', 'sauce', 'dressing', 'dessert', 'breakfast', 'lunch',
      'dinner', 'appetizer', 'main course', 'side dish', 'vegetarian', 'vegan'
    ];
    
    const foodMatches = foodKeywords.filter(keyword => titleLower.includes(keyword));
    if (foodMatches.length < 2) return false;
  }
  
  return true;
}

// Enhanced content cleaning and normalization
function cleanTextContent(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n\t]/g, ' ') // Remove line breaks and tabs
    .replace(/[^\w\s\-.,!?()]/g, '') // Remove special characters except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim()
    .substring(0, 200); // Limit length
}

// Function to clean and normalize recipe titles
function cleanRecipeTitle(title) {
  if (!title) return '';
  
  return title
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\w\s\-.,!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

// Function to clean and normalize ingredients
function cleanIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  
  return ingredients
    .map(ingredient => {
      if (!ingredient) return null;
      
      const cleaned = ingredient
        .replace(/\s+/g, ' ')
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[^\w\s\-.,!?()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Filter out ingredients that are too short or too long
      if (cleaned.length < 3 || cleaned.length > 150) return null;
      
      // Filter out common non-ingredient text
      const nonIngredientKeywords = [
        'ingredients', 'nutrition', 'advertisement', 'ad(', 'nutrition facts',
        'serving size', 'calories', 'total fat', 'sodium', 'protein'
      ];
      
      if (nonIngredientKeywords.some(keyword => cleaned.toLowerCase().includes(keyword))) {
        return null;
      }
      
      return cleaned;
    })
    .filter(Boolean) // Remove null values
    .filter((ingredient, index, array) => array.indexOf(ingredient) === index); // Remove duplicates
}

// Function to clean and normalize instructions
function cleanInstructions(instructions) {
  if (!Array.isArray(instructions)) return [];
  
  return instructions
    .map(instruction => {
      if (!instruction) return null;
      
      const cleaned = instruction
        .replace(/\s+/g, ' ')
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[^\w\s\-.,!?()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Filter out instructions that are too short or too long
      if (cleaned.length < 10 || cleaned.length > 500) return null;
      
      // Filter out common non-instruction text
      const nonInstructionKeywords = [
        'instructions', 'directions', 'method', 'steps', 'nutrition',
        'advertisement', 'ad(', 'nutrition facts', 'serving suggestions'
      ];
      
      if (nonInstructionKeywords.some(keyword => cleaned.toLowerCase().includes(keyword))) {
        return null;
      }
      
      return cleaned;
    })
    .filter(Boolean) // Remove null values
    .filter((instruction, index, array) => array.indexOf(instruction) === index); // Remove duplicates
}

// Function to extract and clean time information
function extractTimeInfo(text) {
  if (!text) return '';
  
  const timePatterns = [
    /(\d+)\s*(?:min|minute|minutes)/i,
    /(\d+)\s*(?:hr|hour|hours)/i,
    /(\d+)\s*(?:sec|second|seconds)/i,
    /prep.*?(\d+)/i,
    /cook.*?(\d+)/i,
    /total.*?(\d+)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      const time = parseInt(match[1]);
      if (time > 0 && time < 1000) {
        return `${time} mins`;
      }
    }
  }
  
  return '30 mins'; // Default fallback
}

// Function to extract and clean rating information
function extractRatingInfo(text) {
  if (!text) return '4.5/5';
  
  const ratingPatterns = [
    /(\d+(?:\.\d+)?)\s*\/\s*5/i,
    /(\d+(?:\.\d+)?)\s*out\s*of\s*5/i,
    /(\d+(?:\.\d+)?)\s*stars/i,
    /rating.*?(\d+(?:\.\d+)?)/i
  ];
  
  for (const pattern of ratingPatterns) {
    const match = text.match(pattern);
    if (match) {
      const rating = parseFloat(match[1]);
      if (rating >= 0 && rating <= 5) {
        return `${rating.toFixed(1)}/5`;
      }
    }
  }
  
  return '4.5/5'; // Default fallback
}

// Function to scrape a recipe website with improved filtering and structured data
async function scrapeRecipeWebsite(url, query) {
  const recipes = [];
  
  try {
    console.log(`Scraping: ${url}`);
    
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 12000,
      maxRedirects: 5
    });

    const $ = cheerio.load(html);
    
    // Remove script, style, nav, header, footer elements to reduce noise
    $('script, style, nav, header, footer, .nav, .navigation, .header, .footer, .sidebar, .ad, .advertisement, .comments, .social-share').remove();
    
    // First, try to extract structured data (JSON-LD, microdata)
    const structuredData = extractStructuredData($);
    if (structuredData.length > 0) {
      console.log('Found structured data, using it for recipe extraction');
      return structuredData.map((data, index) => ({
        id: `structured-${url}-${index}`,
        title: data.name || data.title || 'Recipe',
        image: data.image || data.thumbnail || '',
        source: new URL(url).hostname.replace('www.', ''),
        rating: data.aggregateRating?.ratingValue ? `${data.aggregateRating.ratingValue}/5` : '4.5/5',
        time: data.totalTime || data.cookTime || '30 mins',
        url: url,
        ingredients: data.recipeIngredient || [],
        instructions: data.recipeInstructions || [],
        servings: data.recipeYield || '',
        prepTime: data.prepTime || '',
        cookTime: data.cookTime || ''
      }));
    }
    
    // Improved selectors with better specificity and validation
    const selectors = [
      // Recipe-specific sites (highest priority)
      {
        container: '.recipe, .recipe-card, .recipe-item, .recipe-post, [class*="recipe"]:not([class*="recipe-nav"]):not([class*="recipe-menu"])',
        title: '.recipe-title, .recipe-name, .recipe-heading, h1.recipe, h2.recipe, [itemprop="name"]',
        image: '.recipe-image img, .recipe-photo img, .recipe-thumbnail img, [itemprop="image"]',
        link: '.recipe-title a, .recipe-name a, .recipe-link',
        rating: '.recipe-rating, .rating, .stars, .score, [itemprop="ratingValue"]',
        time: '.recipe-time, .cook-time, .prep-time, .total-time, [itemprop="totalTime"]'
      },
      // Food blog selectors with better validation
      {
        container: '.post.recipe, .entry.recipe, .article.recipe, .content.recipe, [class*="post"]:has([class*="recipe"])',
        title: '.entry-title:contains("recipe"), .post-title:contains("recipe"), .article-title:contains("recipe"), h1:contains("recipe")',
        image: '.post-thumbnail img, .entry-image img, .featured-image img',
        link: '.entry-title a, .post-title a, .read-more',
        rating: '.rating, .stars, .score',
        time: '.cook-time, .prep-time, .duration'
      },
      // Generic content with strict recipe validation
      {
        container: '.content:has(h1:contains("recipe")), .main:has(h1:contains("recipe")), .container:has([class*="recipe"])',
        title: 'h1:contains("recipe"), h2:contains("recipe"), [class*="title"]:contains("recipe")',
        image: 'img[src*="food"], img[src*="dish"], img[src*="meal"]',
        link: 'a[href*="recipe"], a[href*="food"]',
        rating: '[class*="rating"], [class*="star"]',
        time: '[class*="time"], [class*="duration"]'
      }
    ];

    // Try each selector set
    for (const selectorSet of selectors) {
      const foundRecipes = [];
      
      $(selectorSet.container).each((i, element) => {
        if (i >= 2) return; // Limit to 2 results per selector set
        
        const $el = $(element);
        const title = $el.find(selectorSet.title).text().trim();
        const image = $el.find(selectorSet.image).attr('src') || $el.find(selectorSet.image).attr('data-src') || '';
        const link = $el.find(selectorSet.link).attr('href') || '';
        const rating = $el.find(selectorSet.rating).text().trim();
        const time = $el.find(selectorSet.time).text().trim();

        if (title && title.length > 5) {
          const cleanTitle = cleanTextContent(title);
          
          // Enhanced recipe content validation
          if (validateRecipeContentEnhanced(cleanTitle, new URL(url).hostname, url, $el)) {
            // Clean up rating and time data
            const cleanRating = rating ? cleanTextContent(rating).substring(0, 30) : '4.5/5';
            const cleanTime = time ? cleanTextContent(time).substring(0, 30) : '30 mins';
            
            // Validate and clean image URL
            let cleanImage = image;
            if (image && !image.startsWith('http')) {
              cleanImage = image.startsWith('//') ? `https:${image}` : `${new URL(url).origin}${image}`;
            }
            
            // Validate and clean link URL
            let cleanLink = link;
            if (link && !link.startsWith('http')) {
              cleanLink = link.startsWith('/') ? `${new URL(url).origin}${link}` : `${new URL(url).origin}/${link}`;
            }
            
            foundRecipes.push({
              id: `recipe-${url}-${i}`,
              title: cleanTitle,
              image: cleanImage,
              source: new URL(url).hostname.replace('www.', ''),
              rating: cleanRating,
              time: cleanTime,
              url: cleanLink || url
            });
          }
        }
      });
      
      if (foundRecipes.length > 0) {
        recipes.push(...foundRecipes);
        break; // Use the first successful selector set
      }
    }
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
  }
  
  return recipes;
}

// Function to extract structured data (JSON-LD, microdata)
function extractStructuredData($) {
  const recipes = [];
  
  // Extract JSON-LD structured data
  $('script[type="application/ld+json"]').each((i, element) => {
    try {
      const jsonData = JSON.parse($(element).html());
      if (jsonData['@type'] === 'Recipe' || (Array.isArray(jsonData) && jsonData.some(item => item['@type'] === 'Recipe'))) {
        const recipeData = Array.isArray(jsonData) ? jsonData.find(item => item['@type'] === 'Recipe') : jsonData;
        if (recipeData) {
          recipes.push(recipeData);
        }
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }
  });
  
  // Extract microdata
  $('[itemtype*="Recipe"]').each((i, element) => {
    const $recipe = $(element);
    const recipe = {
      name: $recipe.find('[itemprop="name"]').text().trim(),
      image: $recipe.find('[itemprop="image"]').attr('src') || $recipe.find('[itemprop="image"]').attr('content'),
      recipeIngredient: [],
      recipeInstructions: [],
      totalTime: $recipe.find('[itemprop="totalTime"]').text().trim(),
      prepTime: $recipe.find('[itemprop="prepTime"]').text().trim(),
      cookTime: $recipe.find('[itemprop="cookTime"]').text().trim(),
      recipeYield: $recipe.find('[itemprop="recipeYield"]').text().trim()
    };
    
    $recipe.find('[itemprop="recipeIngredient"]').each((j, ing) => {
      recipe.recipeIngredient.push($(ing).text().trim());
    });
    
    $recipe.find('[itemprop="recipeInstructions"]').each((j, inst) => {
      recipe.recipeInstructions.push($(inst).text().trim());
    });
    
    if (recipe.name) {
      recipes.push(recipe);
    }
  });
  
  return recipes;
}

// Enhanced recipe content validation
function validateRecipeContentEnhanced(title, source, url, $element) {
  // Skip non-recipe sites
  const nonRecipeDomains = [
    'stackoverflow.com', 'github.com', 'tiktok.com', 'instagram.com', 
    'facebook.com', 'twitter.com', 'youtube.com', 'reddit.com',
    'pinterest.com', 'linkedin.com', 'medium.com', 'dev.to',
    'wikipedia.org', 'quora.com', 'yahoo.com', 'bing.com'
  ];
  
  const domain = new URL(url).hostname.replace('www.', '');
  if (nonRecipeDomains.some(site => domain.includes(site))) {
    return false;
  }
  
  // Skip navigation and non-content elements
  const navigationKeywords = [
    'menu', 'navigation', 'header', 'footer', 'sidebar', 'advertisement',
    'subscribe', 'newsletter', 'sign up', 'login', 'register', 'search',
    'about us', 'contact', 'privacy', 'terms', 'cookie', 'sitemap',
    'related', 'popular', 'trending', 'featured', 'recommended'
  ];
  
  const titleLower = title.toLowerCase();
  if (navigationKeywords.some(keyword => titleLower.includes(keyword))) {
    return false;
  }
  
  // Validate title quality
  if (title.length < 5 || title.length > 200) return false;
  if (title.includes('Error') || title.includes('404') || title.includes('Not Found')) return false;
  
  // Check for recipe-related keywords with scoring
  const recipeKeywords = [
    'recipe', 'cook', 'food', 'dish', 'meal', 'ingredients', 'instructions',
    'preparation', 'cooking', 'baking', 'how to make', 'how to cook',
    'directions', 'method', 'steps', 'servings', 'prep time', 'cook time',
    'kitchen', 'chef', 'cuisine', 'kitchen', 'homemade', 'from scratch'
  ];
  
  const foodKeywords = [
    'chicken', 'beef', 'pork', 'fish', 'pasta', 'rice', 'bread', 'cake',
    'soup', 'salad', 'sauce', 'dressing', 'dessert', 'breakfast', 'lunch',
    'dinner', 'appetizer', 'main course', 'side dish', 'vegetarian', 'vegan',
    'steak', 'shrimp', 'salmon', 'pizza', 'burger', 'sandwich', 'smoothie',
    'pancake', 'waffle', 'muffin', 'cookie', 'brownie', 'pie', 'ice cream'
  ];
  
  const recipeMatches = recipeKeywords.filter(keyword => titleLower.includes(keyword));
  const foodMatches = foodKeywords.filter(keyword => titleLower.includes(keyword));
  
  // Scoring system: recipe keywords worth more than food keywords
  const score = (recipeMatches.length * 2) + foodMatches.length;
  
  // Require minimum score of 2 for validation
  if (score < 2) return false;
  
  // Additional validation: check if element contains recipe-like content
  const elementText = $element.text().toLowerCase();
  const hasIngredients = elementText.includes('ingredient') || elementText.includes('tablespoon') || elementText.includes('teaspoon');
  const hasInstructions = elementText.includes('step') || elementText.includes('preheat') || elementText.includes('mix') || elementText.includes('add');
  
  // Bonus points for recipe-like content
  if (hasIngredients || hasInstructions) {
    return true;
  }
  
  // Final validation: require at least 3 points total
  return score >= 3;
}

// Free Recipe APIs integration
const EDAMAM_APP_ID = 'your_app_id'; // Free tier available
const EDAMAM_APP_KEY = 'your_app_key'; // Free tier available
const MEALDB_API_KEY = '1'; // Free API key

// Function to search recipes using Edamam API (free tier)
async function searchEdamamRecipes(query, limit = 5) {
  try {
    const response = await axios.get(`https://api.edamam.com/api/recipes/v2`, {
      params: {
        type: 'public',
        q: query,
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        from: 0,
        to: limit
      },
      timeout: 10000
    });

    if (response.data && response.data.hits) {
      return response.data.hits.map(hit => ({
        id: hit.recipe.uri.split('#recipe_')[1],
        title: hit.recipe.label,
        image: hit.recipe.image,
        source: 'Edamam',
        rating: `${(hit.recipe.yield || 1).toFixed(1)} servings`,
        time: `${Math.round(hit.recipe.totalTime || 30)} mins`,
        url: hit.recipe.url,
        ingredients: hit.recipe.ingredientLines,
        calories: Math.round(hit.recipe.calories),
        cuisine: hit.recipe.cuisineType?.[0] || 'Unknown'
      }));
    }
  } catch (error) {
    console.error('Edamam API error:', error.message);
  }
  return [];
}

// Function to search recipes using TheMealDB API (completely free)
async function searchMealDBRecipes(query, limit = 5) {
  try {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php`, {
      params: { s: query },
      timeout: 10000
    });

    if (response.data && response.data.meals) {
      return response.data.meals.slice(0, limit).map(meal => ({
        id: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        source: 'TheMealDB',
        rating: '4.5/5',
        time: '30 mins',
        url: `https://www.themealdb.com/meal/${meal.idMeal}`,
        ingredients: extractMealDBIngredients(meal),
        category: meal.strCategory,
        area: meal.strArea
      }));
    }
  } catch (error) {
    console.error('TheMealDB API error:', error.message);
  }
  return [];
}

// Helper function to extract ingredients from TheMealDB response
function extractMealDBIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
    }
  }
  return ingredients;
}

// Function to search recipes using Spoonacular API (free tier with API key)
async function searchSpoonacularRecipes(query, limit = 5) {
  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
      params: {
        query: query,
        number: limit,
        apiKey: 'your_spoonacular_api_key', // Free tier available
        addRecipeInformation: true,
        fillIngredients: true
      },
      timeout: 10000
    });

    if (response.data && response.data.results) {
      return response.data.results.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        source: 'Spoonacular',
        rating: `${recipe.spoonacularScore ? (recipe.spoonacularScore / 20).toFixed(1) : '4.5'}/5`,
        time: `${recipe.readyInMinutes || 30} mins`,
        url: recipe.sourceUrl,
        ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
        servings: recipe.servings,
        healthScore: recipe.healthScore
      }));
    }
  } catch (error) {
    console.error('Spoonacular API error:', error.message);
  }
  return [];
}


// Health check endpoint
app.get('/api/hello', (req, res) => {
    res.json({ 
      msg: 'Hello from Express! Recipe scraper is running.',
      status: 'healthy',
      cache: {
        size: searchCache.size,
        maxAge: CACHE_DURATION / 1000 + ' seconds'
      },
      rateLimit: {
        activeUsers: requestCounts.size,
        limit: RATE_LIMIT + ' requests per minute'
      },
      timestamp: new Date().toISOString()
    });
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));

// Function to get enhanced recipe data for API URLs
async function getEnhancedRecipeData(url) {
  try {
    // Extract recipe ID from TheMealDB URLs
    if (url.includes('themealdb.com/meal/')) {
      const mealId = url.split('/meal/')[1];
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
      
      if (response.data && response.data.meals && response.data.meals[0]) {
        const meal = response.data.meals[0];
        return {
          title: meal.strMeal,
          image: meal.strMealThumb,
          ingredients: extractMealDBIngredients(meal),
          instructions: meal.strInstructions ? meal.strInstructions.split('\n').filter(step => step.trim()) : [],
          prepTime: '30 mins',
          cookTime: '45 mins',
          servings: '4 servings',
          category: meal.strCategory,
          area: meal.strArea
        };
      }
    }
  } catch (error) {
    console.error('Error getting enhanced recipe data:', error.message);
  }
  return null;
}

// Function to provide fallback recipe data when scraping fails
function getFallbackRecipeData(url, title) {
  const domain = new URL(url).hostname.replace('www.', '');
  
  // Generate recipe data based on the title and domain
  const recipeTemplates = {
    'pasta': {
      ingredients: [
        '1 pound pasta (your choice)',
        '2 tablespoons olive oil',
        '3 cloves garlic, minced',
        '1/2 cup grated Parmesan cheese',
        'Salt and pepper to taste',
        'Fresh basil leaves for garnish'
      ],
      instructions: [
        'Bring a large pot of salted water to boil',
        'Cook pasta according to package directions until al dente',
        'In a large skillet, heat olive oil over medium heat',
        'Add minced garlic and cook until fragrant, about 1 minute',
        'Drain pasta and add to skillet with garlic',
        'Toss with Parmesan cheese and season with salt and pepper',
        'Garnish with fresh basil and serve immediately'
      ]
    },
    'chicken': {
      ingredients: [
        '4 boneless, skinless chicken breasts',
        '2 tablespoons olive oil',
        '1 teaspoon salt',
        '1/2 teaspoon black pepper',
        '1 teaspoon garlic powder',
        '1 teaspoon dried herbs (oregano, thyme, or rosemary)',
        '1/2 cup chicken broth'
      ],
      instructions: [
        'Preheat oven to 400°F (200°C)',
        'Season chicken breasts with salt, pepper, garlic powder, and herbs',
        'Heat olive oil in a large oven-safe skillet over medium-high heat',
        'Add chicken breasts and sear for 3-4 minutes per side until golden brown',
        'Add chicken broth to the skillet',
        'Transfer skillet to preheated oven and bake for 20-25 minutes',
        'Let rest for 5 minutes before serving'
      ]
    },
    'rice': {
      ingredients: [
        '2 cups long-grain white rice',
        '4 cups water or chicken broth',
        '1 tablespoon butter or oil',
        '1 teaspoon salt',
        'Optional: 1/2 cup diced vegetables'
      ],
      instructions: [
        'Rinse rice under cold water until water runs clear',
        'In a medium saucepan, heat butter or oil over medium heat',
        'Add rice and stir for 1-2 minutes until lightly toasted',
        'Add water or broth and salt, bring to a boil',
        'Reduce heat to low, cover, and simmer for 18-20 minutes',
        'Remove from heat and let stand covered for 5 minutes',
        'Fluff with fork before serving'
      ]
    }
  };

  // Determine recipe type from title
  const titleLower = title.toLowerCase();
  let recipeType = 'chicken'; // default
  
  if (titleLower.includes('pasta') || titleLower.includes('noodle')) {
    recipeType = 'pasta';
  } else if (titleLower.includes('rice')) {
    recipeType = 'rice';
  }

  const template = recipeTemplates[recipeType] || recipeTemplates.chicken;
  
  return {
    title: title,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    ingredients: template.ingredients,
    instructions: template.instructions,
    prepTime: '15 mins',
    cookTime: '30 mins',
    servings: '4 servings',
    source: domain,
    note: 'This is a sample recipe. For the original recipe, please visit the source website.'
  };
}
