<h1 align="center">🧠 ZRS Test Maps Server</h1>

<p align="center">
  <b>Node.js / Express backend for distributing and testing Beat Saber maps</b><br>
  Part of the <b>ZRS Test Maps workflow</b> — powering cross-platform testing for Quest and PCVR players.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Express-blue?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Deployed%20on-Evennode-blueviolet" alt="Evennode">
  <img src="https://img.shields.io/github/last-commit/lilracer2000-glitch/ZRSTestMaps-Server?label=Last%20Commit&color=brightgreen" alt="Last Commit">
</p>

---

## 🚀 Overview

The **ZRS Test Maps Server** hosts and manages custom Beat Saber test maps, with REST endpoints supporting:

- 🧭 **ZRSTestMapsPCVR Mod** (IPA / BSManager)
- 🕶️ **ZRSTestMapsQuest Mod** (MBF / ModsBeforeFriday)

It enables **One-Click Installs**, **map uploads**, and automated testing for creators and testers.

---

## 🗂️ Folder Structure

\`\`\`
zrstestmaps/
├── admin/              # Admin UI (map management, delete/update)
├── public/             # Public assets (CSS, JS, images)
├── views/              # EJS templates for rendered pages
├── uploads/            # Uploaded Beat Saber .zip map files
├── server.js           # Main Express entry point
├── package.json        # Dependencies and scripts
├── .gitignore          # Ignores .env, node_modules, build artifacts
└── .env                # Environment variables (excluded from repo)
\`\`\`

---

## ⚙️ Setup

### 1️⃣ Clone the repository
\`\`\`bash
git clone git@github.com:lilracer2000-glitch/ZRSTestMaps-Server.git
cd ZRSTestMaps-Server
\`\`\`

### 2️⃣ Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3️⃣ Create .env
Create a \`.env\` file in the project root:

\`\`\`env
# ZRS Test Maps Server Configuration
PORT=3000
NODE_ENV=development

SERVER_URL=https://zrstestmaps.us-3.evennode.com
PUBLIC_URL=https://zrstestmaps.us-3.evennode.com/public

API_KEY=your-secret-key
\`\`\`

> ⚠️ Do **not** commit .env — it’s already ignored via .gitignore.

### 4️⃣ Run locally
\`\`\`bash
npm start
\`\`\`

Then visit:  
\`http://localhost:3000\`

---

## 🌍 Deployment (Evennode)

Evennode uses Git-based deployments:  
\`\`\`bash
git push evennode main
\`\`\`

Set environment variables manually through Evennode.

---

## 🔗 API Endpoints

| Endpoint | Method | Description |
|-----------|--------|--------------|
| \`/\` | GET | Main landing page |
| \`/maps/:user\` | GET | Returns JSON list of maps for a user |
| \`/upload\` | POST | Upload a new test map (.zip) |
| \`/ping\` | GET | Connection check for mods (PCVR/Quest) |
| \`/admin\` | GET | Admin panel for managing maps |

---

## 🧰 Dependencies

| Package | Purpose |
|----------|----------|
| express | Web server framework |
| ejs | HTML templating |
| multer | File upload handling |
| dotenv | Environment variables |
| fs-extra | File system utilities |
| path | Node core path management |

---

## 🧠 Credits

Created by **[VRZIP (Phill Hannaford)](https://github.com/lilracer2000-glitch)**  
Part of the **ZRS Test Maps** ecosystem 🕶️

---

## 🪄 Roadmap

- 🔑 Admin authentication system  
- 📊 Mod connection dashboard  
- 📦 BeatSaver-style download stats  
- 🎨 Enhanced UI for map browsing and upload  

---

## 📜 License

\`\`\`
MIT License © 2025 Phill Hannaford / VRZIP
\`\`\`

---

<p align="center">
  <sub>Built with ❤️ for the Beat Saber modding and mapping community.</sub>
</p>
