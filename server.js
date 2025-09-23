const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (so Beat Saber mods can call this)
app.use(cors());

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

// In-memory list of maps
let maps = [];

// Upload endpoint
app.post('/upload', upload.single('map'), (req, res) => {
  const map = {
    id: Date.now().toString(),
    name: req.file.originalname,
    filename: req.file.filename,
    url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  };
  maps.push(map);
  res.json({ success: true, map });
});

// API: list maps
app.get('/api/maps', (req, res) => {
  res.json(maps);
});

// Root page (optional)
app.get('/', (req, res) => {
  res.send('<h1>ZRS Test Maps</h1><p>Upload via /upload (form-data)</p>');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
