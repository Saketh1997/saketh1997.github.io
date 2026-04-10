const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/api/content', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/content.json'), 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load content' });
  }
});

// Serve section partials
app.get('/sections/:name', (req, res) => {
  const file = path.join(__dirname, 'sections', req.params.name);
  if (fs.existsSync(file)) res.sendFile(file);
  else res.status(404).send('Section not found');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));