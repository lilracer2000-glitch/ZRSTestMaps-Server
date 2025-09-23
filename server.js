const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (so Beat Saber mods can call this)
app.use(cors());

// Serve static files from public folder
app.use(express.static('public'));

// Make sure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer config for .zip uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// Serve uploaded zips statically
app.use('/uploads', express.static(UPLOAD_DIR));

// In-memory list of maps (populate with existing uploads on startup)
let maps = fs.readdirSync(UPLOAD_DIR)
  .filter(f => f.endsWith('.zip'))
  .map(f => ({
    id: Date.now().toString() + '-' + f,
    name: f,
    filename: f,
    url: `/uploads/${f}` // relative path works with express.static
  }));

// Upload endpoint
app.post('/upload', upload.single('map'), (req, res) => {
  const map = {
    id: Date.now().toString(),
    name: req.file.originalname,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  };
  maps.push(map);
  res.json({ success: true, map });
});

// API: list maps as JSON
app.get('/api/maps', (req, res) => {
  res.json(maps);
});

// Root page: serve browser interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
