// Service for handling search suggestions
import { config } from '../config.js';

// In-memory storage for recent searches (in production, use a database)
const recentSearches = new Set();
const MAX_RECENT_SEARCHES = 50;

// Popular recipe suggestions
const popularRecipes = [
  'chicken breast recipes', 'pasta recipes', 'chocolate cake', 'beef stir fry',
  'salmon recipes', 'pizza dough', 'banana bread', 'chicken curry', 
  'spaghetti carbonara', 'chocolate chip cookies', 'fried rice', 'tacos',
  'lasagna', 'pancakes', 'meatballs', 'caesar salad', 'apple pie',
  'chicken soup', 'grilled cheese', 'mac and cheese', 'french toast',
  'chicken parmesan', 'beef stroganoff', 'chicken alfredo', 'cheesecake',
  'garlic bread', 'chicken teriyaki', 'vegetable curry', 'fish and chips',
  'chicken quesadilla', 'mushroom risotto', 'chicken wings', 'beef tacos',
  'shrimp scampi', 'chicken noodle soup', 'chocolate brownies', 'pad thai',
  'chicken tikka masala', 'beef chili', 'chicken salad', 'veggie burgers'
];

// Common ingredients for suggestion matching
const commonIngredients = [
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'pasta', 'rice',
  'potatoes', 'tomatoes', 'onions', 'garlic', 'cheese', 'eggs', 'milk',
  'flour', 'sugar', 'salt', 'pepper', 'olive oil', 'butter', 'lemon',
  'mushrooms', 'spinach', 'broccoli', 'carrots', 'bell peppers'
];

export function addRecentSearch(query) {
  if (query && query.trim().length > 0) {
    const cleanQuery = query.trim().toLowerCase();
    recentSearches.add(cleanQuery);
    
    // Keep only the most recent searches
    if (recentSearches.size > MAX_RECENT_SEARCHES) {
      const searches = Array.from(recentSearches);
      recentSearches.clear();
      searches.slice(-MAX_RECENT_SEARCHES).forEach(search => recentSearches.add(search));
    }
  }
}

export function getRecentSearches() {
  return Array.from(recentSearches).reverse(); // Most recent first
}

export function generateSuggestions(query, limit = 10) {
  if (!query || query.trim().length === 0) {
    // Return popular recipes when no query
    return popularRecipes.slice(0, limit);
  }

  const cleanQuery = query.trim().toLowerCase();
  const suggestions = [];

  // 1. Add matching recent searches first
  const matchingRecentSearches = Array.from(recentSearches)
    .filter(search => search.includes(cleanQuery))
    .reverse(); // Most recent first
  
  suggestions.push(...matchingRecentSearches);

  // 2. Add matching popular recipes
  const matchingPopularRecipes = popularRecipes.filter(recipe => 
    recipe.toLowerCase().includes(cleanQuery) && !suggestions.includes(recipe.toLowerCase())
  );
  
  suggestions.push(...matchingPopularRecipes);

  // 3. Add ingredient-based suggestions
  const matchingIngredients = commonIngredients
    .filter(ingredient => ingredient.toLowerCase().includes(cleanQuery))
    .map(ingredient => `${ingredient} recipes`)
    .filter(suggestion => {
      const baseIngredient = suggestion.replace(' recipes', '');
      return !suggestions.some(s => s.includes(baseIngredient));
    });
  
  suggestions.push(...matchingIngredients);

  // 4. Add cuisine/cooking method suggestions if query matches
  const cuisineTypes = [
    'italian', 'chinese', 'mexican', 'indian', 'thai', 'japanese', 'french',
    'mediterranean', 'american', 'korean', 'greek', 'spanish', 'vietnamese'
  ];
  
  const cookingMethods = [
    'grilled', 'baked', 'fried', 'roasted', 'steamed', 'boiled', 'sauteed',
    'slow cooked', 'pressure cooked', 'air fried', 'pan fried'
  ];

  cuisineTypes.forEach(cuisine => {
    if (cuisine.includes(cleanQuery) && !suggestions.some(s => s.includes(cuisine))) {
      suggestions.push(`${cuisine} recipes`);
    }
  });

  cookingMethods.forEach(method => {
    if (method.includes(cleanQuery) && !suggestions.some(s => s.includes(method))) {
      suggestions.push(`${method} recipes`);
    }
  });

  // Remove duplicates and limit results
  const uniqueSuggestions = [...new Set(suggestions.map(s => s.toLowerCase()))]
    .slice(0, limit);

  return uniqueSuggestions;
}

// Get suggestions with categories
export function getCategorizedSuggestions(query, limit = 10) {
  const suggestions = generateSuggestions(query, limit * 2); // Get more to categorize
  const recentSearchesList = getRecentSearches();
  
  const result = {
    recent: [],
    popular: [],
    ingredients: [],
    other: []
  };

  suggestions.forEach(suggestion => {
    if (recentSearchesList.includes(suggestion)) {
      result.recent.push(suggestion);
    } else if (popularRecipes.includes(suggestion)) {
      result.popular.push(suggestion);
    } else if (suggestion.includes('recipes') && commonIngredients.some(ing => suggestion.includes(ing))) {
      result.ingredients.push(suggestion);
    } else {
      result.other.push(suggestion);
    }
  });

  // Limit each category
  const maxPerCategory = Math.ceil(limit / 4);
  result.recent = result.recent.slice(0, maxPerCategory);
  result.popular = result.popular.slice(0, maxPerCategory);
  result.ingredients = result.ingredients.slice(0, maxPerCategory);
  result.other = result.other.slice(0, maxPerCategory);

  return result;
}