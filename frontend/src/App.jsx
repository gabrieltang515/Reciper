import React, { useState } from 'react';
import { ThemeProvider } from "styled-components";
import styled from "styled-components";
import { darkTheme, lightTheme } from './utils/Themes.js';
import SearchBar from './components/SearchBar';
import RecipeScraper from './components/RecipeScraper';
import RecipeList from './components/RecipeList';
import RecipeDisplay from './components/RecipeDisplay';
import ErrorMessage from './components/ErrorMessage';
import SearchMessage from './components/SearchMessage';
import Title from './components/Title';
import DarkmodeButton from './components/DarkmodeButton'; 

const Body = styled.div`
  background-color: ${({ theme }) => theme.bg};
  width: 100%;
  overflow-x: hidden;
  min-height: 100vh;
`

const Wrapper = styled.div`
  background: linear-gradient(38.73deg, rgba(204, 0, 187, 0.15) 0%, rgba(201, 32, 184, 0) 50%), 
              linear-gradient(141.27deg, rgba(0, 70, 209, 0) 50%, rgba(0, 70, 209, 0.15) 100%);
  width: 100%;
  clip-path: polygon(0 0, 100% 0, 100% 100%,30% 98%, 0 100%);
  padding: 2rem;
`

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  
  const handleSearch = async (query, limit = 5) => {
    console.log('Searching for:', query, 'limit:', limit);
    setLoading(true);
    setError('');
    
    if (limit === 5) {
      // New search - reset everything
      setSearchResults([]);
      setSelectedRecipe(null);
      setSearchMessage('');
      setIsFallback(false);
      setHasMore(false);
      setCurrentQuery(query);
    }
    
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Search results:', data);
        
        if (limit === 5) {
          // New search - replace results
          setSearchResults(data.recipes || []);
        } else {
          // Load more - append results
          setSearchResults(prev => [...prev, ...(data.recipes || [])]);
        }
        
        setSearchMessage(data.message || '');
        setIsFallback(data.isFallback || false);
        setHasMore(data.hasMore || false);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (currentQuery && hasMore) {
      const currentCount = searchResults.length;
      const nextLimit = Math.min(currentCount + 5, 10);
      handleSearch(currentQuery, nextLimit);
    }
  };

  const handleScrape = async (url) => {
    setLoading(true);
    setError('');
    setSelectedRecipe(null);
    
    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedRecipe(data);
      } else {
        setError(data.error || 'Failed to scrape recipe');
      }
    } catch (err) {
      setError('Scraping failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    // When a user clicks on a recipe from search results, scrape that recipe
    if (recipe.url) {
      handleScrape(recipe.url);
    }
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}> 
      <Body> 
        <DarkmodeButton darkMode={darkMode} setDarkMode={setDarkMode} />
        <Wrapper>
          <ContentWrapper>
            <Title />
            <SearchBar onSearch={handleSearch} placeholder="Search for recipes..." />
            <RecipeScraper onScrape={handleScrape} loading={loading} />
            <ErrorMessage message={error} />
            
            {/* Show search message */}
            {searchMessage && (
              <SearchMessage message={searchMessage} isFallback={isFallback} />
            )}
            
            {/* Show search results */}
            {searchResults.length > 0 && (
              <RecipeList 
                recipes={searchResults} 
                loading={loading}
                hasMore={hasMore}
                onRecipeClick={handleRecipeClick}
                onLoadMore={handleLoadMore}
              />
            )}
            
            {/* Show scraped recipe details */}
            {selectedRecipe && (
              <RecipeDisplay recipe={selectedRecipe} />
            )}
          </ContentWrapper>
        </Wrapper>
      </Body>
    </ThemeProvider>
  );
}

export default App;