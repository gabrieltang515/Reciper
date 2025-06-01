import React, { useState } from 'react';
import { useTheme } from 'styled-components';
import { SearchContainer, StyledSearchIcon, SearchInput } from './styles';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...",
  debounceTimeout = 300
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SearchContainer theme={theme}>
        <StyledSearchIcon theme={theme} />
        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          theme={theme}
        />
      </SearchContainer>
    </form>
  );
};

export default SearchBar;