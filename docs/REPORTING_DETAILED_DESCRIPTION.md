# 📊 Module Reporting - Améliorations Complètes

## 🎯 Objectif
Afficher TOUTES les transactions liées au client/fournisseur sélectionné avec des calculs précis des sommes encaissées et restantes.

---

## ✅ Améliorations Apportées

### 1. **Types de Transactions Affichées**

#### Pour les CLIENTS (ClientReportScreen)
✅ **Factures** - Montants à recevoir  
✅ **Devis** - Montants en négociation  
✅ **Retenues à la source** - Montants retenus par le client (TVA, etc.)  
✅ **Paiements reçus** - Encaissements effectués  
✅ **Chèques reçus** - Chèques du client (en attente, déposés, encaissés)

#### Pour les FOURNISSEURS (SupplierReportScreen)
✅ **Bons de commande** - Montants à payer  
✅ **Retenues à la source** - Montants retenus sur paiements  
✅ **Paiements effectués** - Décaissements réalisés  
✅ **Chèques émis** - Chèques remis au fournisseur

---

## 📊 Calculs des Statistiques

### Pour les CLIENTS

#### 📌 Total Factures
```javascript
= Somme des factures (statut ≠ draft et ≠ cancelled)
```
Représente le montant total que le client doit payer.

#### 💰 Encaissé
```javascript
= Paiements reçus (status = received ou paid)
+ Chèques encaissés (status = encashed)
+ Retenues à la source (status = received)
```
Représente ce que nous avons effectivement reçu.

#### ⏰ Reste à Encaisser
```javascript
= Total Factures - Encaissé
```
Représente ce qui reste à recevoir du client.

---

### Pour les FOURNISSEURS

#### 📌 Total Commandes
```javascript
= Somme des bons de commande (statut ≠ draft et ≠ cancelled)
```
Représente le montant total que nous devons payer.

#### 💰 Décaissé
```javascript
= Paiements effectués (status = paid ou approved)
+ Chèques encaissés par le fournisseur (status = encashed)
+ Retenues à la source (status = paid)
```
Représente ce que nous avons effectivement payé.

#### ⏰ Reste à Payer
```javascript
= Total Commandes - Décaissé
```
Représente ce qui reste à payer au fournisseur.

---

## 🎨 Statuts Supportés

### Codes Couleur

| Statut | Couleur | Signification |
|--------|---------|---------------|
| **Payé / Reçu / Encaissé / Approuvé** | 🟢 Vert | Transaction complétée |
| **En attente / Commandé / Déposé** | 🟠 Orange | En cours de traitement |
| **Brouillon / Annulé** | ⚪ Gris | Non actif |
| **Impayé / Rejeté** | 🔴 Rouge | Problème |

### Liste Complète des Statuts

#### Statuts Positifs (Vert)
- `paid` → Payé
- `received` → Reçu
- `encashed` → Encaissé
- `approved` → Approuvé

#### Statuts Intermédiaires (Orange)
- `pending` → En attente
- `ordered` → Commandé
- `deposited` → Déposé
- `partial` → Partiel

#### Statuts Neutres (Gris)
- `draft` → Brouillon
- `cancelled` → Annulé

#### Statuts Négatifs (Rouge)
- `bounced` → Impayé (chèque sans provision)
- `overdue` → En retard
- `rejected` → Rejeté

---

## 📋 Tables Supabase Utilisées

### Clients
```
✅ invoices              (Factures)
✅ quotes                (Devis)
✅ client_returns        (Retenues à la source)
✅ client_payment_orders (Paiements reçus)
✅ checks                (Chèques - type 'received')
```

### Fournisseurs
```
✅ purchase_orders          (Bons de commande)
✅ supplier_returns         (Retenues à la source)
✅ supplier_payment_orders  (Paiements effectués)
✅ checks                   (Chèques - type 'issued')
```

---

## 🔍 Format des Transactions

Chaque transaction affiche :

```
┌─────────────────────────────────────┐
│ Type de transaction                 │
│ Référence                           │  Montant
│ Date                                │  [Statut]
│ Description                         │
└─────────────────────────────────────┘
```

### Exemple pour un Client
```
📄 Facture
F-2025-001                      5,000.00 DH
10 novembre 2025                [Payé] 🟢
Facture de vente

💳 Paiement
PAY-001                         3,000.00 DH
9 novembre 2025                 [Reçu] 🟢
Virement bancaire

📋 Retenue à la source
F-2025-001                        75.00 DH
10 novembre 2025                [Reçu] 🟢
Retenue 1.5% - TVA

💵 Chèque
CHK-123456                      2,000.00 DH
8 novembre 2025                 [En attente] 🟠
BNA - Échéance: 15/11/2025
```

---

## 💡 Logique de Calcul

### Principe
1. **Montants à recevoir/payer** = Factures ou Commandes validées
2. **Montants encaissés/décaissés** = Paiements + Chèques encaissés + Retenues
3. **Reste** = À recevoir/payer - Encaissé/Décaissé

### Exemple Client
```
Factures validées:
  F-001: 5,000 DH [paid]
  F-002: 3,000 DH [pending]
  F-003: 2,000 DH [draft]      ← Non comptée
  ─────────────────────────
  Total Factures: 8,000 DH

Encaissements:
  Paiement: 3,000 DH [received]
  Chèque: 2,000 DH [encashed]
  Retenue: 120 DH [received]
  ─────────────────────────
  Total Encaissé: 5,120 DH

Calcul:
  Reste à Encaisser = 8,000 - 5,120 = 2,880 DH
```

### Exemple Fournisseur
```
Commandes validées:
  BC-001: 10,000 DH [received]
  BC-002: 5,000 DH [ordered]
  BC-003: 3,000 DH [draft]     ← Non comptée
  ─────────────────────────
  Total Commandes: 15,000 DH

Décaissements:
  Paiement: 7,000 DH [paid]
  Chèque: 3,000 DH [encashed]
  Retenue: 150 DH [paid]
  ─────────────────────────
  Total Décaissé: 10,150 DH

Calcul:
  Reste à Payer = 15,000 - 10,150 = 4,850 DH
```

---

## 🎯 Avantages

### Pour l'utilisateur
✅ **Vue complète** - Toutes les transactions en un seul endroit  
✅ **Calculs précis** - Montants exacts encaissés et restants  
✅ **Statuts clairs** - Codes couleur pour identification rapide  
✅ **Détails complets** - Descriptions, dates, références  

### Pour la gestion
✅ **Suivi des encaissements** - Savoir exactement ce qui a été reçu  
✅ **Suivi des paiements** - Savoir exactement ce qui a été payé  
✅ **Gestion des retenues** - Visibilité sur les montants retenus  
✅ **Gestion des chèques** - Suivi des chèques en circulation  

---

## 📱 Interface Améliorée

### Cartes de Statistiques

#### Clients
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Transactions│Total Factures│  Encaissé  │Reste à Enc. │
│     25      │  50,000 DH  │  40,000 DH │  10,000 DH  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Fournisseurs
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Transactions│Total Command│  Décaissé  │Reste à Payer│
│     15      │  35,000 DH  │  25,000 DH │  10,000 DH  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🔧 Modifications Techniques

### Fichiers Modifiés
1. ✅ `screens/Reporting/ClientReportScreen.js`
   - Fonction `fetchTransactions()` étendue
   - Fonction `calculateStats()` améliorée
   - Fonctions `getStatusColor()` et `getStatusText()` complétées
   - Labels des statistiques mis à jour

2. ✅ `screens/Reporting/SupplierReportScreen.js`
   - Fonction `fetchTransactions()` étendue
   - Fonction `calculateStats()` améliorée
   - Fonctions `getStatusColor()` et `getStatusText()` complétées
   - Labels des statistiques mis à jour

### Nouvelles Requêtes Supabase

#### Clients
```javascript
// Retenues à la source
supabase.from('client_returns').select('*').eq('client', clientName)

// Paiements reçus
supabase.from('client_payment_orders').select('*').eq('client', clientName)

// Chèques reçus
supabase.from('checks').select('*')
  .eq('check_type', 'received')
  .eq('client_supplier', clientName)
```

#### Fournisseurs
```javascript
// Retenues à la source
supabase.from('supplier_returns').select('*').eq('supplier', supplierName)

// Paiements effectués
supabase.from('supplier_payment_orders').select('*').eq('supplier', supplierName)

// Chèques émis
supabase.from('checks').select('*')
  .eq('check_type', 'issued')
  .eq('client_supplier', supplierName)
```

---

## ⚠️ Points d'Attention

### Gestion des Erreurs
- Les erreurs de chargement des transactions annexes (retenues, chèques, etc.) sont loguées mais ne bloquent pas l'affichage
- Si une table n'existe pas, seules les transactions de base (factures/commandes) s'affichent

### Correspondance Nom
- La recherche se fait sur le **nom** du client/fournisseur
- Assurez-vous que les noms correspondent exactement entre les tables

### Statuts
- Seules les transactions avec statuts valides sont comptabilisées
- Les brouillons et annulations sont exclus des calculs

---

## 🚀 Résultat Final

### Avant
```
❌ Affichage uniquement des factures/commandes
❌ Calcul basique (total - payé)
❌ Statuts limités
❌ Pas de détail sur les encaissements
```

### Après
```
✅ Affichage de TOUTES les transactions
✅ Calcul précis (factures - (paiements + chèques + retenues))
✅ Tous les statuts supportés avec codes couleur
✅ Détail complet de chaque transaction
✅ Vue claire: "Encaissé" vs "Reste à encaisser"
✅ Suivi des retenues à la source
✅ Suivi des chèques en circulation
```

---

## 📊 Cas d'Usage Réels

### Scénario 1 : Client avec Retenue
```
Client ABC a:
- Facture F-001: 10,000 DH [validée]
- Paiement: 8,500 DH [reçu]
- Retenue à la source: 1,500 DH (15%) [reçue]

Résultat affiché:
✅ Total Factures: 10,000 DH
✅ Encaissé: 10,000 DH (8,500 + 1,500)
✅ Reste à Encaisser: 0 DH
```

### Scénario 2 : Fournisseur avec Chèque
```
Fournisseur XYZ a:
- Commande BC-001: 15,000 DH [reçue]
- Chèque émis: 10,000 DH [encaissé]
- Paiement partiel: 3,000 DH [payé]

Résultat affiché:
✅ Total Commandes: 15,000 DH
✅ Décaissé: 13,000 DH (10,000 + 3,000)
✅ Reste à Payer: 2,000 DH
```

---

**Date de mise à jour** : 10 novembre 2025  
**Version** : 2.0.0  
**Statut** : ✅ Améliorations Complètes Appliquées

**Le module Reporting affiche maintenant l'intégralité des transactions avec des calculs précis ! 🎉**
