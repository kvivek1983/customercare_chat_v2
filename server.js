const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;
const DIST_DIR = path.join(__dirname, 'dist/coreui-free-angular-admin-template/browser');

// Serve static files from the Angular build
app.use(express.static(DIST_DIR));

// For all other routes, serve index.html (Angular SPA routing)
app.get('/*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
