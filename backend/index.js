// Minimal server created 

import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
app.use(express.json());

app.get('/api/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    // Example: scrape recipe title
    const title = $('h1.recipe-title').text().trim();
    res.json({ title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// in backend/index.js
app.get('/api/hello', (req, res) => {
    res.json({ msg: 'Hello from Express!' })
  })
  

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
