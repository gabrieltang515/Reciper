export function cleanTextContent(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\w\s\-.,!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

export function cleanRecipeTitle(title = '') {
  return cleanTextContent(title).substring(0, 100);
}

export function cleanIngredients(list = []) {
  return list
    .map(item => cleanTextContent(item))
    .filter(t => t.length >= 3 && t.length <= 150)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export function cleanInstructions(list = []) {
  return list
    .map(item => cleanTextContent(item))
    .filter(t => t.length >= 10 && t.length <= 500)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export function cleanNutrition(nutritionData) {
  if (!nutritionData || typeof nutritionData !== 'object') {
    return null;
  }

  const cleaned = {};
  
  // Common nutrition fields
  const nutritionFields = {
    calories: ['calories', 'energy', 'kcal'],
    protein: ['protein', 'proteins'],
    fat: ['fat', 'totalfat', 'total fat'],
    carbs: ['carbohydrates', 'carbs', 'totalcarbohydrates', 'total carbohydrates'],
    fiber: ['fiber', 'fibre', 'dietaryfiber', 'dietary fiber'],
    sugar: ['sugar', 'sugars', 'totalsugars', 'total sugars'],
    sodium: ['sodium', 'salt'],
    cholesterol: ['cholesterol'],
    servings: ['servings', 'serves', 'yield', 'servingsize', 'serving size']
  };

  // Extract and clean nutrition values
  for (const [key, aliases] of Object.entries(nutritionFields)) {
    for (const alias of aliases) {
      const value = findNutritionValue(nutritionData, alias);
      if (value !== null) {
        cleaned[key] = value;
        break;
      }
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

function findNutritionValue(data, field) {
  const searchFields = [
    field,
    field.toLowerCase(),
    field.toUpperCase(),
    field.replace(/\s+/g, ''),
    field.replace(/\s+/g, '').toLowerCase()
  ];

  for (const searchField of searchFields) {
    if (data[searchField] !== undefined) {
      const value = extractNumericValue(data[searchField]);
      if (value !== null) return value;
    }
  }

  // Search in nested objects
  for (const value of Object.values(data)) {
    if (typeof value === 'object' && value !== null) {
      const result = findNutritionValue(value, field);
      if (result !== null) return result;
    }
  }

  return null;
}

function extractNumericValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Extract number from strings like "250 calories", "12g", "1,234 kcal"
    const match = value.match(/[\d,]+\.?\d*/);
    if (match) {
      const num = parseFloat(match[0].replace(/,/g, ''));
      return isNaN(num) ? null : num;
    }
  }
  return null;
}
