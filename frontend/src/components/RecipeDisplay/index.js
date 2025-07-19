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
  CloseButton
} from './styles';

const RecipeDisplay = ({ recipe, onClose }) => {
  const theme = useTheme();

  if (!recipe) return null;

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
        {recipe.servings && <MetaItem>👥 Serves: {recipe.servings}</MetaItem>}
        {recipe.category && <MetaItem>🍽️ Category: {recipe.category}</MetaItem>}
        {recipe.area && <MetaItem>🌍 Cuisine: {recipe.area}</MetaItem>}
      </RecipeMeta>

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