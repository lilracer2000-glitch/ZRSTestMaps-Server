// ----------------------------
// 🟣 ZRS Test Maps Server — Mapper Mode + Per-Map BPLIST
// ----------------------------
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto'); // for future integrity checks

const app = express();
const PORT = process.env.PORT || 3000;

// 📁 Base folder for mapper test maps
const MAPS_DIR = path.join(__dirname, 'public', 'maps');
if (!fs.existsSync(MAPS_DIR)) fs.mkdirSync(MAPS_DIR, { recursive: true });

// ----------------------------
// 🌐 Middleware
// ----------------------------
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/data', require('express').static('data'));


// ----------------------------
// 📂 Temporary Upload Storage
// ----------------------------
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MAPS_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const tempUpload = multer({ storage: tempStorage });

// ----------------------------
// 🧠 Helper Functions
// ----------------------------
function getMappers() {
  return fs.readdirSync(MAPS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function getMapperFiles(mapper) {
  const mapperDir = path.join(MAPS_DIR, mapper);
  if (!fs.existsSync(mapperDir)) return [];
  return fs.readdirSync(mapperDir)
    .filter(f => f.endsWith('.zip'))
    .map(f => ({
      filename: f,
      songName: path.parse(f).name,
      url: `/maps/${mapper}/${encodeURIComponent(f)}`,
      playlistUrl: `/bplist/${mapper}/${encodeURIComponent(path.parse(f).name)}.bplist`
    }));
}

// ----------------------------
// 🏠 Public / Admin Page
// ----------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  const mappers = getMappers();
  const mapperMaps = {};
  mappers.forEach(mapper => {
    mapperMaps[mapper] = getMapperFiles(mapper);
  });

  const isAdmin = req.query.admin === '1';
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.render('index', { mappers, mapperMaps, isAdmin, baseUrl });
});

// ----------------------------
// 📤 Upload Map to Mapper Folder
// ----------------------------
app.post('/upload', tempUpload.single('mapfile'), (req, res) => {
  const { pwd, mapper } = req.body;

  if (pwd !== process.env.UPLOAD_PWD) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(403).send('Invalid password');
  }

  if (!req.file) return res.status(400).send('No file uploaded');

  const targetMapper = mapper.trim();
  const targetDir = path.join(MAPS_DIR, targetMapper);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const newPath = path.join(targetDir, req.file.originalname);
  fs.renameSync(req.file.path, newPath);

  console.log(`✅ Uploaded ${req.file.originalname} to ${targetDir}`);
  res.redirect('/?admin=1');
});

// ----------------------------
// 🗑️ Delete Map
// ----------------------------
app.post('/delete', (req, res) => {
  const { mapper, filename, pwd } = req.body;
  if (pwd !== process.env.UPLOAD_PWD) return res.status(403).send('Invalid password');

  const targetPath = path.join(MAPS_DIR, mapper, filename);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log(`🗑️ Deleted ${targetPath}`);
  }
  res.redirect('/?admin=1');
});

// ----------------------------
// 📝 Per-Map BPLIST Generation
// ----------------------------
app.get('/bplist/:mapper/:map.bplist', (req, res) => {
  const { mapper, map } = req.params;
  const mapFile = path.join(MAPS_DIR, mapper, `${map}.zip`);
  if (!fs.existsSync(mapFile)) return res.status(404).send('Map not found');

  const playlist = {
    playlistTitle: map,
    playlistAuthor: 'ZRS Test Server',
    image: '',
    songs: [{ key: map, songName: map }]
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${map}.bplist"`);
  res.send(JSON.stringify(playlist, null, 2));
});

// ----------------------------
// 🧩 API v1 — JSON map list
// ----------------------------
function parseBeatSaverStyleName(zip) {
  const name = zip.replace(/\.zip$/i, '');
  const keyMatch = name.match(/^([^\s(]+)/);
  const key = keyMatch ? keyMatch[1] : name;
  const paren = name.match(/\((.+?)\)/);
  let songName = name;
  if (paren) {
    const parts = paren[1].split(' - ');
    songName = parts[0] || name;
  }
  return { key, songName };
}

function listMapsForMapper(mapperName, baseUrl) {
  const dir = path.join(MAPS_DIR, mapperName);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.zip'))
    .map(f => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      const { key, songName } = parseBeatSaverStyleName(f);
      return {
        key,
        songName,
        filename: f,
        size: stat.size,
        url: `${baseUrl}/maps/${encodeURIComponent(mapperName)}/${encodeURIComponent(f)}`
      };
    })
    .sort((a, b) => a.songName.localeCompare(b.songName));
}

app.get('/api/v1/maps', (req, res) => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const mappers = fs.readdirSync(MAPS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({ name, maps: listMapsForMapper(name, baseUrl) }));

  res.json({ mappers });
});

app.get('/api/v1/maps/:mapper', (req, res) => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const { mapper } = req.params;
  const dir = path.join(MAPS_DIR, mapper);
  if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Mapper not found' });

  res.json({ name: mapper, maps: listMapsForMapper(mapper, baseUrl) });
});

// ----------------------------
// 🧠 Health & Ping Checks
// ----------------------------
app.get('/health', (_req, res) => res.send('ok'));

// ✅ Beat Saber PCVR Mod Connectivity Check
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "pong",
    serverTime: new Date().toISOString()
  });
});

// Serve ZRS Slots page
app.get('/zrsslots', (req, res) => {
  res.sendFile(__dirname + '/public/zrsslots.html');
});


// ----------------------------
// 🚀 Start Server
// ----------------------------
app.listen(PORT, () => {
  console.log(`✅ ZRS Test Map Server running at http://localhost:${PORT}`);
});
