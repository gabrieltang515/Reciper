import React from 'react';
import { useTheme } from 'styled-components';
import { 
  RecipeListContainer, 
  RecipeGrid, 
  RecipeCard, 
  RecipeImage, 
  RecipeInfo, 
  RecipeTitle, 
  RecipeMeta, 
  RecipeSource,
  RecipeRating,
  RecipeTime,
  NoResults,
  LoadMoreContainer,
  LoadMoreButton
} from './style.js';

const RecipeList = ({ recipes, loading, hasMore, onRecipeClick, onLoadMore }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <RecipeListContainer>
        <NoResults theme={theme}>Searching for recipes...</NoResults>
      </RecipeListContainer>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <RecipeListContainer>
        <NoResults theme={theme}>No recipes found. Try a different search term.</NoResults>
      </RecipeListContainer>
    );
  }

  return (
    <RecipeListContainer>
      <RecipeGrid>
        {recipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            theme={theme}
            onClick={() => onRecipeClick && onRecipeClick(recipe)}
          >
            <RecipeImage 
              src={recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'} 
              alt={recipe.title}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
              }}
            />
            <RecipeInfo>
              <RecipeTitle theme={theme}>{recipe.title}</RecipeTitle>
              <RecipeMeta>
                <RecipeSource theme={theme}>📰 {recipe.source}</RecipeSource>
                {recipe.rating && <RecipeRating theme={theme}>⭐ {recipe.rating}</RecipeRating>}
                {recipe.time && <RecipeTime theme={theme}>⏱️ {recipe.time}</RecipeTime>}
              </RecipeMeta>
            </RecipeInfo>
          </RecipeCard>
        ))}
      </RecipeGrid>
      
      {/* Load More Button */}
      {hasMore && (
        <LoadMoreContainer>
          <LoadMoreButton 
            onClick={onLoadMore}
            disabled={loading}
            theme={theme}
          >
            {loading ? 'Loading...' : 'Load More Recipes'}
          </LoadMoreButton>
        </LoadMoreContainer>
      )}
    </RecipeListContainer>
  );
};

export default RecipeList; 