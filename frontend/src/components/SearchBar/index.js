import React, { useState } from 'react';
import { useTheme } from 'styled-components';
import { SearchContainer, StyledSearchIcon, SearchInput, SearchButton } from './styles';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...",
  debounceTimeout = 300,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <SearchContainer theme={theme}>
        <StyledSearchIcon theme={theme} />
        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          theme={theme}
          disabled={loading}
        />
        <SearchButton 
          type="submit" 
          disabled={loading || !searchQuery.trim()}
          theme={theme}
        >
          {loading ? 'Searching...' : 'Search'}
        </SearchButton>
      </SearchContainer>
    </form>
  );
};

export default SearchBar;