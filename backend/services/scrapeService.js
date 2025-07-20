import axios from 'axios';
import * as cheerio from 'cheerio';
import { config, recipeDomains } from '../config.js';
import { cleanRecipeTitle, cleanIngredients, cleanInstructions } from '../utils/cleanText.js';

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
    return {
      title: data.name || '',
      image: Array.isArray(data.image) ? data.image[0] : data.image || '',
      ingredients: data.recipeIngredient || [],
      instructions,
    };
  }
  return null;
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
