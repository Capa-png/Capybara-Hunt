# 🦫 Capybara Hunt Game

A web-based scavenger hunt game where players find 50 hidden capybaras and earn points!

## Features

✨ **Core Gameplay**
- Find and scan 50 hidden capybaras across your location
- Enter codes manually (format: CP-XXXX)
- Golden Capybara #50 worth 10 points
- Regular capybaras worth 1pt (first finder) or 0.5pts (subsequent)

🏆 **Leaderboard**
- Real-time scoring system
- Team support (multiple players on same device)
- Persistent leaderboard stored in browser localStorage
- Top 10 players displayed

🔒 **Admin Controls**
- Password-protected admin panel (password: CapaHunt26)
- Download printable barcode sheets
- Reset game data and leaderboard

🌐 **Deployment Options**

### Option 1: Local Network (Development)
```bash
# Start the server (port 8000)
python -m http.server 8000 --bind 0.0.0.0
# Access from: http://YOUR_IP:8000
```

### Option 2: GitHub Pages (Production)
1. **Install Git** (if not already installed)
   - Download from https://git-scm.com/download/win

2. **Initialize repository**
   ```bash
   cd Capybara-Hunt
   git init
   git add .
   git commit -m "Initial commit: Capybara Hunt Game"
   ```

3. **Push to GitHub**
   - Create a new repository on GitHub (e.g., `capybara-hunt`)
   - Follow GitHub's instructions to push your local code
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/capybara-hunt.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose `main` branch, `/ (root)` folder
   - Save

5. **Access your site**
   - https://YOUR_USERNAME.github.io/capybara-hunt/

## Technical Details

**Storage**
- All data stored in browser localStorage
- Data persists across page reloads
- Each device maintains its own leaderboard and found capybaras
- Profanity filter on player names

**Technology Stack**
- Vanilla HTML/CSS/JavaScript (no build tools needed)
- Three.js for 3D capybara model
- JsBarcode for barcode generation
- 100% static - works on GitHub Pages!

## File Structure
```
├── index.html              # Redirect to main file
├── capybara-hunt.html      # Main game page
├── css/
│   └── hunt.css           # All styling
├── js/
│   ├── hunt.js            # Game logic & UI
│   ├── viewer.js          # 3D model viewer
│   └── SVGLoader.js       # Three.js STL loader
├── samples/
│   ├── Cappa+WithAsterisk@3x.png  # Header image
│   └── Cursor*.png        # Custom cursor sprites
└── README.md
```

## Scoring System

- **First finder**: 1 point
- **Repeat finder** (same code, different player): 0.5 points
- **Golden Capybara #50**: 10 points (same player, same time)
- **Rules**: 50 total capybaras, codes redeemable multiple times by different people

## Profanity Filter

Player names are validated to prevent inappropriate content. Common profanities are automatically blocked.

## Game Rules

1. Find hidden capybaras throughout the location
2. Each capybara has a unique code (format: CP-XXXX)
3. Enter the code into the website with your name
4. Earn points - more points for first discoveries
5. Team up and share the same device to collaborate
6. Golden Capybara #50 is worth 10 points!

---

Made with 💖 for school scavenger hunts

