// Internationalization (i18n) system
const i18nStrings = {
  en: {
        hintsSection: 'Hints',
      hintsCategory: 'Capybara',
    // Header
    title: 'Capybara Hunt',
    intro1: 'Hidden inside the school, there are 50 tiny capybaras. Your goal is to find the most amount of them.',
    intro2: 'When you find one, enter its code into this website\'s code box below.',
    
    // Rules section
    rulesTitle: 'Rules:',
    rule1: 'Objects do not need to be broken to find a Capy.',
    rule2: 'Capys are not inside of classrooms; do not disturb them.',
    rule3: 'Moving of Capys or their code will get you eliminated.',
    rule4: 'A Capy\'s code cannot be entered more than once per player.',
    rule5: 'You can work together in teams.',
    
    // Scoring
    scoringTitle: 'Scoring:',
    scoring1: 'Each capybara is worth 1 point at first scan; after that, its worth drops to 0.5.',
    scoring2: 'Out of the 100, there is a golden one worth 10 points, but after being scanned, its worth drops to 1.',
    scoring3: 'Once all Capys are found or it reaches the 20th, the event is over.',
    
    happyHunting: 'Happy Hunting. 💕',
    
    remaining: 'remaining',
    
    // Admin
    adminTitle: 'Admin',
    download: 'Download',
    reset: 'Reset',
    unlock: 'Unlock',
    
    // About
    about: 'About',
    aboutText: '← This is what you\'re looking for!',
    
    // Modals
    adminPassword: 'Admin Password',
    enterPassword: 'Enter password',
    submit: 'Submit',
    cancel: 'Cancel',
    
    // User registration
    enterName: 'Enter Your Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    schoolEmail: 'School Email',
    emailPlaceholder: 'your.name@lrsd.net',
    emailRequired: 'School email is required (@lrsd.net)',
    invalidEmail: 'Email must end with @lrsd.net',
    nameRequired: 'First and last name are required',
    skip: 'Skip',
    
    // Main sections
    enterCode: 'Enter Code',
    codePlaceholder: 'e.g., CP-1A2B',
    add: 'Add',
    recent: 'Recent',
    capasToFind: 'Capas to Find',
    leaderboard: 'Leaderboard',
    
    // Messages
    invalidCodeFormat: 'Invalid code format',
    codeNotFound: 'Code not found',
    alreadyFound: 'you already found Capybara #',
    wrongPassword: 'Wrong password',
    resetConfirm: 'Reset all found capybaras?',
    resetComplete: 'Reset complete',
    inappropriateLanguage: 'Please use appropriate language',
    
    // Messages
    invalidCodeFormat: 'Invalid code format',
    codeNotFound: 'Code not found',
    alreadyFound: 'you already found Capybara #',
    wrongPassword: 'Wrong password',
    resetConfirm: 'Reset all found capybaras?',
    resetComplete: 'Reset complete',
    inappropriateLanguage: 'Please use appropriate language',
    
    // Admin modal
    manageLeaderboard: 'Manage Leaderboard',
    removeMessage: 'Click the X to remove a player',
    
    // Hint system
    leaveHint: 'Leave a Hint',
    hintHelp: 'Help others find this capybara!',
    hintPlaceholder: 'Enter your hint here...',
    submitHint: 'Submit Hint',
    leaveHintQuestion: 'Would you like to leave a hint for this capybara?',
  },
  fr: {
        hintsSection: 'Indices',
      hintsCategory: 'Capybara',
    // Header
    title: 'Chasse aux Capybaras',
    intro1: 'Caché à l\'intérieur de l\'école, il y a 50 petits capybaras. Votre objectif est d\'en trouver le plus possible.',
    intro2: 'Quand vous en trouvez un, entrez son code dans la boîte de code du site ci-dessous.',
    
    // Rules section
    rulesTitle: 'Règles :',
    rule1: 'Les objets n\'ont pas besoin d\'être cassés pour trouver une Capy.',
    rule2: 'Les Capys ne sont pas à l\'intérieur des salles de classe; ne les dérangez pas.',
    rule3: 'Le déplacement de Capys ou de leur code vous fera éliminer.',
    rule4: 'Le code d\'une Capy ne peut pas être entré plus d\'une fois par joueur.',
    rule5: 'Vous pouvez travailler ensemble en équipes.',
    
    // Scoring
    scoringTitle: 'Notation :',
    scoring1: 'Chaque capybara vaut 1 point à la première analyse; après cela, sa valeur tombe à 0,5.',
    scoring2: 'Sur les 100, il y en a une dorée qui vaut 10 points, mais après avoir été scannée, sa valeur est réduite à 1.',
    scoring3: 'Une fois que tous les Capys sont trouvés ou qu\'on atteint le 20e, l\'événement est terminé.',
    
    happyHunting: 'Bonne chasse. 💕',
    
    remaining: 'restant',
    
    // Admin
    adminTitle: 'Admin',
    download: 'Télécharger',
    reset: 'Réinitialiser',
    unlock: 'Déverrouiller',
    
    // About
    about: 'À propos',
    aboutText: '← C\'est ce que vous cherchez !',
    
    // Modals
    adminPassword: 'Mot de passe administrateur',
    enterPassword: 'Entrez le mot de passe',
    submit: 'Soumettre',
    cancel: 'Annuler',
    
    // User registration
    enterName: 'Entrez Vos Informations',
    firstName: 'Prénom',
    lastName: 'Nom',
    schoolEmail: 'Email Scolaire',
    emailPlaceholder: 'votre.nom@lrsd.net',
    emailRequired: 'L\'email scolaire est requis (@lrsd.net)',
    invalidEmail: 'L\'email doit se terminer par @lrsd.net',
    nameRequired: 'Le prénom et le nom de famille sont requis',
    skip: 'Sauter',
    
    // Main sections
    enterCode: 'Entrer le Code',
    codePlaceholder: 'e.g., CP-1A2B',
    add: 'Ajouter',
    recent: 'Récent',
    capasToFind: 'Capas à Trouver',
    leaderboard: 'Classement',
    
    // Messages
    invalidCodeFormat: 'Format de code invalide',
    codeNotFound: 'Code non trouvé',
    alreadyFound: 'vous avez déjà trouvé Capybara #',
    wrongPassword: 'Mauvais mot de passe',
    resetConfirm: 'Réinitialiser tous les capybaras trouvés?',
    resetComplete: 'Réinitialisation terminée',
    inappropriateLanguage: 'Veuillez utiliser un langage approprié',
    
    // Admin modal
    manageLeaderboard: 'Gérer le Classement',
    removeMessage: 'Cliquez sur le X pour supprimer un joueur',
    
    // Hint system
    leaveHint: 'Laisser un indice',
    hintHelp: 'Aidez les autres à trouver ce capybara!',
    hintPlaceholder: 'Entrez votre indice ici...',
    submitHint: 'Soumettre l\'indice',
    leaveHintQuestion: 'Voulez-vous laisser un indice pour ce capybara?',
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('capy-lang') || 'en';
  }
  
  t(key) {
    return i18nStrings[this.currentLang][key] || i18nStrings['en'][key] || key;
  }
  
  setLanguage(lang) {
    if (['en', 'fr'].includes(lang)) {
      this.currentLang = lang;
      localStorage.setItem('capy-lang', lang);
      this.updateDOM();
    }
  }
  
  getLanguage() {
    return this.currentLang;
  }
  
  updateDOM() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.hasAttribute('data-i18n-placeholder')) {
        el.placeholder = this.t(key);
      } else {
        el.textContent = this.t(key);
      }
    });
    
    // Fire custom event for components to update
    document.dispatchEvent(new CustomEvent('i18n-changed', { detail: { lang: this.currentLang } }));
  }
}

// Global i18n instance
const i18n = new I18n();
