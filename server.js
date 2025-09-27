const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'maps');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

app.use(cors());
app.use(express.static('public')); // existing user frontend

// Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// --- Existing user API ---
// Upload map
app.post('/upload', upload.single('map'), (req, res) => {
  if (!req.file) return res.json({ success: false });
  res.json({ success: true });
});

// Get maps (for user page)
app.get('/api/maps', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => ({ name: f, url: `/maps/${f}` }));
  res.json(files);
});

// Serve map files
app.use('/maps', express.static(UPLOAD_DIR));

// --- Admin frontend ---
// Serve admin page
app.use('/admin', express.static('admin'));

// Admin API: list maps
app.get('/admin/api/maps', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => ({ name: f, url: `/maps/${f}` }));
  res.json(files);
});

// Admin API: delete map
app.delete('/admin/api/delete/:name', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true });
  }
  res.json({ success: false });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));