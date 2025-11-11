# Guide de Démarrage Rapide - Module Reporting

## 🚀 Installation et Configuration

### Prérequis
Le module Reporting utilise les tables suivantes dans Supabase :
- `clients`
- `suppliers`
- `invoices`
- `quotes`
- `purchase_orders`

Assurez-vous que ces tables existent dans votre base de données.

## 📱 Utilisation

### 1. Accéder au module
1. Ouvrez l'application
2. Dans le menu latéral, cliquez sur **"Pilotage"** (icône analytics)

### 2. Générer un rapport client
1. Sur l'écran principal du Reporting :
   - Le type **"Clients"** est sélectionné par défaut
2. Ouvrez la liste déroulante **"Sélectionner un client"**
3. Choisissez un client dans la liste
4. Cliquez sur **"Voir les transactions"**
5. Le rapport détaillé s'affiche avec :
   - Statistiques (nombre de transactions, total, payé, impayé)
   - Liste complète des transactions (factures et devis)

### 3. Générer un rapport fournisseur
1. Sur l'écran principal du Reporting :
   - Cliquez sur le bouton **"Fournisseurs"**
2. Ouvrez la liste déroulante **"Sélectionner un fournisseur"**
3. Choisissez un fournisseur dans la liste
4. Cliquez sur **"Voir les transactions"**
5. Le rapport détaillé s'affiche avec :
   - Statistiques (nombre de transactions, total, payé, impayé)
   - Liste complète des bons de commande

### 4. Navigation
- **Bouton retour** : Retourne à l'écran de sélection
- **Pull to refresh** : Actualise les données
- **Scroll** : Navigue dans la liste des transactions

## 🎨 Interface

### Écran de sélection
```
┌─────────────────────────────────────┐
│  📊 Reporting                       │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐       │
│  │ Clients  │  │Fournisseu│       │
│  │  (actif) │  │   rs     │       │
│  └──────────┘  └──────────┘       │
├─────────────────────────────────────┤
│  Sélectionner un client            │
│  ┌─────────────────────────────┐  │
│  │ -- Choisir --          ▼    │  │
│  └─────────────────────────────┘  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐  │
│  │  📄 Voir les transactions   │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Écran de rapport
```
┌─────────────────────────────────────┐
│ ← Rapport Client                    │
│   Client XYZ                        │
├─────────────────────────────────────┤
│  ┌──────┐  ┌──────┐               │
│  │  📄  │  │  💰  │               │
│  │  25  │  │50000 │               │
│  └──────┘  └──────┘               │
│  ┌──────┐  ┌──────┐               │
│  │  ✅  │  │  ⚠️  │               │
│  │40000 │  │10000 │               │
│  └──────┘  └──────┘               │
├─────────────────────────────────────┤
│  Historique des transactions        │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ Facture                      │  │
│  │ F-2025-001      5000 DH      │  │
│  │ 10 novembre 2025    [Payé]   │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ Devis                        │  │
│  │ D-2025-005      3000 DH      │  │
│  │ 8 novembre 2025  [Brouillon] │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 🎯 Codes de statut

### Clients (Factures/Devis)
- 🟢 **Payé** : Transaction entièrement réglée
- 🟠 **En attente** : En cours de traitement
- ⚪ **Brouillon** : Non finalisé

### Fournisseurs (Bons de commande)
- 🟢 **Payé/Reçu** : Transaction complétée
- 🟠 **Commandé/En attente** : En cours
- ⚪ **Brouillon** : Non finalisé

## 📊 Statistiques affichées

Pour chaque client/fournisseur :
1. **Nombre de transactions** : Total des documents
2. **Montant total** : Somme de toutes les transactions
3. **Montant payé** : Somme des transactions réglées
4. **Montant impayé** : Différence entre total et payé

## 🔄 Actualisation des données

- **Automatique** : Au chargement de l'écran
- **Manuel** : Glissez vers le bas (pull to refresh)
- **Navigation** : Les données se rechargent au retour depuis un autre écran

## ⚠️ Messages d'erreur courants

### "Veuillez sélectionner un client/fournisseur"
➡️ Vous devez choisir une entité dans la liste déroulante avant de cliquer sur "Voir les transactions"

### "Aucune transaction trouvée"
➡️ Le client/fournisseur sélectionné n'a pas encore de transactions enregistrées

### Erreur de chargement
➡️ Vérifiez votre connexion Internet et que Supabase est bien configuré

## 💡 Conseils d'utilisation

1. **Utilisez le pull to refresh** pour obtenir les données les plus récentes
2. **Les transactions sont triées par date** (plus récente en premier)
3. **Les couleurs des statuts** facilitent l'identification rapide
4. **La barre de gauche colorée** sur chaque transaction indique visuellement le statut

## 🔧 Dépannage

### Les clients/fournisseurs n'apparaissent pas dans la liste
1. Vérifiez que des clients/fournisseurs sont créés dans le module Administration
2. Vérifiez la connexion à Supabase
3. Consultez les logs pour les erreurs

### Les transactions ne s'affichent pas
1. Vérifiez que des factures/devis/bons de commande sont créés
2. Assurez-vous que le client_id/supplier_id est correctement lié
3. Vérifiez les permissions Supabase

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation complète dans `REPORTING_MODULE.md`
2. Vérifiez les logs de l'application
3. Contactez l'équipe de développement
