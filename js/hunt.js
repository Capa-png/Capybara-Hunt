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
  let rebelCodes = []; // Rebel capybara codes and their scans
  let visibleHintTeachers = new Set(); // Track which hint teachers are visible
  let currentUser = getStoredUser() || null;
  let isLoadingFromFirebase = false;
  let hintEditMode = false;
  let adminSessionToken = null; // Unhackable token for admin session

  // Rebel Capybara hints data
  const REBEL_TEACHERS = [
    {
      id: 1,
      name: 'Teacher #1',
      codeword: 'Sauna',
      code: 'ROGUE-4K2P',
      hints: [
        '"To be, or not to be, that is the question."<3',
        'I have a super cool DVD collection in my classroom.',
        'Despite sharing a very similar last name with a Winnipeg Jets player, I do not, in fact, play hockey.'
      ]
    },
    {
      id: 2,
      name: 'Teacher #2',
      codeword: 'Plantain',
      code: 'ROGUE-7B8M',
      hints: [
        'Bonjour, hello, hola, bom dia!',
        'Sur la montagne dans un pays lointain... Est le début d\'une chanson que j\'aime bien!',
        'There is a grave in my classroom.'
      ]
    },
    {
      id: 3,
      name: 'Teacher #3',
      codeword: 'Flugalhorn',
      code: 'ROGUE-9X5L',
      hints: [
        'Has the worst after school activity attendance.',
        'Loves a good dystopia book.',
        'Bad plant parent.'
      ]
    },
    {
      id: 4,
      name: 'Teacher #4',
      codeword: 'Juju',
      code: 'ROGUE-2V3Q',
      hints: [
        'Went to CJS in grade 9.',
        'Is colourblind.',
        'Where everyone gets cables from.'
      ]
    },
    {
      id: 5,
      name: 'Teacher #5',
      codeword: 'Panda orange',
      code: 'ROGUE-6N1T',
      hints: [
        'Je travaille ici pour plus que 20 ans.',
        'J\'ai 3 enfants.',
        'J\'ai vécu dans un autre pays.',
        'Je n\'enseigne pas seulement le français.'
      ]
    },
    {
      id: 6,
      name: 'Teacher #6',
      codeword: 'Nikki',
      code: 'ROGUE-3H9W',
      hints: [
        'J\'adore les animaux',
        'J\'adore étudier les langues',
        'J\'adore la psychologie',
        'Je n\'enseigne pas, mais j\'aide les élèves.'
      ]
    },
    {
      id: 7,
      name: 'Teacher #7',
      codeword: 'Axiome',
      code: 'ROGUE-8F1Z',
      hints: [
        'Pythagore, Archimède et Héron ont bien aimé cette matière.',
        'Depuis longtemps les corridors ont entendu ma voix.',
        'Calvitie précoce, sagesse féroce.'
      ]
    },
    {
      id: 8,
      name: 'Teacher #8',
      codeword: 'Piñata',
      code: 'ROGUE-5P7D',
      hints: [
        'J\'ai travaillé ici pour plus de 20 ans.',
        'Proud mama of two kids.',
        'Come say hi to Frida! She\'s chillin\' out at the back of my classroom.'
      ]
    },
    {
      id: 9,
      name: 'Teacher #9',
      codeword: 'Soleil et Nuage',
      code: 'ROGUE-1M4K',
      hints: [
        'Si quelque chose fonctionne bien, on dit que "Ça ________________". Complète la phrase… c\'est le début de mon dernier nom.',
        'Mes élèves dans mes différents cours analysent des cartes, des sources primaires et des cas juridiques.',
        'Dans ma classe, on peut voyager autour du monde… juste en regardant aux murs!'
      ]
    },
    {
      id: 10,
      name: 'Teacher #10',
      codeword: 'Halloween',
      code: 'ROGUE-7L2C',
      hints: [
        'I design tattoos',
        'I have been to Europe 5 times',
        'I sometimes wear a CJS musical sweater',
        'I play the clarinet',
        'I teach one subject'
      ]
    }
  ];

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
    // Split text into words, check for exact matches
    const words = lower.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return PROFANITIES.some(word => words.includes(word));
  }

  // Rebel Capybara Functions
  function indexForRebelCode(code) {
    const teacher = REBEL_TEACHERS.find(t => t.code === code.toUpperCase());
    return teacher ? teacher.id : null;
  }

  function getRebelCodePoints(codeword, username) {
    const codeObj = rebelCodes.find(rc => rc.codeword === codeword);
    
    // Check if this user already scanned this code
    if (codeObj && codeObj.scans) {
      const userHasScanned = codeObj.scans.some(s => s.username === username);
      if (userHasScanned) {
        return 0; // User already scanned this
      }
    }
    
    // Get total scan count (everyone combined)
    const totalScans = codeObj && codeObj.scans ? codeObj.scans.length : 0;
    
    if (totalScans === 0) return 5;      // 1st scan (anyone): 5 points
    if (totalScans === 1 || totalScans === 2) return 2.5; // 2nd & 3rd: 2.5 points
    if (totalScans >= 3 && totalScans <= 5) return 1;     // 4th, 5th, 6th: 1 point
    return 0; // More than 6 scans: 0 points
  }

  function addRebelCodeScan(codeword, username) {
    let code = rebelCodes.find(rc => rc.codeword === codeword);
    if (!code) {
      code = { codeword, scans: [] };
      rebelCodes.push(code);
    }
    if (!code.scans) code.scans = [];
    code.scans.push({ username, timestamp: Date.now() });
    db.ref('rebelCodes').set(rebelCodes);
  }

  function renderRebelCodesFound() {
    const container = document.getElementById('rebel-codes-found');
    if (!container) return;

    container.innerHTML = '';
    REBEL_TEACHERS.forEach((teacher, index) => {
      const code = rebelCodes.find(rc => rc.codeword === teacher.codeword);
      const scanCount = code && code.scans ? code.scans.length : 0;
      
      const box = document.createElement('div');
      box.className = 'rebel-code-box-found';
      box.innerHTML = `
        <div style="font-size:10px;opacity:0.9;margin-bottom:4px">Rogue Capybara #${index + 1}</div>
        <div style="font-size:10px;opacity:0.8;margin-top:4px">${scanCount} ${scanCount === 1 ? 'scan' : 'scans'}</div>
      `;
      container.appendChild(box);
    });
  }

  function renderHintButtons() {
    const container = document.getElementById('hints-buttons-container');
    if (!container) return;

    container.innerHTML = '';
    REBEL_TEACHERS.forEach(teacher => {
      // Only show if visible or if visibleHintTeachers is empty (show all by default)
      if (visibleHintTeachers.size === 0 || visibleHintTeachers.has(teacher.id)) {
        const button = document.createElement('button');
        button.className = 'hint-button';
        button.textContent = teacher.name;
        button.addEventListener('click', () => showTeacherHintModal(teacher));
        container.appendChild(button);
      }
    });
  }

  function showTeacherHintModal(teacher) {
    const modal = document.getElementById('teacher-hint-modal');
    if (!modal) return;

    const title = modal.querySelector('#teacher-hint-title');
    const content = modal.querySelector('#teacher-hint-content');
    const codeword = modal.querySelector('#teacher-hint-codeword');
    const closeBtn = modal.querySelector('#teacher-hint-close');

    title.textContent = teacher.name;
    content.innerHTML = '<ul style="margin:0;padding-left:20px">' + 
      teacher.hints.map(hint => `<li>${hint}</li>`).join('') + 
      '</ul>';
    codeword.textContent = `Codeword: ${teacher.codeword}`;

    modal.style.display = 'flex';

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  function renderAdminHintsVisibility() {
    const checklist = document.getElementById('admin-hints-visibility-checklist');
    if (!checklist) return;

    checklist.innerHTML = REBEL_TEACHERS.map(teacher => `
      <label>
        <input type="checkbox" class="hints-visibility-checkbox" data-teacher-id="${teacher.id}" ${visibleHintTeachers.has(teacher.id) ? 'checked' : ''} />
        ${teacher.name} - ${teacher.codeword}
      </label>
    `).join('');

    checklist.querySelectorAll('.hints-visibility-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const teacherId = parseInt(checkbox.getAttribute('data-teacher-id'));
        if (checkbox.checked) {
          visibleHintTeachers.add(teacherId);
        } else {
          visibleHintTeachers.delete(teacherId);
        }
        // Save to Firebase for cross-device sync
        const visibleArray = Array.from(visibleHintTeachers);
        db.ref('visibleHintTeachers').set(visibleArray);
        renderHintButtons();
      });
    });
  }

  function renderAdminRebelScans() {
    const container = document.getElementById('admin-rebel-scans-list');
    if (!container) return;

    let html = '';
    REBEL_TEACHERS.forEach((teacher, index) => {
      const code = rebelCodes.find(rc => rc.codeword === teacher.codeword);
      if (code && code.scans && code.scans.length > 0) {
        code.scans.forEach((scan, scanIndex) => {
          html += `
            <div style="padding:8px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
              <span>${teacher.codeword} - ${scan.username}</span>
              <button class="admin-rebel-scan-delete" data-codeword="${teacher.codeword}" data-scan-index="${scanIndex}" style="background:#d62828;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px">Remove</button>
            </div>
          `;
        });
      }
    });

    if (html === '') {
      html = '<div style="padding:12px;color:#999;text-align:center">No rebel scans yet</div>';
    }

    container.innerHTML = html;

    // Add event listeners for delete buttons
    container.querySelectorAll('.admin-rebel-scan-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isAdminSessionValid()) return;
        const codeword = btn.getAttribute('data-codeword');
        const scanIndex = parseInt(btn.getAttribute('data-scan-index'));
        
        const code = rebelCodes.find(rc => rc.codeword === codeword);
        if (code && code.scans) {
          code.scans.splice(scanIndex, 1);
          db.ref('rebelCodes').set(rebelCodes);
          renderAdminRebelScans();
          renderRebelCodesFound();
          renderLeaderboard();
        }
      });
    });
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
        html += `<div style="font-weight:bold;margin-bottom:8px" data-i18n="hintsCategory">${i18n.t('hintsCategory')} #${index}</div>`;
        hintsByCapy[index].forEach((hint, hintNum) => {
          const removeBtn = hintEditMode ? `<button class="hint-remove-btn" data-hint-id="${hint.timestamp}" style="float:right;background:#d62828;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : '';
          const isAdmin = hint.isAdmin;
          const adminLabel = isAdmin ? `<span style="color:#d62828;font-weight:bold;margin-left:8px">(from admin)</span>` : '';
          const userColor = isAdmin ? 'color:#d62828;font-weight:bold;' : 'color:#666;';
          html += `<div style="margin:8px 0;padding:8px;background:#f5f5f5;border-radius:4px;position:relative;">`;
          html += `${removeBtn}<div style="font-size:12px;${userColor}margin-bottom:4px">Hint ${hintNum + 1} by ${hint.username}${adminLabel}</div>`;
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
      // If visibleNames is empty, show all names by default
      if (visibleNames.size === 0) {
        leaderboard.forEach(e => visibleNames.add(e.name));
      } else {
        visibleNames.add(username);
      }
      // Save updated visibleNames to Firebase
      const visibleArray = Array.from(visibleNames);
      db.ref('visibleNames').set(visibleArray);
    }
    leaderboard.sort((a, b) => b.score - a.score);
    // Save to Firebase so it syncs across devices
    db.ref('leaderboard').set(leaderboard);
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

    // If visibleNames is empty (initial state), populate with all leaderboard names
    if (visibleNames.size === 0 && leaderboard.length > 0) {
      leaderboard.forEach(entry => visibleNames.add(entry.name));
    }

    checklist.innerHTML = leaderboard.map(entry => `
      <div style="display:flex;align-items:center;padding:6px;border-bottom:1px solid #eee;">
        <input type="checkbox" class="name-visibility-checkbox" data-name="${entry.name}" ${visibleNames.has(entry.name) ? 'checked' : ''} style="margin-right:8px;cursor:pointer;">
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
        // Save to Firebase for cross-device sync
        const visibleArray = Array.from(visibleNames);
        db.ref('visibleNames').set(visibleArray);
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

  // Rebel Capybara code entry
  const rebelCodeInput = document.getElementById('rebel-code-input');
  const addRebelCodeBtn = document.getElementById('add-rebel-code');

  if (rebelCodeInput && addRebelCodeBtn) {
    addRebelCodeBtn.addEventListener('click', () => {
      const code = rebelCodeInput.value.trim().toUpperCase();
      if (!code) {
        alert('Please enter a code');
        return;
      }

      if (!/^Rogue-[0-9A-Z]{4}$/i.test(code)) {
        alert('Invalid code format. Use format like: Rogue-4K2P');
        return;
      }

      const teacherId = indexForRebelCode(code);
      if (!teacherId) {
        alert('Invalid code. Please check and try again.');
        return;
      }

      const teacher = REBEL_TEACHERS.find(t => t.id === teacherId);
      const codeword = teacher.codeword;

      if (!currentUser) {
        showUserModal((user) => {
          if (user) {
            const points = getRebelCodePoints(codeword, user.name);
            if (points > 0) {
              addRebelCodeScan(codeword, user.name);
              updateLeaderboard(user.name, points);
              rebelCodeInput.value = '';
              renderRebelCodesFound();
              alert(`Correct! You earned ${points} points!`);
            } else {
              alert('You have already scanned this code or the code has been scanned 6+ times already. No more points available.');
            }
          }
        });
      } else {
        const points = getRebelCodePoints(codeword, currentUser.name);
        if (points > 0) {
          addRebelCodeScan(codeword, currentUser.name);
          updateLeaderboard(currentUser.name, points);
          rebelCodeInput.value = '';
          renderRebelCodesFound();
          alert(`Correct! You earned ${points} points!`);
        } else {
          alert('You have already scanned this code or the code has been scanned 6+ times already. No more points available.');
        }
      }
    });

    rebelCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addRebelCodeBtn.click();
      }
    });
  }

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

    db.ref('rebelCodes').on('value', (snapshot) => {
      if (snapshot.exists()) {
        rebelCodes = snapshot.val();
      } else {
        rebelCodes = [];
      }
      if (!isLoadingFromFirebase) {
        renderRebelCodesFound();
      }
    });

    db.ref('visibleHintTeachers').on('value', (snapshot) => {
      if (snapshot.exists()) {
        const visibleArray = snapshot.val();
        visibleHintTeachers = new Set(visibleArray);
      } else {
        visibleHintTeachers = new Set(REBEL_TEACHERS.map(t => t.id));
      }
      if (!isLoadingFromFirebase) {
        renderHintButtons();
      }
    });

    db.ref('visibleNames').on('value', (snapshot) => {
      if (snapshot.exists()) {
        const visibleArray = snapshot.val();
        visibleNames = new Set(visibleArray);
      } else {
        visibleNames = new Set();
      }
      if (!isLoadingFromFirebase) {
        renderLeaderboard();
        renderAdminChecklist();
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
      renderAdminHintsVisibility();
      renderAdminRebelScans();
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
      renderAdminHintsVisibility();
      renderAdminRebelScans();
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
      // Do not exit edit mode here; only close modal
      renderHints();
    }
  });

  // Admin buttons
    // Admin Add Hint UI
    const adminHintCapy = document.getElementById('admin-hint-capy');
    const adminHintText = document.getElementById('admin-hint-text');
    const adminHintSubmit = document.getElementById('admin-hint-submit');
    const adminHintError = document.getElementById('admin-hint-error');

    if (adminHintCapy) {
      // Populate dropdown 1-50
      adminHintCapy.innerHTML = Array.from({length: TOTAL}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('');
    }

    if (adminHintSubmit) {
      adminHintSubmit.addEventListener('click', () => {
        if (!isAdminSessionValid()) return;
        const capyIndex = parseInt(adminHintCapy.value);
        const text = adminHintText.value.trim();
        adminHintError.style.display = 'none';
        adminHintError.textContent = '';
        if (!text) {
          adminHintError.textContent = 'Please enter a hint';
          adminHintError.style.display = 'block';
          return;
        }
        // Optionally: profanity check for admin hints
        if (containsProfanity(text)) {
          adminHintError.textContent = i18n.t('inappropriateLanguage');
          adminHintError.style.display = 'block';
          return;
        }
        // Add admin hint
        const hint = {
          index: capyIndex,
          username: 'admin',
          text,
          timestamp: Date.now(),
          isAdmin: true
        };
        hints.push(hint);
        hints.sort((a, b) => b.timestamp - a.timestamp);
        db.ref('hints').set(hints);
        renderHints();
        adminHintText.value = '';
        adminHintError.textContent = 'Hint added!';
        adminHintError.style.color = '#4caf50';
        adminHintError.style.display = 'block';
        setTimeout(() => { adminHintError.style.display = 'none'; adminHintError.style.color = '#d62828'; }, 1200);
      });
    }
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
      rebelCodes = [];
      db.ref('redeems').set(redeems);
      db.ref('leaderboard').set(leaderboard);
      db.ref('hints').set(hints);
      db.ref('visibleNames').set([]);
      db.ref('rebelCodes').set(rebelCodes);
      renderGrid();
      updateDisplay();
      renderLeaderboard();
      renderHints();
      renderAdminChecklist();
      renderRebelCodesFound();
      alert(i18n.t('resetComplete'));
    }
  });

  // Admin Adjust Points
  const adjustPlayerSelect = document.getElementById('admin-adjust-player');
  const adjustMinus5 = document.getElementById('admin-adjust-minus5');
  const adjustMinus1 = document.getElementById('admin-adjust-minus1');
  const adjustPlus1 = document.getElementById('admin-adjust-plus1');
  const adjustPlus5 = document.getElementById('admin-adjust-plus5');

  function updateAdjustPlayerDropdown() {
    if (!adjustPlayerSelect) return;
    adjustPlayerSelect.innerHTML = '<option value="">-- Select Player --</option>';
    leaderboard.forEach(entry => {
      adjustPlayerSelect.innerHTML += `<option value="${entry.name}">${entry.name} (${entry.score} pts)</option>`;
    });
  }

  function adjustPlayerPoints(amount) {
    if (!isAdminSessionValid()) return;
    const playerName = adjustPlayerSelect.value;
    if (!playerName) {
      alert('Please select a player');
      return;
    }
    const player = leaderboard.find(e => e.name === playerName);
    if (player) {
      player.score += amount;
      leaderboard.sort((a, b) => b.score - a.score);
      db.ref('leaderboard').set(leaderboard);
      renderLeaderboard();
      updateAdjustPlayerDropdown();
    }
  }

  if (adjustMinus5) adjustMinus5.addEventListener('click', () => adjustPlayerPoints(-5));
  if (adjustMinus1) adjustMinus1.addEventListener('click', () => adjustPlayerPoints(-1));
  if (adjustPlus1) adjustPlus1.addEventListener('click', () => adjustPlayerPoints(1));
  if (adjustPlus5) adjustPlus5.addEventListener('click', () => adjustPlayerPoints(5));

  // Update adjust player dropdown when admin modal is opened
  const originalUnlockClick = unlockBtn.onclick;
  unlockBtn.addEventListener('click', () => {
    setTimeout(() => {
      updateAdjustPlayerDropdown();
    }, 100);
  });

  // Admin Generate Rebel Codes Button
  const generateRebelCodesBtn = document.getElementById('admin-generate-rebel-codes');
  const rebelCodesDisplay = document.getElementById('admin-rebel-codes-display');

  if (generateRebelCodesBtn) {
    generateRebelCodesBtn.addEventListener('click', () => {
      if (!isAdminSessionValid()) return;
      
      let displayHTML = '';
      REBEL_TEACHERS.forEach((teacher) => {
        displayHTML += `<div style="margin-bottom:8px;padding:8px;background:#d62828;color:white;border-radius:4px;font-family:monospace;font-size:12px;text-align:center;">
          ${teacher.code}
          <div style="font-size:10px;opacity:0.9;margin-top:4px">${teacher.name} - ${teacher.codeword}</div>
        </div>`;
      });
      
      if (rebelCodesDisplay) {
        rebelCodesDisplay.innerHTML = displayHTML;
      }
    });
  }

  // Admin Print Rebel Codes Button
  const printRebelCodesBtn = document.getElementById('admin-print-rebel-codes-btn');

  if (printRebelCodesBtn) {
    printRebelCodesBtn.addEventListener('click', () => {
      if (!isAdminSessionValid()) return;
      downloadRebelCodesPDF();
    });
  }

  function downloadRebelCodesPDF() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Rogue Capybara Codes</title>
  <style>
    body { margin: 0; padding: 8mm; font-family: Arial, sans-serif; background: white; }
    .code-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .code-item { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      padding: 12px; 
      border: 2px solid #d62828; 
      border-radius: 6px;
      background: white;
    }
    .code-label { 
      font-size: 9px; 
      font-weight: bold;
      color: #333;
      margin-bottom: 6px;
      text-align: center;
    }
    .code-text { 
      font-size: 12px; 
      font-weight: bold; 
      font-family: monospace;
      color: #d62828;
      text-align: center;
    }
    .teacher-info { 
      font-size: 8px; 
      font-weight: bold; 
      margin-top: 6px; 
      color: #666;
      text-align: center;
    }
    @media print { 
      body { margin: 4mm; padding: 2mm; } 
      .code-grid { gap: 6px; } 
      .code-item { padding: 10px; }
    }
  </style>
</head>
<body>
  <h1 style="text-align:center;font-size:20px;margin-bottom:20px">Rogue Capybara Codes</h1>
  <div class="code-grid" id="codes"><\/div>
  <script>
    const teachers = ${JSON.stringify(REBEL_TEACHERS)};
    const container = document.getElementById('codes');
    teachers.forEach(teacher => {
      const div = document.createElement('div');
      div.className = 'code-item';
      div.innerHTML = '<div class="code-label">Rogue Capybara #' + teacher.id + '<\/div>' +
                      '<div class="code-text">' + teacher.code + '<\/div>' +
                      '<div class="teacher-info">' + teacher.codeword + '<\/div>';
      container.appendChild(div);
    });
    setTimeout(() => { window.print(); }, 500);
  <\/script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  // Render hints visibility checklist when admin modal opens
  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.style.display = 'none';
      renderHints();
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
  renderRebelCodesFound();
  renderHintButtons();
  renderAdminHintsVisibility();

  // Update i18n on page load
  i18n.updateDOM();
});
