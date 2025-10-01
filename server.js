/**
 * ZRS Test Map Server
 * Beat Saber custom map hosting with:
 * - Dynamic pack-based uploads
 * - Playlist generation per subfolder
 * - Secure admin mode
 * - Metadata extraction
 * - Playlist images
 * - Admin-side deletion of maps
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAPS_DIR = path.join(__dirname, 'public', 'maps');

// Ensure base maps directory exists
if (!fs.existsSync(MAPS_DIR)) fs.mkdirSync(MAPS_DIR, { recursive: true });

// ----------------------------
// 🧠 Helper: Extract Info.dat Metadata
// ----------------------------
function extractSongMetadata(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const infoEntry = zip.getEntries().find(e =>
      e.entryName.toLowerCase().endsWith('info.dat')
    );
    if (!infoEntry) return null;

    const infoJson = JSON.parse(infoEntry.getData().toString('utf8'));
    return {
      songName: infoJson._songName || 'Unknown Song',
      mapper: infoJson._levelAuthorName || 'Unknown'
    };
  } catch (err) {
    console.warn(`[Metadata] Failed to parse ${zipPath}: ${err.message}`);
    return null;
  }
}

// ----------------------------
// 🧰 Express + EJS Setup
// ----------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ----------------------------
// 📤 Multer Upload Setup with Pack Support
// ----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const selectedPack = req.body.pack || 'default';
    const targetDir = path.join(MAPS_DIR, selectedPack);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.zip')) {
      return cb(new Error('Only .zip files are allowed'));
    }
    cb(null, true);
  }
});

// ----------------------------
// 🔐 Upload Password Middleware
// ----------------------------
function checkUploadPassword(req, res, next) {
  const provided = req.body?.pwd || req.query?.pwd;
  const expected = process.env.UPLOAD_PWD;

  if (!expected) {
    console.warn('[Security] No UPLOAD_PWD set — uploads are unprotected.');
    return next();
  }

  if (provided !== expected) {
    return res.status(401).send('<h1>401 Unauthorized</h1><p>Invalid upload password.</p>');
  }

  next();
}

// ----------------------------
// 🏠 Home Page — Map Listing + Pack Map Lists
// ----------------------------
app.get('/', (req, res) => {
  // 🧭 Get packs (subfolders)
  const packs = fs.readdirSync(MAPS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // 📝 Root folder maps (optional display)
  const files = fs.readdirSync(MAPS_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const fullPath = path.join(MAPS_DIR, f);
      const meta = extractSongMetadata(fullPath);
      const key = path.parse(f).name;
      return {
        filename: f,
        key,
        songName: meta?.songName || key,
        mapper: meta?.mapper || 'Unknown'
      };
    });

  // 📦 Gather maps inside each pack
  const packMaps = {};
  packs.forEach(pack => {
    const packPath = path.join(MAPS_DIR, pack);
    const packFiles = fs.readdirSync(packPath)
      .filter(f => f.endsWith('.zip'))
      .map(f => ({
        filename: f,
        songName: path.parse(f).name
      }));
    packMaps[pack] = packFiles;
  });

  const isAdmin = req.query.admin === '1';
  res.render('index', { maps: files, isAdmin, packs, packMaps });
});

// ----------------------------
// 📜 Playlist Generator (Global)
// ----------------------------
app.get('/playlist.bplist', (req, res) => {
  const files = fs.readdirSync(MAPS_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const originalName = path.parse(f).name;
      const key = originalName
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .toLowerCase();
      return { key, songName: originalName };
    });

  let playlistImage = '';
  const imgPath = path.join(__dirname, 'public', 'images', 'playlist.png');
  if (fs.existsSync(imgPath)) {
    const imgData = fs.readFileSync(imgPath).toString('base64');
    playlistImage = `data:image/png;base64,${imgData}`;
  }

  const playlist = {
    playlistTitle: 'ZRS Test Pack',
    playlistAuthor: 'ZRS Server',
    image: playlistImage,
    songs: files
  };

  res.setHeader('Content-Disposition', 'attachment; filename="zrs-test-pack.bplist"');
  res.json(playlist);
});

// ----------------------------
// 📜 Dynamic Playlist Generator by Pack Subfolder
// ----------------------------
app.get('/playlist/:packName.bplist', (req, res) => {
  const packName = req.params.packName;
  const packDir = path.join(MAPS_DIR, packName);

  if (!fs.existsSync(packDir)) {
    return res.status(404).send(`❌ Pack '${packName}' not found`);
  }

  const files = fs.readdirSync(packDir)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const originalName = path.parse(f).name;
      const key = originalName
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .toLowerCase();
      return { key, songName: originalName };
    });

  let playlistImage = '';
  const imgPath = path.join(__dirname, 'public', 'images', `${packName}.png`);
  if (fs.existsSync(imgPath)) {
    const imgData = fs.readFileSync(imgPath).toString('base64');
    playlistImage = `data:image/png;base64,${imgData}`;
  }

  const playlist = {
    playlistTitle: `ZRS Pack - ${packName}`,
    playlistAuthor: 'ZRS Server',
    image: playlistImage,
    songs: files
  };

  res.setHeader('Content-Disposition', `attachment; filename="${packName}.bplist"`);
  res.json(playlist);
});

// ----------------------------
// 📤 Upload Route (Admin Mode)
// ----------------------------
app.post('/upload', upload.single('mapfile'), checkUploadPassword, (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  console.log(`[Upload] ${req.file.originalname} uploaded to pack: ${req.body.pack}`);
  res.redirect('/?admin=1');
});

// ----------------------------
// 🗑️ Delete Map (Admin Only)
// ----------------------------
app.post('/delete', checkUploadPassword, express.urlencoded({ extended: true }), (req, res) => {
  const { filename, pack } = req.body;
  if (!filename || !pack) return res.status(400).send('Missing file or pack name');

  const filePath = path.join(MAPS_DIR, pack, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[Delete] Removed ${filename} from pack: ${pack}`);
  } else {
    console.warn(`[Delete] File not found: ${filePath}`);
  }

  res.redirect('/?admin=1');
});

// ----------------------------
// 🚀 Start Server
// ----------------------------
app.listen(PORT, () => {
  console.log(`✅ ZRS Test Map Server running at http://localhost:${PORT}`);
});
