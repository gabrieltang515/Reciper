# 🍳 Reciper - Recipe Scraper & Search

A modern web application that allows users to search for recipes and scrape recipe details from URLs. Built with React frontend and Node.js backend.

## ✨ Features

- **Recipe Search**: Search for recipes by name across multiple recipe websites
- **URL Scraping**: Scrape detailed recipe information from recipe URLs
- **Beautiful UI**: Modern, responsive design with dark/light theme support
- **Real-time Results**: Instant search results with loading states
- **Error Handling**: Graceful error handling with user-friendly messages
- **Fallback Data**: Reliable fallback data when web scraping fails

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd orbital
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:4000`

4. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 🎯 How to Use

### Recipe Search
1. Enter a recipe name in the search bar (e.g., "chicken rice", "pasta", "chocolate cake")
2. Click the search button or press Enter
3. View the search results in a beautiful grid layout
4. Click on any recipe card to scrape its detailed information

### Recipe URL Scraping
1. Enter a recipe URL in the scraper input field
2. Click "Scrape Recipe"
3. View the detailed recipe information including:
   - Recipe title
   - Ingredients list
   - Cooking instructions
   - Prep/cook times
   - Servings
   - Recipe image

## 🏗️ Project Structure

```
orbital/
├── backend/
│   ├── index.js          # Express server with API endpoints
│   ├── package.json      # Backend dependencies
│   └── node_modules/
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── SearchBar/
│   │   │   ├── RecipeScraper/
│   │   │   ├── RecipeList/
│   │   │   ├── RecipeDisplay/
│   │   │   ├── ErrorMessage/
│   │   │   └── Title/
│   │   ├── utils/
│   │   │   └── Themes.js # Theme configuration
│   │   ├── App.jsx       # Main application component
│   │   └── index.js      # Application entry point
│   ├── package.json      # Frontend dependencies
│   └── public/           # Static assets
└── README.md
```

## 🔧 API Endpoints

### Backend API (Port 4000)

- `GET /api/hello` - Health check endpoint
- `GET /api/search?query=<search_term>` - Search for recipes
- `GET /api/scrape?url=<recipe_url>` - Scrape recipe from URL

### Example API Usage

```bash
# Search for recipes
curl "http://localhost:4000/api/search?query=chicken%20rice"

# Scrape recipe from URL
curl "http://localhost:4000/api/scrape?url=https://allrecipes.com/recipe/..."
```

## 🎨 Technologies Used

### Frontend
- **React** - UI framework
- **Styled Components** - CSS-in-JS styling
- **Material-UI Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Cheerio** - HTML parsing and web scraping
- **CORS** - Cross-origin resource sharing
- **Axios** - HTTP client for web scraping

## 🔍 Search Functionality

The application implements a robust search system:

1. **Web Scraping**: Attempts to scrape real recipe data from popular recipe websites
2. **Fallback Data**: Provides curated recipe data when web scraping fails
3. **Error Handling**: Graceful degradation with user-friendly error messages

### Supported Recipe Sites
- AllRecipes.com
- FoodNetwork.com
- And more (extensible)

## 🛠️ Development

### Running in Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/build/
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check if port 4000 is available
   - Ensure all dependencies are installed
   - Check Node.js version (v16+ required)

2. **Frontend not connecting to backend**
   - Ensure backend is running on port 4000
   - Check CORS configuration
   - Verify API endpoints are correct

3. **Search not working**
   - Check browser console for errors
   - Verify backend is responding
   - Check network connectivity

### Debug Mode

Enable debug logging by setting environment variables:

```bash
# Backend debug
DEBUG=* npm start

# Frontend debug
REACT_APP_DEBUG=true npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Recipe data from various recipe websites
- Unsplash for recipe images
- The React and Node.js communities

---

**Happy Cooking! 🍽️**
