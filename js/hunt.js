document.addEventListener('DOMContentLoaded', () => {
  const TOTAL = 50;
  const USERNAME_KEY = 'capy-username';

  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyDfJrOSSCv1EG6rQ8w-xMgJrCNecGFTa0E",
    authDomain: "capybara-hunt.firebaseapp.com",
    databaseURL: "https://capybara-hunt-default-rtdb.firebaseio.com",
    projectId: "capybara-hunt",
    storageBucket: "capybara-hunt.firebasestorage.app",
    messagingSenderId: "522590066624",
    appId: "1:522590066624:web:da0cd9a85fa683719a9a25",
    measurementId: "G-EBBW7LY8PK"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // Data stores
  let redeems = [];
  let leaderboard = [];
  let currentUsername = localStorage.getItem(USERNAME_KEY) || '';
  let isLoadingFromFirebase = false;

  // Profanity filter
  const PROFANITIES = ['damn', 'hell', 'piss', 'crap', 'ass', 'bitch', 'bastard', 'shit', 'fuck', 'dick', 'cock', 'pussy', 'asshole', 'douchebag', 'douche', 'cunt', 'whore', 'slut'];
  
  function containsProfanity(text) {
    const lower = text.toLowerCase();
    return PROFANITIES.some(word => lower.includes(word));
  }

  // Helper: get set of found capybara indices (by anyone)
  function getFoundIndices() {
    return new Set(redeems.map(r => r.index));
  }

  // Code generator
  function codeForIndex(n) {
    const mod = Math.pow(36, 4);
    const val = (n * 1973 + 12345) % mod;
    return 'CP-' + val.toString(36).toUpperCase().padStart(4, '0');
  }

  function indexForCode(code) {
    for (let i = 1; i <= TOTAL; i++) {
      if (codeForIndex(i) === code) return i;
    }
    return null;
  }

  // Calculate points for a capybara
  function getPoints(index, username) {
    if (index === 50) return 10; // Golden capybara always 10 points
    // Count how many unique people have redeemed this code (including current user)
    const uniqueRedeemers = new Set(redeems.filter(r => r.index === index).map(r => r.username));
    uniqueRedeemers.add(username); // Add current user
    // 1 point if first, 0.5 if someone else already got it
    return uniqueRedeemers.size === 1 ? 1 : 0.5;
  }

  // Update display
  function updateDisplay() {
    const found = getFoundIndices();
    const remaining = TOTAL - found.size;
    document.querySelector('.big-number').textContent = remaining;
  }

  // Render grid with special styling for #50
  function renderGrid() {
    const grid = document.getElementById('grid');
    const found = getFoundIndices();
    grid.innerHTML = '';
    for (let i = 1; i <= TOTAL; i++) {
      const item = document.createElement('div');
      let className = 'grid-item';
      if (found.has(i)) {
        className += ' found';
        if (i === 50) className += ' golden';
      }
      item.className = className;
      item.textContent = `#${i}`;
      grid.appendChild(item);
    }
  }

  // Show name prompt modal
  function showNameModal(callback) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000';
    modal.innerHTML = `
      <div style="background:#fff;padding:32px;border-radius:12px;max-width:300px;box-shadow:0 10px 40px rgba(0,0,0,0.3)">
        <h2 style="margin:0 0 16px 0;font-size:20px">Enter Your Name</h2>
        <input id="name-input" type="text" placeholder="Your name" value="${currentUsername}" autocomplete="off" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:14px;margin-bottom:16px;box-sizing:border-box" />
        <div id="error-msg" style="color:#d62828;font-size:12px;margin-bottom:8px;display:none">Please use appropriate language</div>
        <div style="display:flex;gap:8px">
          <button id="name-submit" class="btn-primary" style="flex:1;padding:10px;border:none;background:#d62828;color:#fff;border-radius:6px;cursor:pointer;font-weight:bold">Submit</button>
          <button id="name-cancel" style="flex:1;padding:10px;border:none;background:#999;color:#fff;border-radius:6px;cursor:pointer;font-weight:bold">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#name-input');
    const errorMsg = modal.querySelector('#error-msg');
    input.focus();
    input.select();

    const handleSubmit = () => {
      const name = input.value.trim();
      if (!name) {
        callback(currentUsername || 'Anonymous');
        modal.remove();
        return;
      }
      if (containsProfanity(name)) {
        errorMsg.style.display = 'block';
        input.focus();
        input.select();
        return;
      }
      modal.remove();
      callback(name);
    };

    modal.querySelector('#name-submit').addEventListener('click', handleSubmit);
    modal.querySelector('#name-cancel').addEventListener('click', () => {
      modal.remove();
      callback(currentUsername || 'Anonymous');
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }

  // Update leaderboard and save to Firebase
  function updateLeaderboard(username, points) {
    const existing = leaderboard.find(e => e.name === username);
    if (existing) {
      existing.score += points;
      existing.count += 1;
    } else {
      leaderboard.push({ name: username, score: points, count: 1 });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Save to Firebase
    db.ref('leaderboard').set(leaderboard);
    renderLeaderboard();
  }

  // Render leaderboard
  function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    
    board.innerHTML = leaderboard.slice(0, 10).map((entry, i) => `
      <div style="padding:8px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:bold;color:#d62828">#${i + 1}</div>
        <div>${entry.name}</div>
        <div style="font-weight:bold;font-size:16px">${entry.score.toFixed(1)}</div>
      </div>
    `).join('');
  }

  // Add to found and save to Firebase
  function addFound(index, username) {
    // Check if this username has already redeemed this code
    const alreadyRedeemed = redeems.some(r => r.index === index && r.username === username);
    if (alreadyRedeemed) {
      alert(`${username}, you already found Capybara #${index}!`);
      return;
    }

    // Add redemption
    redeems.push({ index, username });
    
    // Save to Firebase
    db.ref('redeems').set(redeems);

    // Calculate and award points
    const points = getPoints(index, username);
    updateLeaderboard(username, points);

    renderGrid();
    updateDisplay();
  }

  // Manual code entry
  document.getElementById('add-code').addEventListener('click', () => {
    const input = document.getElementById('code-input');
    const code = input.value.trim().toUpperCase();
    if (!code) return;
    if (!/^CP-[0-9A-Z]{4}$/.test(code)) {
      alert('Invalid code format');
      return;
    }
    const idx = indexForCode(code);
    if (!idx) {
      alert('Code not found');
      return;
    }
    
    // Show name modal then process
    showNameModal((username) => {
      currentUsername = username;
      localStorage.setItem(USERNAME_KEY, username);
      addFound(idx, username);
      input.value = '';
    });
  });

  // Handle Enter key in input
  document.getElementById('code-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('add-code').click();
    }
  });

  // Custom cursor implementation
  function initCustomCursor() {
    const cursor = document.createElement('img');
    cursor.id = 'custom-cursor';
    cursor.src = 'samples/Cursor@3x.png';
    cursor.alt = '';
    cursor.style.opacity = '0';
    document.body.appendChild(cursor);

    function setImage(src) {
      cursor.src = src;
    }

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      if (cursor.style.opacity !== '1') cursor.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('button, a, input')) {
        setImage('samples/Hover@3x.png');
      } else {
        setImage('samples/Cursor@3x.png');
      }
    });

    document.addEventListener('mousedown', (e) => {
      setImage('samples/HoverClick@3x.png');
    });

    document.addEventListener('mouseup', (e) => {
      setImage('samples/Hover@3x.png');
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
    });
  }

  initCustomCursor();

  // Load data from Firebase and set up real-time listeners
  function loadFromFirebase() {
    // Load redeems
    db.ref('redeems').on('value', (snapshot) => {
      if (snapshot.exists()) {
        redeems = snapshot.val();
      } else {
        redeems = [];
      }
      if (!isLoadingFromFirebase) {
        renderGrid();
        updateDisplay();
      }
    });

    // Load leaderboard
    db.ref('leaderboard').on('value', (snapshot) => {
      if (snapshot.exists()) {
        leaderboard = snapshot.val();
      } else {
        leaderboard = [];
      }
      if (!isLoadingFromFirebase) {
        renderLeaderboard();
      }
    });
  }

  loadFromFirebase();

  // Admin password system
  const ADMIN_PASSWORD = 'CapaHunt26';
  let adminUnlocked = false;

  const downloadBtn = document.getElementById('download-codes-hud');
  const resetBtn = document.getElementById('reset-all-hud');
  const unlockBtn = document.getElementById('admin-unlock-btn');
  const modal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('admin-password');
  const modalSubmit = document.getElementById('modal-submit');
  const modalCancel = document.getElementById('modal-cancel');

  // Show password modal
  unlockBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    passwordInput.focus();
  });

  // Close modal
  modalCancel.addEventListener('click', () => {
    modal.style.display = 'none';
    passwordInput.value = '';
  });

  // Submit password
  modalSubmit.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
      adminUnlocked = true;
      downloadBtn.classList.remove('btn-disabled');
      resetBtn.classList.remove('btn-disabled');
      downloadBtn.disabled = false;
      resetBtn.disabled = false;
      unlockBtn.textContent = '✓ Unlocked';
      unlockBtn.style.background = '#4caf50';
      unlockBtn.disabled = true;
      modal.style.display = 'none';
      passwordInput.value = '';
    } else {
      alert('Wrong password');
    }
  });

  // Allow Enter key in password input
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      modalSubmit.click();
    }
  });

  // Download codes button (HUD)
  downloadBtn.addEventListener('click', () => {
    if (!adminUnlocked) return;
    const barcodes = [];
    for (let i = 1; i <= TOTAL; i++) {
      barcodes.push({ index: i, code: codeForIndex(i) });
    }
    downloadBarcodesPDF(barcodes);
  });

  // Reset all (HUD)
  resetBtn.addEventListener('click', () => {
    if (!adminUnlocked) return;
    if (confirm('Reset all found capybaras?')) {
      redeems.length = 0;
      leaderboard.length = 0;
      // Save to Firebase
      db.ref('redeems').set(redeems);
      db.ref('leaderboard').set(leaderboard);
      renderGrid();
      updateDisplay();
      renderLeaderboard();
      document.getElementById('feed').innerHTML = '';
      alert('Reset complete');
    }
  });

  // PDF generation for barcodes with visual barcode images
  function downloadBarcodesPDF(barcodes) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Capybara Hunt Codes</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
  <style>
    body { margin: 0; padding: 8mm; font-family: Arial, sans-serif; background: white; }
    .barcode-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
    .barcode-item { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      padding: 8px; 
      border: 1px solid #ddd; 
      border-radius: 4px;
      background: #fafafa;
    }
    svg { width: 100%; height: auto; }
    .barcode-number { 
      font-size: 11px; 
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }
    .barcode-code { 
      font-size: 9px; 
      font-weight: bold; 
      margin-top: 4px; 
      font-family: monospace;
      text-align: center;
      color: #555;
    }
    @media print { 
      body { margin: 4mm; padding: 2mm; } 
      .barcode-grid { gap: 6px; } 
      .barcode-item { padding: 6px; }
    }
  </style>
</head>
<body>
  <h1 style="text-align:center;font-size:20px;margin-bottom:20px">Capybara Hunt Barcodes</h1>
  <div class="barcode-grid" id="barcodes"><\/div>
  <script>
    const barcodes = ${JSON.stringify(barcodes)};
    const container = document.getElementById('barcodes');
    barcodes.forEach(item => {
      const div = document.createElement('div');
      div.className = 'barcode-item';
      
      const number = document.createElement('div');
      number.className = 'barcode-number';
      number.textContent = 'Capybara #' + item.index;
      div.appendChild(number);
      
      const svg = document.createElement('svg');
      svg.id = 'barcode-' + item.code;
      div.appendChild(svg);
      
      const code = document.createElement('div');
      code.className = 'barcode-code';
      code.textContent = item.code;
      div.appendChild(code);
      
      container.appendChild(div);
      try {
        JsBarcode('#barcode-' + item.code, item.code, { 
          format: 'CODE128', 
          width: 2, 
          height: 40, 
          displayValue: false, 
          margin: 2 
        });
      } catch(e) {}
    });
    setTimeout(() => { window.print(); }, 500);
  <\/script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  // Initial render (will be updated when Firebase data loads)
  renderGrid();
  updateDisplay();
  renderLeaderboard();
});
