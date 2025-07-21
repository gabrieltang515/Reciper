import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'styled-components';
import { 
  SearchContainer, 
  StyledSearchIcon, 
  SearchInput, 
  SearchButton, 
  SuggestionsDropdown, 
  SuggestionItem,
  SuggestionCategory 
} from './styles';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...",
  debounceTimeout = 300,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const theme = useTheme();
  
  // Fetch suggestions based on query
  const fetchSuggestions = async (query) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}&limit=8`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Debounced suggestion fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length > 0) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery.trim());
      }, debounceTimeout);
    } else {
      // Show popular suggestions when no query
      debounceRef.current = setTimeout(() => {
        fetchSuggestions('');
      }, 100);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, debounceTimeout]);

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      fetchSuggestions(searchQuery.trim());
    }
  };

  // Handle clicks outside component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryToSearch = selectedIndex >= 0 ? suggestions[selectedIndex] : searchQuery.trim();
    if (queryToSearch) {
      onSearch(queryToSearch);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '2rem auto' }}>
      <form onSubmit={handleSubmit}>
        <SearchContainer theme={theme}>
          <StyledSearchIcon theme={theme} />
          <SearchInput
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleFocus}
            placeholder={placeholder}
            theme={theme}
            disabled={loading}
            autoComplete="off"
          />
          <SearchButton 
            type="submit" 
            disabled={loading || (!searchQuery.trim() && selectedIndex < 0)}
            theme={theme}
          >
            {loading ? 'Searching...' : 'Search'}
          </SearchButton>
        </SearchContainer>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsDropdown theme={theme}>
          {isLoadingSuggestions ? (
            <SuggestionItem theme={theme} style={{ opacity: 0.6 }}>
              Loading suggestions...
            </SuggestionItem>
          ) : (
            <>
              {!searchQuery.trim() && (
                <SuggestionCategory theme={theme}>Popular Recipes</SuggestionCategory>
              )}
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={index}
                  theme={theme}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span style={{ marginRight: '8px' }}>
                    {!searchQuery.trim() ? '🔥' : '🔍'}
                  </span>
                  {suggestion}
                </SuggestionItem>
              ))}
            </>
          )}
        </SuggestionsDropdown>
      )}
    </div>
  );
};

export default SearchBar;