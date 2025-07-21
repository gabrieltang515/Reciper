import axios from 'axios';
import * as cheerio from 'cheerio';
import { config, recipeDomains } from '../config.js';
import { cleanRecipeTitle, cleanIngredients, cleanInstructions, cleanNutrition } from '../utils/cleanText.js';

function isAllowedDomain(url) {
  const domain = new URL(url).hostname.replace('www.', '');
  return recipeDomains.some(d => domain.includes(d));
}

function extractStructuredRecipe($) {
  let data = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item['@type'] === 'Recipe') {
          data = item;
          return false;
        }
      }
    } catch {
      /* ignore */
    }
  });
  if (data) {
    const instructions = Array.isArray(data.recipeInstructions)
      ? data.recipeInstructions.map(r => (typeof r === 'string' ? r : r.text)).filter(Boolean)
      : [];
    
    // Extract nutrition data
    let nutrition = null;
    if (data.nutrition) {
      nutrition = cleanNutrition(data.nutrition);
    }

    return {
      title: data.name || '',
      image: Array.isArray(data.image) ? data.image[0] : data.image || '',
      ingredients: data.recipeIngredient || [],
      instructions,
      nutrition,
      prepTime: data.prepTime || null,
      cookTime: data.cookTime || null,
      totalTime: data.totalTime || null,
      servings: data.recipeYield || data.yield || null
    };
  }
  return null;
}

function extractNutritionFromHTML($) {
  const nutritionData = {};
  
  // Common selectors for nutrition information
  const nutritionSelectors = [
    '.nutrition-table',
    '.recipe-nutrition',
    '.nutrition-facts',
    '[class*="nutrition"]',
    '.recipe-summary-nutrition',
    '.nutrition-summary'
  ];

  // Look for nutrition tables or sections
  for (const selector of nutritionSelectors) {
    const $nutritionSection = $(selector);
    if ($nutritionSection.length) {
      // Extract key-value pairs from nutrition section
      $nutritionSection.find('*').each((_, el) => {
        const $el = $(el);
        const text = $el.text().toLowerCase();
        
        // Look for patterns like "Calories: 250" or "250 calories"
        if (text.includes('calorie')) {
          const match = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:k?cal|calorie)/i);
          if (match) nutritionData.calories = parseFloat(match[1].replace(',', ''));
        }
        
        if (text.includes('protein')) {
          const match = text.match(/(\d+(?:\.\d+)?)\s*g?.*protein/i);
          if (match) nutritionData.protein = parseFloat(match[1]);
        }
        
        if (text.includes('fat') && !text.includes('saturated')) {
          const match = text.match(/(\d+(?:\.\d+)?)\s*g?.*fat/i);
          if (match) nutritionData.fat = parseFloat(match[1]);
        }
        
        if (text.includes('carb')) {
          const match = text.match(/(\d+(?:\.\d+)?)\s*g?.*carb/i);
          if (match) nutritionData.carbs = parseFloat(match[1]);
        }
        
        if (text.includes('fiber')) {
          const match = text.match(/(\d+(?:\.\d+)?)\s*g?.*fiber/i);
          if (match) nutritionData.fiber = parseFloat(match[1]);
        }
        
        if (text.includes('sugar')) {
          const match = text.match(/(\d+(?:\.\d+)?)\s*g?.*sugar/i);
          if (match) nutritionData.sugar = parseFloat(match[1]);
        }
        
        if (text.includes('sodium')) {
          const match = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:mg)?.*sodium/i);
          if (match) nutritionData.sodium = parseFloat(match[1].replace(',', ''));
        }
      });
      break;
    }
  }

  return Object.keys(nutritionData).length > 0 ? nutritionData : null;
}

export async function scrapeRecipeFromUrl(url) {
  if (!isAllowedDomain(url)) {
    throw new Error('Domain not supported');
  }
  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': config.webScraping.userAgent },
    timeout: config.webScraping.timeout,
    maxRedirects: config.webScraping.maxRedirects,
  });
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer').remove();
  let recipe = extractStructuredRecipe($);
  if (!recipe) {
    const title = $('h1').first().text();
    const ingredients = $('li:contains("ingredient")').map((i, el) => $(el).text()).get();
    const instructions = $('[class*="instruction"], li:contains("step"), p:contains("step")')
      .map((i, el) => $(el).text())
      .get();
    recipe = { title, ingredients, instructions };
  }

  return {
    title: cleanRecipeTitle(recipe.title),
    image: recipe.image || '',
    ingredients: cleanIngredients(recipe.ingredients),
    instructions: cleanInstructions(recipe.instructions),
    source: new URL(url).hostname.replace('www.', ''),
    url,
  };
}
