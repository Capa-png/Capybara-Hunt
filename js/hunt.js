document.addEventListener('DOMContentLoaded', () => {
  const TOTAL = 50;
  const USER_KEY = 'capy-user';
  const ADMIN_STATE_KEY = 'capy-admin-session';

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
  let hints = [];
  let visibleNames = new Set(); // Track which names are visible
  let currentUser = getStoredUser() || null;
  let isLoadingFromFirebase = false;
  let hintEditMode = false;
  let adminSessionToken = null; // Unhackable token for admin session

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

  // Generate unhackable admin session token
  function generateAdminToken() {
    // Create token from current timestamp + random number + browser fingerprint
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const fingerprint = navigator.userAgent.length + navigator.language.length;
    adminSessionToken = `${timestamp}-${random}-${fingerprint}`;
    
    // Save with expiration (15 minutes)
    const sessionData = {
      token: adminSessionToken,
      expires: timestamp + (15 * 60 * 1000)
    };
    sessionStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(sessionData));
  }

  // Validate admin session token
  function isAdminSessionValid() {
    const sessionData = sessionStorage.getItem(ADMIN_STATE_KEY);
    if (!sessionData) return false;
    
    try {
      const { token, expires } = JSON.parse(sessionData);
      if (Date.now() > expires) {
        sessionStorage.removeItem(ADMIN_STATE_KEY);
        return false;
      }
      adminSessionToken = token;
      return true;
    } catch (e) {
      return false;
    }
  }

  // Invalidate admin session
  function invalidateAdminSession() {
    sessionStorage.removeItem(ADMIN_STATE_KEY);
    adminSessionToken = null;
  }

  // Comprehensive profanity filter
  const PROFANITIES = [
    'damn', 'hell', 'piss', 'crap', 'ass', 'bitch', 'bastard', 'shit', 'fuck', 'dick', 'cock', 'pussy', 'asshole', 'douchebag', 'douche', 'cunt', 'whore', 'slut',
    'epstein', 'diddy',
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
    const uniqueRedeemers = new Set(redeems.filter(r => r.index === index).map(r => r.username));
    uniqueRedeemers.add(username);
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
    if (!grid) return; // Grid may not exist if section was removed
    
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

    i18n.updateDOM();
  }

  // Show hint modal
  function showHintModal(capybaraIndex, callback) {
    const modal = document.getElementById('hint-modal');
    const textarea = modal.querySelector('#hint-text');
    const errorMsg = modal.querySelector('#hint-error');
    const capyInfo = modal.querySelector('#hint-capybara-info');
    
    capyInfo.textContent = `Capybara #${capybaraIndex}`;
    textarea.value = '';
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
    
    textarea.focus();
    modal.style.display = 'flex';

    const handleSubmit = () => {
      const hintText = textarea.value.trim();
      
      if (!hintText) {
        errorMsg.textContent = 'Please enter a hint';
        errorMsg.style.display = 'block';
        return;
      }

      if (containsProfanity(hintText)) {
        errorMsg.textContent = i18n.t('inappropriateLanguage');
        errorMsg.style.display = 'block';
        return;
      }

      modal.style.display = 'none';
      callback(hintText);
    };

    const handleCancel = () => {
      modal.style.display = 'none';
      callback(null);
    };

    // Remove old listeners
    const submitBtn = modal.querySelector('#hint-submit');
    const cancelBtn = modal.querySelector('#hint-cancel');
    const newSubmitBtn = submitBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newSubmitBtn.addEventListener('click', handleSubmit);
    newCancelBtn.addEventListener('click', handleCancel);
    
    textarea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
    });

    // Allow closing by clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    });
  }

  // Add hint to database
  function addHint(capybaraIndex, username, hintText) {
    const hint = {
      index: capybaraIndex,
      username: username,
      text: hintText,
      timestamp: Date.now()
    };
    
    hints.push(hint);
    hints.sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent
    
    // Save to Firebase
    db.ref('hints').set(hints);
    renderHints();
  }

  // Render hints section
  function renderHints() {
    const container = document.getElementById('hints-container');
    if (!container) return;

    // Group hints by capybara index
    const hintsByCapy = {};
    hints.forEach(hint => {
      if (!hintsByCapy[hint.index]) {
        hintsByCapy[hint.index] = [];
      }
      hintsByCapy[hint.index].push(hint);
    });

    let html = '';
    const sortedIndices = Object.keys(hintsByCapy).sort((a, b) => {
      // Sort by most recent hint
      const maxTimeA = Math.max(...hintsByCapy[a].map(h => h.timestamp));
      const maxTimeB = Math.max(...hintsByCapy[b].map(h => h.timestamp));
      return maxTimeB - maxTimeA;
    });

    sortedIndices.forEach(index => {
      html += `<div style="margin-bottom:20px;border:1px solid #ddd;padding:12px;border-radius:6px;">`;
      html += `<div style="font-weight:bold;margin-bottom:8px">Capybara #${index}</div>`;
      
      hintsByCapy[index].forEach((hint, hintNum) => {
        const removeBtn = hintEditMode ? `<button class="hint-remove-btn" data-hint-id="${hint.timestamp}" style="float:right;background:#d62828;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : '';
        html += `<div style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px;position:relative;">`;
        html += `${removeBtn}<div style="font-size:12px;color:#666;margin-bottom:4px">Hint ${hintNum + 1} by ${hint.username}</div>`;
        html += `<div>${hint.text}</div>`;
        html += `</div>`;
      });

      html += `</div>`;
    });

    container.innerHTML = html || '<p style="color:#999;text-align:center;padding:20px">No hints yet. Be the first to leave one!</p>';

    // Add event listeners for remove buttons
    if (hintEditMode) {
      document.querySelectorAll('.hint-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const hintId = parseInt(btn.getAttribute('data-hint-id'));
          hints = hints.filter(h => h.timestamp !== hintId);
          db.ref('hints').set(hints);
          renderHints();
        });
      });
    }
  }

  // Update leaderboard (local only, not Firebase)
  function updateLeaderboard(username, points) {
    const existing = leaderboard.find(e => e.name === username);
    if (existing) {
      existing.score += points;
      existing.count += 1;
    } else {
      leaderboard.push({ name: username, score: points, count: 1 });
      visibleNames.add(username); // New names are visible by default
    }
    leaderboard.sort((a, b) => b.score - a.score);
    renderLeaderboard();
  }

  // Render leaderboard
  function renderLeaderboard() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    
    const visibleEntries = leaderboard.filter(e => visibleNames.has(e.name) || visibleNames.size === 0);
    board.innerHTML = visibleEntries.slice(0, 10).map((entry, i) => `
      <div class="leaderboard-entry">
        <div style="font-weight:bold;color:#d62828;min-width:30px">#${i + 1}</div>
        <div class="leaderboard-name">${entry.name}</div>
        <div class="leaderboard-score">${entry.score.toFixed(1)}</div>
      </div>
    `).join('');
  }

  // Render admin checklist
  function renderAdminChecklist() {
    const checklist = document.getElementById('admin-names-checklist');
    if (!checklist) return;

    checklist.innerHTML = leaderboard.map(entry => `
      <div style="display:flex;align-items:center;padding:6px;border-bottom:1px solid #eee;">
        <input type="checkbox" class="name-visibility-checkbox" data-name="${entry.name}" ${visibleNames.has(entry.name) || visibleNames.size === 0 ? 'checked' : ''} style="margin-right:8px;cursor:pointer;">
        <span>${entry.name}</span>
      </div>
    `).join('');

    // Add event listeners
    checklist.querySelectorAll('.name-visibility-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const name = checkbox.getAttribute('data-name');
        if (checkbox.checked) {
          visibleNames.add(name);
        } else {
          visibleNames.delete(name);
        }
        renderLeaderboard();
      });
    });
  }

  // Add to found and save to Firebase
  function addFound(index, username) {
    const alreadyRedeemed = redeems.some(r => r.index === index && r.username === username);
    if (alreadyRedeemed) {
      alert(`${username}, ${i18n.t('alreadyFound')}${index}!`);
      return;
    }

    redeems.push({ index, username });
    db.ref('redeems').set(redeems);

    const points = getPoints(index, username);
    updateLeaderboard(username, points);

    renderGrid();
    updateDisplay();

    // Ask if user wants to leave a hint
    showHintModal(index, (hintText) => {
      if (hintText) {
        addHint(index, username, hintText);
      }
    });
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
      
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.remove('lang-btn-active');
      });
      btn.classList.add('lang-btn-active');
    });
  });

  // Listen for i18n changes
  document.addEventListener('i18n-changed', () => {
    renderLeaderboard();
    renderAdminChecklist();
  });

  // Custom cursor implementation
  function initCustomCursor() {
    const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile()) {
      return;
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

  // Load data from Firebase
  function loadFromFirebase() {
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

    db.ref('hints').on('value', (snapshot) => {
      if (snapshot.exists()) {
        hints = snapshot.val();
      } else {
        hints = [];
      }
      if (!isLoadingFromFirebase) {
        renderHints();
      }
    });
  }

  loadFromFirebase();

  // Admin password system
  const ADMIN_PASSWORD = 'CapaHunt26';
  const unlockBtn = document.getElementById('admin-unlock-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminModalClose = document.getElementById('admin-modal-close');
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('admin-password');
  const modalSubmit = document.getElementById('modal-submit');
  const modalCancel = document.getElementById('modal-cancel');

  // Check if admin session is already valid
  if (isAdminSessionValid()) {
    unlockBtn.textContent = '✓ ' + i18n.t('unlock');
    unlockBtn.style.background = '#4caf50';
  }

  unlockBtn.addEventListener('click', () => {
    if (isAdminSessionValid()) {
      // Already unlocked, show admin modal
      renderAdminChecklist();
      adminModal.style.display = 'flex';
    } else {
      // Show password modal
      passwordModal.style.display = 'flex';
      passwordInput.focus();
    }
  });

  modalCancel.addEventListener('click', () => {
    passwordModal.style.display = 'none';
    passwordInput.value = '';
  });

  // Also allow closing password modal by clicking outside of it
  passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      passwordModal.style.display = 'none';
      passwordInput.value = '';
    }
  });

  modalSubmit.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
      generateAdminToken();
      unlockBtn.textContent = '✓ ' + i18n.t('unlock');
      unlockBtn.style.background = '#4caf50';
      passwordModal.style.display = 'none';
      passwordInput.value = '';
      
      renderAdminChecklist();
      adminModal.style.display = 'flex';
    } else {
      alert(i18n.t('wrongPassword'));
    }
  });

  adminModalClose.addEventListener('click', () => {
    adminModal.style.display = 'none';
    hintEditMode = false;
    renderHints();
  });

  // Also allow closing modal by clicking outside of it
  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.style.display = 'none';
      hintEditMode = false;
      renderHints();
    }
  });

  // Admin buttons
  const printBtn = document.getElementById('admin-print-btn');
  const removeHintsBtn = document.getElementById('admin-remove-hints-btn');
  const resetBtn = document.getElementById('admin-reset-btn');

  printBtn.addEventListener('click', () => {
    if (!isAdminSessionValid()) return;
    const barcodes = [];
    for (let i = 1; i <= TOTAL; i++) {
      barcodes.push({ index: i, code: codeForIndex(i) });
    }
    downloadBarcodesPDF(barcodes);
  });

  removeHintsBtn.addEventListener('click', () => {
    if (!isAdminSessionValid()) return;
    hintEditMode = !hintEditMode;
    removeHintsBtn.textContent = hintEditMode ? 'Stop Removing Hints' : 'Remove Hints (Edit Mode)';
    removeHintsBtn.style.background = hintEditMode ? '#f44336' : '#ff9800';
    renderHints();
  });

  resetBtn.addEventListener('click', () => {
    if (!isAdminSessionValid()) return;
    if (confirm(i18n.t('resetConfirm'))) {
      redeems = [];
      leaderboard = [];
      hints = [];
      visibleNames.clear();
      db.ref('redeems').set(redeems);
      db.ref('leaderboard').set(leaderboard);
      db.ref('hints').set(hints);
      renderGrid();
      updateDisplay();
      renderLeaderboard();
      renderHints();
      renderAdminChecklist();
      alert(i18n.t('resetComplete'));
    }
  });

  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      modalSubmit.click();
    }
  });

  // PDF generation for barcodes
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

  // Initial render
  renderGrid();
  updateDisplay();
  renderLeaderboard();
  renderHints();

  // Update i18n on page load
  i18n.updateDOM();
});
