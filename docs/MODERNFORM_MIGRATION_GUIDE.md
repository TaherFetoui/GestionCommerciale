# Guide de Migration vers ModernForm

## Composants créés

Le fichier `components/ModernForm.js` contient les composants suivants pour standardiser tous les formulaires de l'application:

### Composants disponibles:

1. **FormCard** - Carte pour grouper les champs de formulaire
2. **FormInput** - Input avec label et style moderne
3. **FormRow** - Organiser les inputs en ligne
4. **FormColumn** - Colonnes dans un FormRow
5. **FormSubmitButton** - Bouton de soumission avec style moderne
6. **FormSecondaryButton** - Bouton secondaire (Annuler, etc.)
7. **FormActions** - Conteneur pour les boutons d'action
8. **ModernFormModal** - Modal avec fond flouté (pour formulaires modaux)

## Exemple de migration

### Avant (ancien style):
```javascript
<ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
    <Text style={[styles.label, { color: tTheme.text }]}>Nom *</Text>
    <TextInput 
        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} 
        value={name} 
        onChangeText={setName} 
    />
    
    <TouchableOpacity style={[styles.saveButton, { backgroundColor: tTheme.accent }]} onPress={handleSave}>
        <Ionicons name="save-outline" size={22} color="#fff" />
        <Text style={styles.saveButtonText}>Enregistrer</Text>
    </TouchableOpacity>
</ScrollView>
```

### Après (nouveau style):
```javascript
import { 
    FormCard, 
    FormInput, 
    FormActions, 
    FormSubmitButton, 
    FormSecondaryButton 
} from '../../components/ModernForm';

<ScrollView style={[globalStyles.container, { backgroundColor: tTheme.background }]}>
    <View style={styles.content}>
        <FormCard title="Informations" icon="information-circle" theme={theme}>
            <FormInput
                label="Nom"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Client ABC"
                required
                theme={theme}
                icon="person-outline"
            />
        </FormCard>

        <FormActions>
            <FormSecondaryButton
                label="Annuler"
                onPress={() => navigation.goBack()}
                theme={theme}
            />
            <FormSubmitButton
                label="Enregistrer"
                onPress={handleSave}
                loading={loading}
                theme={theme}
            />
        </FormActions>
    </View>
</ScrollView>
```

## Fichiers à migrer

Les fichiers suivants doivent être migrés vers le nouveau style ModernForm:

### ✅ Déjà migré:
1. **screens/Administration/CreateArticleScreen.js** - ✅ Migré avec le nouveau style

### ⏳ À migrer:
2. **screens/Administration/CreateClientScreen.js**
3. **screens/Administration/CreateSupplierScreen.js**
4. **screens/Sales/CreateInvoiceScreen.js**
5. **screens/Sales/CreateQuoteScreen.js**
6. **screens/Sales/CreateDeliveryNoteScreen.js**
7. **screens/Purchases/CreatePurchaseOrderScreen.js**

## Étapes de migration pour chaque fichier:

### 1. Importer les composants ModernForm:
```javascript
import { 
    FormCard, 
    FormInput, 
    FormRow, 
    FormColumn, 
    FormActions, 
    FormSubmitButton, 
    FormSecondaryButton 
} from '../../components/ModernForm';
import Toast from '../../components/Toast';
import { getGlobalStyles } from '../../styles/GlobalStyles';
```

### 2. Ajouter le state Toast:
```javascript
const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
const globalStyles = getGlobalStyles(theme);
```

### 3. Remplacer Alert.alert par Toast:
```javascript
// Avant
Alert.alert('Erreur', 'Message d'erreur');

// Après
setToast({ visible: true, message: 'Message d'erreur', type: 'error' });
```

### 4. Ajouter le composant Toast dans le return:
```javascript
return (
    <>
        <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            theme={theme}
            onHide={() => setToast({ ...toast, visible: false })}
        />
        <ScrollView>
            {/* Contenu */}
        </ScrollView>
    </>
);
```

### 5. Organiser le contenu en FormCards:
```javascript
<View style={styles.content}>
    {/* Card 1: Informations de base */}
    <FormCard title="Informations de base" icon="information-circle" theme={theme}>
        <FormInput
            label="Nom"
            value={name}
            onChangeText={setName}
            required
            theme={theme}
            icon="person-outline"
        />
    </FormCard>

    {/* Card 2: Coordonnées */}
    <FormCard title="Coordonnées" icon="mail" theme={theme}>
        <FormRow>
            <FormColumn>
                <FormInput label="Email" value={email} onChangeText={setEmail} theme={theme} />
            </FormColumn>
            <FormColumn>
                <FormInput label="Téléphone" value={phone} onChangeText={setPhone} theme={theme} />
            </FormColumn>
        </FormRow>
    </FormCard>

    {/* Actions */}
    <FormActions>
        <FormSecondaryButton
            label="Annuler"
            onPress={() => navigation.goBack()}
            theme={theme}
        />
        <FormSubmitButton
            label="Enregistrer"
            onPress={handleSave}
            loading={loading}
            theme={theme}
        />
    </FormActions>
</View>
```

### 6. Ajouter le style content:
```javascript
const styles = StyleSheet.create({
    content: {
        padding: 16,
    },
    // ... autres styles
});
```

## Props disponibles pour FormInput:

- `label` (string, required) - Label de l'input
- `value` (string, required) - Valeur de l'input
- `onChangeText` (function, required) - Callback de changement
- `placeholder` (string) - Placeholder
- `keyboardType` ('default', 'numeric', 'email-address', etc.) - Type de clavier
- `required` (boolean) - Affiche l'astérisque rouge
- `multiline` (boolean) - Input multiligne
- `numberOfLines` (number) - Nombre de lignes (si multiline)
- `editable` (boolean) - Input éditable ou non
- `theme` (string) - Thème 'light' ou 'dark'
- `icon` (string) - Nom de l'icône Ionicons
- `error` (string) - Message d'erreur à afficher

## Props disponibles pour FormSubmitButton:

- `onPress` (function, required) - Callback du bouton
- `loading` (boolean) - Affiche le spinner
- `disabled` (boolean) - Désactive le bouton
- `label` (string) - Texte du bouton
- `icon` (string) - Nom de l'icône Ionicons
- `theme` (string) - Thème 'light' ou 'dark'
- `variant` ('primary', 'secondary', 'danger') - Variante de couleur

## Icônes recommandées par contexte:

- **Personne/Client**: `person-outline`, `people-outline`
- **Entreprise/Fournisseur**: `business-outline`
- **Email**: `mail-outline`
- **Téléphone**: `call-outline`
- **Adresse**: `location-outline`, `home-outline`
- **Article/Produit**: `pricetag-outline`, `cube-outline`
- **Prix**: `cash-outline`, `trending-up`, `trending-down`
- **TVA/Calcul**: `calculator-outline`
- **Stock**: `cube-outline`, `layers-outline`
- **Date**: `calendar-outline`
- **Référence**: `barcode-outline`
- **Notes**: `document-text-outline`
- **Informations**: `information-circle-outline`

## Avantages du nouveau design:

✅ **Cohérence visuelle** - Tous les formulaires ont le même style
✅ **Maintenance facile** - Un seul composant à maintenir
✅ **Responsive** - S'adapte automatiquement aux différentes tailles d'écran
✅ **Accessibilité** - Labels et icônes pour une meilleure UX
✅ **Toast moderne** - Remplace les Alert.alert natifs
✅ **Validation visuelle** - Messages d'erreur intégrés
✅ **Boutons stylisés** - Boutons primaires et secondaires distincts
✅ **Organisation** - FormCards pour grouper les champs logiquement
✅ **Icônes contextuelles** - Améliore la compréhension des champs

## Notes importantes:

1. **Toast au lieu d'Alert**: Utiliser setToast() au lieu d'Alert.alert() pour une meilleure UX
2. **Redirection après succès**: Utiliser setTimeout() pour laisser le toast se fermer avant la navigation
3. **GlobalStyles**: Utiliser getGlobalStyles(theme) pour la cohérence
4. **Picker**: Les Picker nécessitent toujours un style personnalisé (voir CreateArticleScreen.js)
5. **ScrollView**: Toujours wrapper le contenu dans une ScrollView pour la compatibilité mobile

## Exemple complet (CreateArticleScreen.js)

Le fichier `screens/Administration/CreateArticleScreen.js` a été complètement migré et peut servir de référence pour migrer les autres formulaires.
