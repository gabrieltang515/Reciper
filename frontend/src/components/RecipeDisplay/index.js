import React from 'react';
import { useTheme } from 'styled-components';
import { 
  RecipeCard, 
  RecipeHeader, 
  RecipeTitle, 
  RecipeImage, 
  RecipeMeta, 
  RecipeSection, 
  RecipeSectionTitle, 
  IngredientsList, 
  InstructionsList,
  MetaItem,
  RecipeNote,
  CloseButton,
  NutritionGrid,
  NutritionItem,
  NutritionValue,
  NutritionLabel
} from './styles';

const RecipeDisplay = ({ recipe, onClose }) => {
  const theme = useTheme();

  if (!recipe) return null;

  const formatNutritionValue = (value, unit = '') => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'number' ? `${value.toFixed(1)}${unit}` : value;
  };

  return (
    <RecipeCard theme={theme}>
      {onClose && (
        <CloseButton onClick={onClose} theme={theme}>
          ✕
        </CloseButton>
      )}
      
      <RecipeHeader>
        <RecipeTitle theme={theme}>{recipe.title}</RecipeTitle>
        {recipe.image && (
          <RecipeImage src={recipe.image} alt={recipe.title} />
        )}
      </RecipeHeader>
      
      <RecipeMeta theme={theme}>
        {recipe.prepTime && <MetaItem>⏱️ Prep: {recipe.prepTime}</MetaItem>}
        {recipe.cookTime && <MetaItem>🔥 Cook: {recipe.cookTime}</MetaItem>}
        {recipe.totalTime && <MetaItem>⏰ Total: {recipe.totalTime}</MetaItem>}
        {recipe.servings && <MetaItem>👥 Serves: {recipe.servings}</MetaItem>}
        {recipe.category && <MetaItem>🍽️ Category: {recipe.category}</MetaItem>}
        {recipe.area && <MetaItem>🌍 Cuisine: {recipe.area}</MetaItem>}
      </RecipeMeta>

      {/* Nutritional Information */}
      {recipe.nutrition && (
        <RecipeSection>
          <RecipeSectionTitle theme={theme}>📊 Nutrition Facts</RecipeSectionTitle>
          <NutritionGrid theme={theme}>
            {recipe.nutrition.calories && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Calories</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.calories)}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.protein && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Protein</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.protein, 'g')}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.fat && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Fat</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.fat, 'g')}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.carbs && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Carbs</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.carbs, 'g')}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.fiber && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Fiber</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.fiber, 'g')}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.sugar && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Sugar</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.sugar, 'g')}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.sodium && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Sodium</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.sodium, 'mg')}</NutritionValue>
              </NutritionItem>
            )}
            {recipe.nutrition.cholesterol && (
              <NutritionItem theme={theme}>
                <NutritionLabel theme={theme}>Cholesterol</NutritionLabel>
                <NutritionValue theme={theme}>{formatNutritionValue(recipe.nutrition.cholesterol, 'mg')}</NutritionValue>
              </NutritionItem>
            )}
          </NutritionGrid>
        </RecipeSection>
      )}

      {/* Show note for fallback recipes */}
      {recipe.note && (
        <RecipeNote theme={theme}>
          <strong>ℹ️ Note:</strong> {recipe.note}
        </RecipeNote>
      )}

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <RecipeSection>
          <RecipeSectionTitle theme={theme}>🥕 Ingredients</RecipeSectionTitle>
          <IngredientsList theme={theme}>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </IngredientsList>
        </RecipeSection>
      )}

      {recipe.instructions && recipe.instructions.length > 0 && (
        <RecipeSection>
          <RecipeSectionTitle theme={theme}>📝 Instructions</RecipeSectionTitle>
          <InstructionsList theme={theme}>
            {recipe.instructions.map((instruction, index) => (
              <li key={index}>
                <strong>Step {index + 1}:</strong> {instruction}
              </li>
            ))}
          </InstructionsList>
        </RecipeSection>
      )}

      {/* Show source link if available */}
      {recipe.source && !recipe.note && (
        <RecipeNote theme={theme}>
          <strong>📰 Source:</strong> {recipe.source}
        </RecipeNote>
      )}
    </RecipeCard>
  );
};

export default RecipeDisplay; 