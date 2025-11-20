# Module Ventes - Devis et Bons de Livraison

## Fonctionnalités ajoutées

### 1. Gestion des Devis

#### Écrans créés:
- **QuotesListScreen.js** - Liste de tous les devis avec recherche et filtres
- **CreateQuoteScreen.js** - Création de nouveaux devis
- **QuoteDetailsScreen.js** - Détails et gestion d'un devis

#### Fonctionnalités:
- Création de devis avec articles multiples
- Calcul automatique des totaux (HT, TVA 19%, TTC)
- Statuts: Brouillon, Envoyé, Accepté, Rejeté
- Numérotation automatique (DV-0001, DV-0002, etc.)
- Recherche par numéro ou client
- Filtrage par statut
- Modification du statut depuis les détails
- Sélection d'articles depuis la base de données
- Date de validité du devis
- Notes personnalisables

### 2. Gestion des Bons de Livraison

#### Écrans créés:
- **DeliveryNotesListScreen.js** - Liste de tous les bons de livraison
- **CreateDeliveryNoteScreen.js** - Création de nouveaux bons de livraison
- **DeliveryNoteDetailsScreen.js** - Détails et gestion d'un bon de livraison

#### Fonctionnalités:
- Création de bons de livraison avec articles multiples
- Gestion des quantités livrées
- Statuts: En attente, Livré, Annulé
- Numérotation automatique (BL-0001, BL-0002, etc.)
- Recherche par numéro ou client
- Filtrage par statut
- Modification du statut depuis les détails
- Sélection d'articles depuis la base de données
- Affichage des quantités totales
- Notes de livraison

## Navigation

Les routes suivantes ont été ajoutées à **SalesStack.js**:

```javascript
// Devis (Quotes)
<Stack.Screen name="QuotesList" component={QuotesListScreen} />
<Stack.Screen name="CreateQuote" component={CreateQuoteScreen} />
<Stack.Screen name="QuoteDetails" component={QuoteDetailsScreen} />

// Bons de livraison (Delivery Notes)
<Stack.Screen name="DeliveryNotesList" component={DeliveryNotesListScreen} />
<Stack.Screen name="CreateDeliveryNote" component={CreateDeliveryNoteScreen} />
<Stack.Screen name="DeliveryNoteDetails" component={DeliveryNoteDetailsScreen} />
```

## Base de données

### Tables créées (voir database/sales_schema.sql)

#### Table `quotes`:
```sql
- id (UUID)
- user_id (UUID) - lien vers l'utilisateur
- client_id (UUID) - lien vers le client
- quote_number (TEXT) - numéro du devis
- quote_date (DATE) - date du devis
- valid_until (DATE) - date de validité
- status (TEXT) - draft, sent, accepted, rejected
- items (JSONB) - articles du devis
- total_ht (DECIMAL)
- tva_amount (DECIMAL)
- total_ttc (DECIMAL)
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### Table `delivery_notes`:
```sql
- id (UUID)
- user_id (UUID) - lien vers l'utilisateur
- client_id (UUID) - lien vers le client
- note_number (TEXT) - numéro du bon
- delivery_date (DATE) - date de livraison
- status (TEXT) - pending, delivered, cancelled
- items (JSONB) - articles livrés
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

### Format des items (JSONB):
```json
[
  {
    "item_id": "uuid-article",
    "item_name": "Nom de l'article",
    "quantity": 2,
    "unit_price": 150.000  // Pour les devis uniquement
  }
]
```

## Installation

### 1. Exécuter le script SQL dans Supabase:
```bash
# Dans l'éditeur SQL de Supabase, exécutez:
database/sales_schema.sql
```

### 2. Vérifier les politiques RLS:
Les politiques de sécurité au niveau ligne (RLS) sont activées automatiquement:
- Chaque utilisateur ne voit que ses propres devis et bons de livraison
- Filtrage automatique par `user_id`

### 3. Tester les nouvelles fonctionnalités:
1. Accéder au module Ventes
2. Naviguer vers "Devis" ou "Bons de livraison"
3. Créer un nouveau document
4. Vérifier les calculs et statuts

## Composants utilisés

- **ModernTable** - Tables responsives avec tri et pagination
- **ModernSearchBar** - Barre de recherche avec debounce
- **ModernFilterChip** - Filtres de statut
- **ModernStatusBadge** - Badges de statut colorés
- **Toast** - Notifications de succès/erreur
- **Picker** - Sélection de clients et articles

## Architecture

```
screens/Sales/
├── QuotesListScreen.js          - Liste des devis
├── CreateQuoteScreen.js         - Création de devis
├── QuoteDetailsScreen.js        - Détails d'un devis
├── DeliveryNotesListScreen.js   - Liste des bons de livraison
├── CreateDeliveryNoteScreen.js  - Création de bon de livraison
└── DeliveryNoteDetailsScreen.js - Détails d'un bon de livraison

navigation/stacks/
└── SalesStack.js                - Routes de navigation

database/
└── sales_schema.sql             - Schéma SQL des nouvelles tables
```

## Prochaines étapes possibles

1. **Génération PDF** - Ajouter l'impression des devis et bons de livraison
2. **Conversion** - Transformer un devis en facture ou bon de livraison
3. **Historique** - Tracer les modifications de statut
4. **Validation** - Workflow d'approbation des devis
5. **Signature** - Signature électronique des documents
6. **Email** - Envoi automatique par email
7. **Statistiques** - Rapports sur les devis (taux d'acceptation, etc.)

## Notes techniques

- Tous les montants sont en TND (Dinar Tunisien)
- TVA fixée à 19%
- Précision des montants: 3 décimales
- Format de date: fr-FR (JJ/MM/AAAA)
- Responsive: Mobile, Tablet, Desktop
- Thèmes: Light/Dark supportés
- Langue: Français uniquement
