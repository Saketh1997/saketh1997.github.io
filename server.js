const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public/docs')));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/docs', 'index.html'));
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
