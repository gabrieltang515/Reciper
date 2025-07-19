// Minimal server created 

import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
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

    // Title extraction - try multiple selectors
    const titleSelectors = [
      'h1.recipe-title', 
      'h1[class*="title"]', 
      '.recipe-header h1', 
      'h1',
      '.recipe-name',
      '.entry-title',
      '.post-title'
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
      '.ingredients .ingredient'
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
      '.directions li'
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
    const prepTime = $('[class*="prep"], [class*="preparation"], .prep-time').text().trim();
    const cookTime = $('[class*="cook"], [class*="cooking"], .cook-time').text().trim();
    const servings = $('[class*="serving"], [class*="yield"], .servings').text().trim();
    
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
      'img[class*="recipe"]'
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

    res.json(recipe);
  } catch (err) {
    console.error('Scraping error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Enhanced search recipes endpoint with web scraping and load more functionality
app.get('/api/search', async (req, res) => {
  const { query, limit = 5 } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  try {
    console.log(`Searching for: ${query} (limit: ${limit})`);
    
    // Try web search first
    let searchResults = [];
    let isFallback = false;
    
    try {
      searchResults = await searchWebForRecipes(query, parseInt(limit));
      console.log(`Found ${searchResults.length} results from web search`);
    } catch (error) {
      console.log('Web search failed, using fallback data');
      isFallback = true;
    }
    
    // If no results from web scraping, use fallback data
    if (searchResults.length === 0) {
      searchResults = getFallbackRecipes(query).slice(0, parseInt(limit));
      isFallback = true;
      console.log(`Using ${searchResults.length} fallback recipes for: ${query}`);
    }
    
    // Check if there are more results available
    const hasMore = parseInt(limit) < 10 && searchResults.length >= parseInt(limit);
    
    res.json({
      recipes: searchResults,
      query: query,
      total: searchResults.length,
      hasMore: hasMore,
      isFallback: isFallback,
      message: isFallback ? 
        `Couldn't find live recipes for "${query}". Here are some curated suggestions:` : 
        `Found ${searchResults.length} recipes from the web for "${query}"`
    });
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
      }
    ]
  };

  // Determine recipe category based on query
  let category = 'chicken'; // default
  
  if (queryLower.includes('pasta') || queryLower.includes('noodle') || queryLower.includes('spaghetti')) {
    category = 'pasta';
  } else if (queryLower.includes('rice')) {
    category = 'rice';
  } else if (queryLower.includes('dessert') || queryLower.includes('cake') || queryLower.includes('sweet')) {
    category = 'dessert';
  } else if (queryLower.includes('asian') || queryLower.includes('thai') || queryLower.includes('vietnamese') || queryLower.includes('korean') || queryLower.includes('pho') || queryLower.includes('laksa')) {
    category = 'asian';
  } else if (queryLower.includes('mexican') || queryLower.includes('taco') || queryLower.includes('enchilada')) {
    category = 'mexican';
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

// Function to search the web for recipes
async function searchWebForRecipes(query, limit = 5) {
  const results = [];
  
  try {
    // Strategy 1: Search Google for recipe-related content
    const searchUrls = await searchGoogleForRecipes(query);
    console.log(`Found ${searchUrls.length} search results for: ${query}`);
    
    // Strategy 2: Scrape recipes from found websites
    const scrapePromises = searchUrls.slice(0, limit).map(async (url) => {
      try {
        const websiteRecipes = await scrapeRecipeWebsite(url, query);
        return websiteRecipes;
      } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        return [];
      }
    });
    
    // Wait for all scraping to complete
    const allResults = await Promise.all(scrapePromises);
    allResults.forEach(recipes => results.push(...recipes));
    
    // Strategy 3: If no results, try alternative search strategies
    if (results.length === 0) {
      console.log('No results from primary search, trying alternative strategies');
      const alternativeResults = await tryAlternativeSearchStrategies(query);
      results.push(...alternativeResults);
    }

  } catch (error) {
    console.error('Web search error:', error.message);
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
          timeout: 12000
        });

        const $ = cheerio.load(html);
        
        // Extract URLs from Google search results - try multiple selectors
        const selectors = [
          'a[href^="http"]',
          '.yuRUbf a',
          '.rc a',
          '.g a',
          '[data-ved] a'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, element) => {
            const href = $(element).attr('href');
            if (href && 
                !href.includes('google.com') && 
                !href.includes('youtube.com') && 
                !href.includes('maps.google.com') &&
                href.startsWith('http')) {
              const url = href.split('&')[0]; // Remove Google tracking parameters
              if (url && !urls.includes(url)) {
                urls.push(url);
              }
            }
          });
        }
        
        // Also try to extract from search result snippets
        $('.g, .rc, .yuRUbf').each((i, element) => {
          const $el = $(element);
          const link = $el.find('a').attr('href');
          if (link && !link.includes('google.com') && link.startsWith('http')) {
            const url = link.split('&')[0];
            if (url && !urls.includes(url)) {
              urls.push(url);
            }
          }
        });
        
      } catch (error) {
        console.error(`Error scraping Google search for "${searchTerm}":`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error scraping Google search results:', error.message);
  }
  
  return urls.slice(0, 10); // Return top 10 results
}

// Function to scrape a recipe website
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
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(html);
    
    // Try multiple selectors for any website that might contain recipes
    const selectors = [
      // Generic recipe selectors
      {
        container: '[class*="recipe"], [class*="card"], [class*="item"], [class*="post"], [class*="article"]',
        title: '[class*="title"], h1, h2, h3, [class*="heading"]',
        image: 'img[src*="recipe"], img[src*="food"], img[src*="dish"], img',
        link: 'a[href*="recipe"], a[href*="food"], a',
        rating: '[class*="rating"], [class*="star"], [class*="score"]',
        time: '[class*="time"], [class*="duration"], [class*="cook"]'
      },
      // Blog-style recipe selectors
      {
        container: '.post, .entry, .article, .content',
        title: '.entry-title, .post-title, .article-title, h1, h2',
        image: '.post-thumbnail img, .entry-image img, img',
        link: '.entry-title a, .post-title a, a',
        rating: '.rating, .stars, .score',
        time: '.cook-time, .prep-time, .duration'
      },
      // Recipe site selectors
      {
        container: '.recipe, .recipe-card, .recipe-item',
        title: '.recipe-title, .recipe-name, h1, h2',
        image: '.recipe-image img, .recipe-photo img, img',
        link: '.recipe-title a, .recipe-name a, a',
        rating: '.recipe-rating, .rating, .stars',
        time: '.recipe-time, .cook-time, .prep-time'
      },
      // Generic content selectors
      {
        container: '.content, .main, .container, .wrapper',
        title: 'h1, h2, h3, [class*="title"]',
        image: 'img',
        link: 'a',
        rating: '[class*="rating"], [class*="star"]',
        time: '[class*="time"], [class*="duration"]'
      }
    ];

    // Try each selector set
    for (const selectorSet of selectors) {
      const foundRecipes = [];
      
      $(selectorSet.container).each((i, element) => {
        if (i >= 3) return; // Limit to 3 results per selector set
        
        const $el = $(element);
        const title = $el.find(selectorSet.title).text().trim();
        const image = $el.find(selectorSet.image).attr('src') || $el.find(selectorSet.image).attr('data-src') || '';
        const link = $el.find(selectorSet.link).attr('href') || '';
        const rating = $el.find(selectorSet.rating).text().trim();
        const time = $el.find(selectorSet.time).text().trim();

        if (title && title.length > 3) {
          // Clean up the title - remove extra whitespace and newlines
          const cleanTitle = title.replace(/\s+/g, ' ').trim();
          
          // More flexible matching - check if title contains query words or is recipe-related
          const titleLower = cleanTitle.toLowerCase();
          const queryLower = query.toLowerCase();
          const queryWords = queryLower.split(' ');
          
          const isRelevant = queryWords.some(word => titleLower.includes(word)) ||
                           titleLower.includes('recipe') ||
                           titleLower.includes('cook') ||
                           titleLower.includes('food') ||
                           titleLower.includes('dish') ||
                           titleLower.includes('meal');
          
          if (isRelevant) {
            // Clean up rating and time data
            const cleanRating = rating ? rating.replace(/\s+/g, ' ').trim().substring(0, 50) : '4.5/5';
            const cleanTime = time ? time.replace(/\s+/g, ' ').trim().substring(0, 50) : '30 mins';
            
            foundRecipes.push({
              id: `recipe-${url}-${i}`,
              title: cleanTitle,
              image: image.startsWith('http') ? image : `https:${image}`,
              source: new URL(url).hostname.replace('www.', ''),
              rating: cleanRating,
              time: cleanTime,
              url: link.startsWith('http') ? link : `${new URL(url).origin}${link}`
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



// Health check endpoint
app.get('/api/hello', (req, res) => {
    res.json({ msg: 'Hello from Express! Recipe scraper is running.' })
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
