import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [msg, setMsg] = useState('Loading…')
  const [searchQuery, setSearchQuery] = useState('')
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMsg(data.msg))
      .catch(() => setMsg('Error connecting to backend'))
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      console.log('Search results:', data)
      // Handle search results here
    } catch (err) {
      setError('Search failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleScrape = async (e) => {
    e.preventDefault()
    if (!scrapeUrl.trim()) return

    setLoading(true)
    setError('')
    setRecipe(null)
    
    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(scrapeUrl)}`)
      const data = await response.json()
      
      if (response.ok) {
        setRecipe(data)
      } else {
        setError(data.error || 'Failed to scrape recipe')
      }
    } catch (err) {
      setError('Scraping failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍳 Recipe Scraper</h1>
        <p className="status">Backend: <strong>{msg}</strong></p>
      </header>

      <main className="app-main">
        {/* Search Section */}
        <section className="search-section">
          <h2>Search for Recipes</h2>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter recipe name (e.g., 'chicken curry')"
              className="search-input"
            />
            <button type="submit" disabled={loading} className="search-button">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </section>

        {/* Scrape Section */}
        <section className="scrape-section">
          <h2>Scrape Recipe from URL</h2>
          <form onSubmit={handleScrape} className="scrape-form">
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="Enter recipe URL (e.g., https://allrecipes.com/recipe/...)"
              className="scrape-input"
              required
            />
            <button type="submit" disabled={loading} className="scrape-button">
              {loading ? 'Scraping...' : 'Scrape Recipe'}
            </button>
          </form>
        </section>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {/* Recipe Display */}
        {recipe && (
          <section className="recipe-display">
            <h2>📖 Scraped Recipe</h2>
            <div className="recipe-card">
              <div className="recipe-header">
                <h3>{recipe.title}</h3>
                {recipe.image && (
                  <img src={recipe.image} alt={recipe.title} className="recipe-image" />
                )}
              </div>
              
              <div className="recipe-meta">
                {recipe.prepTime && <span>⏱️ Prep: {recipe.prepTime}</span>}
                {recipe.cookTime && <span>🔥 Cook: {recipe.cookTime}</span>}
                {recipe.servings && <span>👥 Serves: {recipe.servings}</span>}
              </div>

              {recipe.ingredients.length > 0 && (
                <div className="recipe-section">
                  <h4>🥕 Ingredients</h4>
                  <ul className="ingredients-list">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.instructions.length > 0 && (
                <div className="recipe-section">
                  <h4>📝 Instructions</h4>
                  <ol className="instructions-list">
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
