import axios from 'axios';
import { config } from '../config.js';
import fs from 'fs'; // For possible future file-based fallback

const fallbackRecipes = [
  {
    id: 'fallback-1',
    title: 'Classic Spaghetti Carbonara',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    source: 'Fallback',
    url: 'https://www.simplyrecipes.com/recipes/spaghetti_alla_carbonara/'
  },
  {
    id: 'fallback-2',
    title: 'Easy Chicken Fried Rice',
    image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80',
    source: 'Fallback',
    url: 'https://www.allrecipes.com/recipe/79543/chicken-fried-rice/'
  },
  {
    id: 'fallback-3',
    title: 'Vegetarian Chili',
    image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
    source: 'Fallback',
    url: 'https://www.foodnetwork.com/recipes/food-network-kitchen/vegetarian-chili-recipe-2107097'
  }
];

async function searchMealDBRecipes(query, limit) {
  try {
    const { data } = await axios.get(`${config.mealDB.baseUrl}/search.php`, {
      params: { s: query },
      timeout: config.webScraping.timeout,
    });
    if (data && data.meals) {
      return data.meals.slice(0, limit).map(meal => ({
        id: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        source: 'TheMealDB',
        url: `https://www.themealdb.com/meal/${meal.idMeal}`,
      }));
    }
  } catch (err) {
    console.error('MealDB error:', err.message);
  }
  return [];
}

async function searchEdamamRecipes(query, limit) {
  if (!config.edamam.enabled) return [];
  try {
    const { data } = await axios.get(config.edamam.baseUrl, {
      params: {
        type: 'public',
        q: query,
        app_id: config.edamam.appId,
        app_key: config.edamam.appKey,
        from: 0,
        to: limit,
      },
      timeout: config.webScraping.timeout,
    });
    if (data && data.hits) {
      return data.hits.map(hit => ({
        id: hit.recipe.uri.split('#recipe_')[1],
        title: hit.recipe.label,
        image: hit.recipe.image,
        source: 'Edamam',
        url: hit.recipe.url,
      }));
    }
  } catch (err) {
    console.error('Edamam error:', err.message);
  }
  return [];
}

async function searchSpoonacularRecipes(query, limit) {
  if (!config.spoonacular.enabled) return [];
  try {
    const { data } = await axios.get(`${config.spoonacular.baseUrl}/complexSearch`, {
      params: {
        query,
        number: limit,
        apiKey: config.spoonacular.apiKey,
        addRecipeInformation: true,
      },
      timeout: config.webScraping.timeout,
    });
    if (data && data.results) {
      return data.results.map(r => ({
        id: r.id,
        title: r.title,
        image: r.image,
        source: 'Spoonacular',
        url: r.sourceUrl,
      }));
    }
  } catch (err) {
    console.error('Spoonacular error:', err.message);
  }
  return [];
}

export async function searchRecipes(query, limit = 5) {
  console.log(`[searchRecipes] Query: '${query}', Limit: ${limit}`);
  const results = [];
  const mealDbResults = await searchMealDBRecipes(query, limit);
  console.log(`[searchRecipes] MealDB returned ${mealDbResults.length} results.`);
  results.push(...mealDbResults);
  if (results.length < limit) {
    const edamamResults = await searchEdamamRecipes(query, limit - results.length);
    console.log(`[searchRecipes] Edamam returned ${edamamResults.length} results.`);
    results.push(...edamamResults);
  }
  if (results.length < limit) {
    const spoonacularResults = await searchSpoonacularRecipes(query, limit - results.length);
    console.log(`[searchRecipes] Spoonacular returned ${spoonacularResults.length} results.`);
    results.push(...spoonacularResults);
  }
  if (results.length === 0) {
    console.log('[searchRecipes] No results from APIs. Returning fallback recipes.');
    return fallbackRecipes.slice(0, limit);
  }
  return results.slice(0, limit);
}
