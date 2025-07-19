import React, { useState } from 'react';
import { useTheme } from 'styled-components';
import { ScraperContainer, ScraperInput, ScrapeButton, ScraperForm } from './styles';

const RecipeScraper = ({ onScrape, loading = false }) => {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const theme = useTheme();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (scrapeUrl.trim()) {
      onScrape(scrapeUrl);
      setScrapeUrl('');
    }
  };

  return (
    <ScraperForm onSubmit={handleSubmit}>
      <ScraperContainer theme={theme}>
        <ScraperInput
          type="url"
          value={scrapeUrl}
          onChange={(e) => setScrapeUrl(e.target.value)}
          placeholder="Enter recipe URL (e.g., https://allrecipes.com/recipe/...)"
          theme={theme}
          required
        />
        <ScrapeButton 
          type="submit" 
          disabled={loading || !scrapeUrl.trim()} 
          theme={theme}
        >
          {loading ? 'Scraping...' : 'Scrape Recipe'}
        </ScrapeButton>
      </ScraperContainer>
    </ScraperForm>
  );
};

export default RecipeScraper; 