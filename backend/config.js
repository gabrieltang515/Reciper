// Configuration file for recipe scraper APIs
export const config = {
  // Free APIs (no API key required)
  mealDB: {
    enabled: true,
    baseUrl: 'https://www.themealdb.com/api/json/v1/1',
    apiKey: '1' // Free API key
  },
  
  // APIs requiring registration (free tiers available)
  edamam: {
    enabled: false, // Set to true when you have API keys
    appId: process.env.EDAMAM_APP_ID || 'your_app_id',
    appKey: process.env.EDAMAM_APP_KEY || 'your_app_key',
    baseUrl: 'https://api.edamam.com/api/recipes/v2'
  },
  
  spoonacular: {
    enabled: false, // Set to true when you have API key
    apiKey: process.env.SPOONACULAR_API_KEY || 'your_spoonacular_api_key',
    baseUrl: 'https://api.spoonacular.com/recipes'
  },
  
  // Web scraping settings
  webScraping: {
    enabled: true,
    timeout: 12000,
    maxRedirects: 5,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  
  // Cache settings
  cache: {
    duration: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 10 * 60 * 1000 // 10 minutes
  },
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: 10,
    windowMs: 60 * 1000 // 1 minute
  },
  
  // Recipe validation settings
  validation: {
    minTitleLength: 5,
    maxTitleLength: 200,
    minIngredientLength: 3,
    maxIngredientLength: 150,
    minInstructionLength: 10,
    maxInstructionLength: 500
  }
};

// Recipe domains to prioritize
export const recipeDomains = [
  'allrecipes.com', 'foodnetwork.com', 'epicurious.com', 'bonappetit.com',
  'seriouseats.com', 'thekitchn.com', 'simplyrecipes.com', 'tasteofhome.com',
  'food.com', 'cookinglight.com', 'eatingwell.com', 'delish.com',
  'goodhousekeeping.com', 'womansday.com', 'countryliving.com',
  'bbcgoodfood.com', 'jamieoliver.com', 'gordonramsay.com',
  'pioneerwoman.com', 'smittenkitchen.com', 'pinchofyum.com',
  'minimalistbaker.com', '101cookbooks.com', 'loveandlemons.com',
  'themealdb.com'  // Added for testing purposes
];

// Domains to exclude from scraping
export const excludeDomains = [
  'stackoverflow.com', 'github.com', 'tiktok.com', 'instagram.com',
  'facebook.com', 'twitter.com', 'youtube.com', 'reddit.com',
  'pinterest.com', 'linkedin.com', 'medium.com', 'dev.to',
  'wikipedia.org', 'quora.com', 'yahoo.com', 'bing.com',
  'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com'
]; 