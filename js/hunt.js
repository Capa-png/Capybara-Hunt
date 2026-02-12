document.addEventListener('DOMContentLoaded', () => {
  const TOTAL = 50;
  const USER_KEY = 'capy-user';

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
  let currentUser = getStoredUser() || null;
  let isLoadingFromFirebase = false;

  // Get current user from localStorage
  function getStoredUser() {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  // Save current user to localStorage
  function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    currentUser = user;
  }

  // Comprehensive profanity filter with additional blocked words
  const PROFANITIES = [
    // Original list
    'damn', 'hell', 'piss', 'crap', 'ass', 'bitch', 'bastard', 'shit', 'fuck', 'dick', 'cock', 'pussy', 'asshole', 'douchebag', 'douche', 'cunt', 'whore', 'slut',
    // Additional blocked words
    'epstein', 'diddy',
    // CMU bad words list (selected most relevant/severe ones)
    'nigger', 'nigga', 'faggot', 'fag', 'retard', 'coon', 'gook', 'spic', 'wetback', 'kike', 'jap', 'paki', 'towelhead', 'raghead', 'chink', 'zipperhead', 'beaner', 'spade', 'jigaboo', 'jungle bunny', 'cocksucker', 'motherfucker', 'asshat', 'bitch ass', 'biatch', 'bollocks', 'bugger', 'bullshit', 'arsehole', 'arse', 'twat', 'wanker', 'shite', 'pissed', 'tit', 'bollard'
  ];
  
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

  // Show user registration modal
  function showUserModal(callback) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000';
    modal.innerHTML = `
      <div style="background:#fff;padding:32px;border-radius:12px;max-width:350px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto">
        <h2 style="margin:0 0 8px 0;font-size:20px" data-i18n="enterName">Enter Your Information</h2>
        <p style="margin:0 0 16px 0;font-size:12px;color:#666">Please use your real first and last name</p>
        <input id="first-name" type="text" data-i18n-placeholder="firstName" placeholder="First Name" autocomplete="off" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:14px;margin-bottom:12px;box-sizing:border-box" />
        <input id="last-name" type="text" data-i18n-placeholder="lastName" placeholder="Last Name" autocomplete="off" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:14px;margin-bottom:12px;box-sizing:border-box" />
        <input id="email-input" type="email" data-i18n-placeholder="schoolEmail" placeholder="your.name@lrsd.net" autocomplete="off" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:6px;font-size:14px;margin-bottom:12px;box-sizing:border-box" />
        <div id="error-msg" style="color:#d62828;font-size:12px;margin-bottom:12px;display:none"></div>
        <div style="display:flex;gap:8px">
          <button id="user-submit" class="btn-primary" style="flex:1;padding:10px;border:none;background:#d62828;color:#fff;border-radius:6px;cursor:pointer;font-weight:bold" data-i18n="submit">Submit</button>
          <button id="user-cancel" style="flex:1;padding:10px;border:none;background:#999;color:#fff;border-radius:6px;cursor:pointer;font-weight:bold" data-i18n="skip">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const firstNameInput = modal.querySelector('#first-name');
    const lastNameInput = modal.querySelector('#last-name');
    const emailInput = modal.querySelector('#email-input');
    const errorMsg = modal.querySelector('#error-msg');
    firstNameInput.focus();

    const handleSubmit = () => {
      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const email = emailInput.value.trim();

      errorMsg.style.display = 'none';
      errorMsg.textContent = '';

      // Validate
      if (!firstName || !lastName) {
        errorMsg.textContent = i18n.t('nameRequired');
        errorMsg.style.display = 'block';
        return;
      }

      if (!email.endsWith('@lrsd.net')) {
        errorMsg.textContent = i18n.t('invalidEmail');
        errorMsg.style.display = 'block';
        return;
      }

      const fullName = `${firstName} ${lastName}`;
      if (containsProfanity(fullName)) {
        errorMsg.textContent = i18n.t('inappropriateLanguage');
        errorMsg.style.display = 'block';
        return;
      }

      const user = { name: fullName, email, firstName, lastName };
      saveUser(user);
      modal.remove();
      callback(user);
    };

    modal.querySelector('#user-submit').addEventListener('click', handleSubmit);
    modal.querySelector('#user-cancel').addEventListener('click', () => {
      modal.remove();
      if (currentUser) {
        callback(currentUser);
      } else {
        callback(null);
      }
    });

    firstNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') lastNameInput.focus();
    });
    lastNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') emailInput.focus();
    });
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });

    // Update i18n for the modal
    i18n.updateDOM();
  }

  // Update leaderboard (local only, not Firebase)
  function updateLeaderboard(username, points) {
    const existing = leaderboard.find(e => e.name === username);
    if (existing) {
      existing.score += points;
      existing.count += 1;
    } else {
      leaderboard.push({ name: username, score: points, count: 1 });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    renderLeaderboard();
  }

  // Render leaderboard
  function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    
    board.innerHTML = leaderboard.slice(0, 10).map((entry, i) => `
      <div class="leaderboard-entry">
        <div style="font-weight:bold;color:#d62828;min-width:30px">#${i + 1}</div>
        <div class="leaderboard-name">${entry.name}</div>
        <div class="leaderboard-score">${entry.score.toFixed(1)}</div>
      </div>
    `).join('');
  }

  // Render admin leaderboard (with remove buttons)
  function renderAdminLeaderboard() {
    const board = document.getElementById('admin-leaderboard');
    if (!board) return;
    
    board.innerHTML = leaderboard.map((entry, i) => `
      <div class="leaderboard-entry">
        <div style="font-weight:bold;color:#d62828;min-width:30px">#${i + 1}</div>
        <div class="leaderboard-name">${entry.name}</div>
        <div class="leaderboard-score">${entry.score.toFixed(1)}</div>
        <button class="leaderboard-remove" data-name="${entry.name}" title="Remove">✕</button>
      </div>
    `).join('');

    // Add event listeners for remove buttons
    board.querySelectorAll('.leaderboard-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nameToRemove = btn.getAttribute('data-name');
        leaderboard = leaderboard.filter(e => e.name !== nameToRemove);
        renderLeaderboard();
        renderAdminLeaderboard();
      });
    });
  }

  // Add to found and save to Firebase
  function addFound(index, username) {
    // Check if this username has already redeemed this code
    const alreadyRedeemed = redeems.some(r => r.index === index && r.username === username);
    if (alreadyRedeemed) {
      alert(`${username}, ${i18n.t('alreadyFound')}${index}!`);
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
      alert(i18n.t('invalidCodeFormat'));
      return;
    }
    const idx = indexForCode(code);
    if (!idx) {
      alert(i18n.t('codeNotFound'));
      return;
    }
    
    // Check if user is registered
    if (!currentUser) {
      showUserModal((user) => {
        if (user) {
          addFound(idx, user.name);
          input.value = '';
        }
      });
    } else {
      addFound(idx, currentUser.name);
      input.value = '';
    }
  });

  // Handle Enter key in code input
  document.getElementById('code-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('add-code').click();
    }
  });

  // Language switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      i18n.setLanguage(lang);
      
      // Update button styles
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.remove('lang-btn-active');
      });
      btn.classList.add('lang-btn-active');
    });
  });

  // Listen for i18n changes to update specific elements
  document.addEventListener('i18n-changed', () => {
    renderLeaderboard();
    renderAdminLeaderboard();
  });

  // Custom cursor implementation (desktop only)
  function initCustomCursor() {
    // Detect mobile
    const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile()) {
      return; // Skip custom cursor on mobile
    }

    const cursor = document.createElement('img');
    cursor.id = 'custom-cursor';
    cursor.src = 'samples/Cursor@3x.png';
    cursor.alt = '';
    cursor.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      opacity: 1;
      width: auto;
      height: auto;
    `;
    document.body.appendChild(cursor);
    
    // Hide default cursor
    document.body.style.cursor = 'none';

    function setImage(src) {
      cursor.src = src;
    }

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      cursor.style.opacity = '1';
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

    // Load leaderboard - for display only, we manage locally
    db.ref('leaderboard').on('value', (snapshot) => {
      if (snapshot.exists()) {
        // We don't load from Firebase, only display local
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

  const unlockBtn = document.getElementById('admin-unlock-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminModalClose = document.getElementById('admin-modal-close');
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('admin-password');
  const modalSubmit = document.getElementById('modal-submit');
  const modalCancel = document.getElementById('modal-cancel');

  // Show password modal
  unlockBtn.addEventListener('click', () => {
    passwordModal.style.display = 'flex';
    passwordInput.focus();
  });

  // Close password modal
  modalCancel.addEventListener('click', () => {
    passwordModal.style.display = 'none';
    passwordInput.value = '';
  });

  // Submit admin password
  modalSubmit.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
      adminUnlocked = true;
      unlockBtn.textContent = '✓ ' + i18n.t('unlock');
      unlockBtn.style.background = '#4caf50';
      unlockBtn.disabled = true;
      passwordModal.style.display = 'none';
      passwordInput.value = '';
      
      // Show admin modal
      renderAdminLeaderboard();
      adminModal.style.display = 'flex';
    } else {
      alert(i18n.t('wrongPassword'));
    }
  });

  // Close admin modal
  adminModalClose.addEventListener('click', () => {
    adminModal.style.display = 'none';
    adminUnlocked = false;
    unlockBtn.textContent = i18n.t('unlock');
    unlockBtn.style.background = '#666';
    unlockBtn.disabled = false;
  });

  // Allow Enter key in password input
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      modalSubmit.click();
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

  // Update i18n on page load
  i18n.updateDOM();
});
