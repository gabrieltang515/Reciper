import axios from 'axios';
import { config } from '../config.js';

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
  const results = [];
  results.push(...await searchMealDBRecipes(query, limit));
  if (results.length < limit) {
    results.push(...await searchEdamamRecipes(query, limit - results.length));
  }
  if (results.length < limit) {
    results.push(...await searchSpoonacularRecipes(query, limit - results.length));
  }
  return results.slice(0, limit);
}
