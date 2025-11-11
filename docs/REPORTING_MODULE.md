# Module de Reporting

## Description
Le module de Reporting permet de générer des rapports détaillés sur les transactions des clients et des fournisseurs. Il offre une vue d'ensemble des activités commerciales et financières de l'entreprise.

## Fonctionnalités

### 1. Sélection de type de rapport
- **Clients** : Affiche les transactions avec les clients (factures, devis)
- **Fournisseurs** : Affiche les transactions avec les fournisseurs (bons de commande)

### 2. Sélection d'entité
- Liste déroulante des clients ou fournisseurs selon le type sélectionné
- Recherche facilitée dans la liste

### 3. Rapport Client
- **Statistiques globales** :
  - Nombre total de transactions
  - Montant total des transactions
  - Montant payé
  - Montant impayé

- **Liste des transactions** :
  - Factures avec leur statut (payé, en attente, brouillon)
  - Devis avec leur statut
  - Date de création
  - Référence du document
  - Montant
  - Description

### 4. Rapport Fournisseur
- **Statistiques globales** :
  - Nombre total de transactions
  - Montant total des achats
  - Montant payé/reçu
  - Montant impayé

- **Liste des transactions** :
  - Bons de commande avec leur statut
  - Date de création
  - Référence du document
  - Montant
  - Description

## Navigation

### Structure des écrans
```
Pilotage (ReportingScreen)
├── ClientReport (ClientReportScreen)
└── SupplierReport (SupplierReportScreen)
```

### Accès au module
1. Cliquer sur **"Pilotage"** dans le menu latéral
2. Sélectionner le type de rapport (Client ou Fournisseur)
3. Choisir une entité dans la liste déroulante
4. Cliquer sur **"Voir les transactions"**

## Fichiers créés

### Contexte
- `context/ReportingContext.js` - Gère l'état du module de reporting

### Écrans
- `screens/Reporting/ReportingScreen.js` - Écran de sélection
- `screens/Reporting/ClientReportScreen.js` - Rapport détaillé client
- `screens/Reporting/SupplierReportScreen.js` - Rapport détaillé fournisseur

### Navigation
- `navigation/stacks/ReportingStack.js` - Stack de navigation du module

## Intégration

### 1. Mise à jour de App.js
Le `ReportingProvider` a été ajouté pour gérer l'état global du module.

### 2. Mise à jour de AppNavigator.js
Le `ReportingStack` a été intégré dans le système de navigation principal.

### 3. Menu latéral
Le menu "Pilotage" avec l'icône `analytics-outline` donne accès au module.

## Sources de données

### Tables Supabase utilisées
- **clients** : Liste des clients
- **suppliers** : Liste des fournisseurs
- **invoices** : Factures clients
- **quotes** : Devis clients
- **purchase_orders** : Bons de commande fournisseurs

## Statuts des transactions

### Pour les clients
- **paid** : Payé (vert)
- **pending** : En attente (orange)
- **draft** : Brouillon (gris)

### Pour les fournisseurs
- **paid** : Payé (vert)
- **received** : Reçu (vert)
- **ordered** : Commandé (orange)
- **pending** : En attente (orange)
- **draft** : Brouillon (gris)

## Améliorations futures possibles

1. **Filtres avancés** :
   - Filtrer par période (date de début/fin)
   - Filtrer par statut
   - Filtrer par montant min/max

2. **Export de données** :
   - Export PDF
   - Export Excel
   - Partage par email

3. **Graphiques** :
   - Évolution des transactions dans le temps
   - Répartition par statut (graphique en camembert)
   - Comparaison client/fournisseur

4. **Analyses avancées** :
   - Clients les plus rentables
   - Fournisseurs les plus sollicités
   - Délai moyen de paiement
   - Taux de conversion devis → factures

5. **Notifications** :
   - Alertes pour les paiements en retard
   - Rappels automatiques

## Support
Pour toute question ou problème, consultez la documentation principale ou contactez l'équipe de développement.
