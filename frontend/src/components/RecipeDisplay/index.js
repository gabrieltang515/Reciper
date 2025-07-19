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
  MetaItem 
} from './styles';

const RecipeDisplay = ({ recipe }) => {
  const theme = useTheme();

  if (!recipe) return null;

  return (
    <RecipeCard theme={theme}>
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
      </RecipeMeta>

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
              <li key={index}>{instruction}</li>
            ))}
          </InstructionsList>
        </RecipeSection>
      )}
    </RecipeCard>
  );
};

export default RecipeDisplay; 