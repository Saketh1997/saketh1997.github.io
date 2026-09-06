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

// Asset versioning. index.html is served no-cache, but CSS/JS sit behind a
// 4h Cloudflare + browser cache — so a deploy used to leave phones running the
// previous stylesheet until the TTL expired. Stamping a build id onto the
// asset URLs makes each deploy request a URL no cache has seen, which is both
// instant and safe to keep caching aggressively.
const ASSET_DIRS = ['css', 'js'];
function buildStamp() {
  let newest = 0;
  for (const dir of ASSET_DIRS) {
    const d = path.join(ROOT, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const m = fs.statSync(path.join(d, f)).mtimeMs;
      if (m > newest) newest = m;
    }
  }
  return newest.toString(36);
}

const INDEX_PATH = path.join(ROOT, 'index.html');
let indexCache = null;
let indexKey = '';

function renderIndex() {
  const key = fs.statSync(INDEX_PATH).mtimeMs + ':' + buildStamp();
  if (indexCache && key === indexKey) return indexCache;
  const v = buildStamp();
  indexCache = fs.readFileSync(INDEX_PATH, 'utf8')
    .replace(/(href|src)="(\/(?:css|js)\/[^"?]+)"/g, `$1="$2?v=${v}"`);
  indexKey = key;
  return indexCache;
}

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(renderIndex());
});

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
