const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'app');

app.disable('x-powered-by');
app.use(compression());

// Static assets: cache CSS/JS for 1h, images for 7d; HTML always revalidates.
app.use(express.static(ROOT, {
  index: false,
  setHeaders(res, filePath) {
    if (/\.(png|jpe?g|webp|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    } else if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// content.json cached in memory, re-read only when the file changes.
const CONTENT_PATH = path.join(ROOT, 'data/content.json');
let contentCache = null;
let contentMtime = 0;

app.get('/api/content', (req, res) => {
  try {
    const mtime = fs.statSync(CONTENT_PATH).mtimeMs;
    if (!contentCache || mtime !== contentMtime) {
      contentCache = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
      contentMtime = mtime;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.json(contentCache);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load content' });
  }
});

app.get('/sections/:name', (req, res) => {
  // Only serve known section files — blocks path traversal.
  if (!/^[a-z]+\.html$/.test(req.params.name)) {
    return res.status(404).send('Section not found');
  }
  const file = path.join(ROOT, 'sections', req.params.name);
  if (fs.existsSync(file)) {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(file);
  } else {
    res.status(404).send('Section not found');
  }
});

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
