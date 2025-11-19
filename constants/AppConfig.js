export const translations = {
  fr: {
    // General
    welcome: 'Bienvenue',
    guest: 'Invité',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    dashboard: 'Tableau de bord',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    success: 'Succès',
    error: 'Erreur',
    requiredField: 'Ce champ est requis.',

    // Modules
    companySettings: 'Paramétrage Société',
    administration: 'Administration',
    purchases: 'Achat',
    sales: 'Vente',
    stock: 'Stock',
    finance: 'Finance',
    reporting: 'Pilotage',
    appSettings: 'Paramètres App',

    // Sub-modules & Screens
    companyInfo: 'Informations Société',
    employees: 'Employés',
    vehicles: 'Véhicules',
    banks: 'Banques',
    paymentMethods: 'Modes de Paiement',
    clients: 'Clients',
    suppliers: 'Fournisseurs',
    articles: 'Articles',
    itemFamilies: 'Familles d\'Articles',
    invoices: 'Factures',
    quotes: 'Devis',
    deliveryNotes: 'Bons de Livraison',
    purchaseOrders: 'Commandes Fournisseurs',
    goodsReceipts: 'Bons de Réception',
    warehouses: 'Dépôts',
    stockMovements: 'Mouvements de Stock',

    // Actions & Labels
    createInvoice: 'Créer une Facture',
    createClient: 'Créer un Client',
    createQuote: 'Créer un Devis',
    createSupplier: 'Créer un Fournisseur',
    createArticle: 'Créer un Article',
    switchTheme: 'Changer de Thème',
    switchLanguage: 'Changer de Langue',
    clientName: 'Nom du client',
    supplierName: 'Nom du fournisseur',
    itemName: 'Nom de l\'article',
    reference: 'Référence',
    raisonSociale: 'Raison Sociale',
    matriculeFiscale: 'Matricule Fiscale',
    address: 'Adresse',
    
    // Invoice specific
    invoiceNumber: 'Numéro de Facture',
    paymentMethod: 'Mode de Paiement',
    issueDate: 'Date d\'Émission',
    dueDate: 'Date d\'Échéance',
    client: 'Client',
    lineItems: 'Lignes de Facturation',
    article: 'Article',
    description: 'Description',
    enterDescription: 'Saisir la description de l\'article',
    quantity: 'Quantité',
    unitPrice: 'Prix Unitaire',
    addItem: 'Ajouter un Article',
    summary: 'Résumé',
    saveInvoice: 'Enregistrer la Facture',
    
    // Messages & Alerts
    errorFetchingClients: 'Erreur lors du chargement des clients',
    pleaseSelectClient: 'Veuillez sélectionner un client et entrer un numéro de facture',
    errorCreatingInvoice: 'Erreur lors de la création de la facture',
    invoiceCreated: 'Facture créée !',
    fillAllFields: 'Veuillez remplir tous les champs',
    loginError: 'Erreur de connexion',
    unexpectedError: 'Une erreur inattendue est survenue',
    userAlreadyExists: 'L\'utilisateur existe déjà !',
    use: 'Utilisez',
    email: 'Email',
    password: 'Mot de passe',
    userCreated: 'Utilisateur créé !',
    loadingDashboard: 'Impossible de charger les statistiques du tableau de bord',
    clientUpdated: 'Client mis à jour',
    clientDeleted: 'Client supprimé',
    confirmDelete: 'Confirmer la suppression',
    areYouSure: 'Êtes-vous sûr de vouloir supprimer',
    articleDeleted: 'Article supprimé avec succès !',
    articleNameRequired: 'Le nom de l\'article est requis',
    articleCreated: 'Article créé avec succès !',
    articleUpdated: 'Article mis à jour avec succès !',
    enterValidQuantity: 'Veuillez entrer une quantité valide',
    stockCannotBeNegative: 'Le stock ne peut pas être négatif',
    stockUpdated: 'Stock mis à jour avec succès !',
    infoSaved: 'Informations enregistrées',
  },
};

// --- MODERN 3D THEME WITH THREE.JS INSPIRED AESTHETICS ---
export const themes = {
  light: {
    // Base colors
    background: '#F0F2F5', // Soft light gray
    backgroundGradient: ['#F0F2F5', '#E8EBF0'], // Subtle gradient
    card: '#FFFFFF',
    cardGlass: 'rgba(255, 255, 255, 0.85)', // Glassmorphism
    text: '#0F172A', // Deep slate
    textSecondary: '#64748B', // Slate gray
    
    // Primary palette with 3D depth
    primary: '#6366F1', // Vibrant indigo
    primaryLight: '#818CF8', // Light indigo
    primaryDark: '#4F46E5', // Deep indigo
    primaryGradient: ['#6366F1', '#8B5CF6'], // Indigo to purple gradient
    primarySoft: '#EEF2FF', // Very light indigo
    primaryGlow: 'rgba(99, 102, 241, 0.3)', // Glow effect
    
    // Accent colors
    accent: '#8B5CF6', // Purple accent
    accentLight: '#A78BFA',
    accentGradient: ['#8B5CF6', '#EC4899'], // Purple to pink
    
    // Semantic colors with depth
    success: '#10B981', // Emerald
    successLight: '#34D399',
    successGradient: ['#10B981', '#059669'],
    successGlow: 'rgba(16, 185, 129, 0.2)',
    
    warning: '#F59E0B', // Amber
    warningLight: '#FBBF24',
    warningGradient: ['#F59E0B', '#EF4444'],
    
    danger: '#EF4444', // Red
    dangerLight: '#F87171',
    dangerGradient: ['#EF4444', '#DC2626'],
    dangerGlow: 'rgba(239, 68, 68, 0.2)',
    
    info: '#06B6D4', // Cyan
    infoLight: '#22D3EE',
    infoGradient: ['#06B6D4', '#0891B2'],
    
    // UI elements
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: 'rgba(0, 0, 0, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Shadows for 3D depth
    shadow: {
      small: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
      large: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
      glow: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
      },
    },
    
    // Button colors
    buttonText: '#FFFFFF',
    buttonShadow: 'rgba(99, 102, 241, 0.4)',
    
    // Sidebar
    sidebarBackground: '#0F172A',
    sidebarBackgroundGradient: ['#0F172A', '#1E293B'],
    sidebarText: '#E2E8F0',
    sidebarTextSecondary: '#94A3B8',
    sidebarActiveBackground: '#6366F1',
    sidebarActiveGradient: ['#6366F1', '#8B5CF6'],
    sidebarActiveText: '#FFFFFF',
    sidebarHover: 'rgba(99, 102, 241, 0.1)',
    
    // Special effects
    shimmer: 'rgba(255, 255, 255, 0.6)',
    ripple: 'rgba(99, 102, 241, 0.2)',
    blur: 20, // Blur radius for glassmorphism
  },
  dark: {
    // Base colors
    background: '#0F172A', // Deep slate
    backgroundGradient: ['#0F172A', '#1E293B'], // Dark gradient
    card: '#1E293B',
    cardGlass: 'rgba(30, 41, 59, 0.85)', // Dark glassmorphism
    text: '#F1F5F9', // Light slate
    textSecondary: '#94A3B8', // Slate
    
    // Primary palette with 3D depth
    primary: '#818CF8', // Bright indigo
    primaryLight: '#A5B4FC', // Very light indigo
    primaryDark: '#6366F1', // Standard indigo
    primaryGradient: ['#818CF8', '#A78BFA'], // Indigo to purple gradient
    primarySoft: '#312E81', // Deep indigo
    primaryGlow: 'rgba(129, 140, 248, 0.4)', // Stronger glow for dark
    
    // Accent colors
    accent: '#A78BFA', // Light purple
    accentLight: '#C4B5FD',
    accentGradient: ['#A78BFA', '#F472B6'], // Purple to pink
    
    // Semantic colors with depth
    success: '#34D399', // Light emerald
    successLight: '#6EE7B7',
    successGradient: ['#34D399', '#10B981'],
    successGlow: 'rgba(52, 211, 153, 0.3)',
    
    warning: '#FBBF24', // Light amber
    warningLight: '#FCD34D',
    warningGradient: ['#FBBF24', '#F59E0B'],
    
    danger: '#F87171', // Light red
    dangerLight: '#FCA5A5',
    dangerGradient: ['#F87171', '#EF4444'],
    dangerGlow: 'rgba(248, 113, 113, 0.3)',
    
    info: '#22D3EE', // Light cyan
    infoLight: '#67E8F9',
    infoGradient: ['#22D3EE', '#06B6D4'],
    
    // UI elements
    border: '#334155',
    borderLight: '#475569',
    divider: 'rgba(255, 255, 255, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Shadows for 3D depth (lighter for dark mode)
    shadow: {
      small: {
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      },
      large: {
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      },
      glow: {
        shadowColor: '#818CF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 12,
      },
    },
    
    // Button colors
    buttonText: '#FFFFFF',
    buttonShadow: 'rgba(129, 140, 248, 0.5)',
    
    // Sidebar
    sidebarBackground: '#0F172A',
    sidebarBackgroundGradient: ['#0F172A', '#1E293B'],
    sidebarText: '#E2E8F0',
    sidebarTextSecondary: '#94A3B8',
    sidebarActiveBackground: '#818CF8',
    sidebarActiveGradient: ['#818CF8', '#A78BFA'],
    sidebarActiveText: '#0F172A',
    sidebarHover: 'rgba(129, 140, 248, 0.15)',
    
    // Special effects
    shimmer: 'rgba(255, 255, 255, 0.15)',
    ripple: 'rgba(129, 140, 248, 0.3)',
    blur: 20, // Blur radius for glassmorphism
  },
};