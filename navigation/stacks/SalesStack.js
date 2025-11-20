import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';

import CreateDeliveryNoteScreen from '../../screens/Sales/CreateDeliveryNoteScreen';
import CreateInvoiceScreen from '../../screens/Sales/CreateInvoiceScreen';
import CreateQuoteScreen from '../../screens/Sales/CreateQuoteScreen';
import DeliveryNoteDetailsScreen from '../../screens/Sales/DeliveryNoteDetailsScreen';
import DeliveryNotesListScreen from '../../screens/Sales/DeliveryNotesListScreen';
import InvoiceDetailsScreen from '../../screens/Sales/InvoiceDetailsScreen';
import InvoicesListScreen from '../../screens/Sales/InvoicesListScreen';
import QuoteDetailsScreen from '../../screens/Sales/QuoteDetailsScreen';
import QuotesListScreen from '../../screens/Sales/QuotesListScreen';

const Stack = createNativeStackNavigator();

// Stack pour les Devis
function QuotesStack() {
    const { language } = useAuth();
    const t = translations[language];
    
    return (
        <Stack.Navigator 
            initialRouteName="QuotesList"
            screenOptions={getStackScreenOptions}
        >
            <Stack.Screen name="QuotesList" component={QuotesListScreen} options={{ title: 'Devis' }}/>
            <Stack.Screen name="CreateQuote" component={CreateQuoteScreen} options={{ title: 'Créer un devis' }}/>
            <Stack.Screen name="QuoteDetails" component={QuoteDetailsScreen} options={{ title: 'Détails du devis' }}/>
        </Stack.Navigator>
    );
}

// Stack pour les Factures
function InvoicesStack() {
    const { language } = useAuth();
    const t = translations[language];
    
    return (
        <Stack.Navigator 
            initialRouteName="InvoicesList"
            screenOptions={getStackScreenOptions}
        >
            <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: t.invoices }}/>
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ title: t.createInvoice }}/>
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailsScreen} options={{ title: 'Détails Facture' }}/>
        </Stack.Navigator>
    );
}

// Stack pour les Bons de livraison
function DeliveryNotesStack() {
    return (
        <Stack.Navigator 
            initialRouteName="DeliveryNotesList"
            screenOptions={getStackScreenOptions}
        >
            <Stack.Screen name="DeliveryNotesList" component={DeliveryNotesListScreen} options={{ title: 'Bons de livraison' }}/>
            <Stack.Screen name="CreateDeliveryNote" component={CreateDeliveryNoteScreen} options={{ title: 'Créer un bon de livraison' }}/>
            <Stack.Screen name="DeliveryNoteDetails" component={DeliveryNoteDetailsScreen} options={{ title: 'Détails du bon de livraison' }}/>
        </Stack.Navigator>
    );
}

// Wrapper qui décide quel stack afficher
export default function SalesStack({ initialScreen }) {
    // Afficher le stack approprié selon la sélection
    if (initialScreen === 'VentesDevis') {
        return <QuotesStack />;
    }
    
    if (initialScreen === 'VentesFactures') {
        return <InvoicesStack />;
    }
    
    if (initialScreen === 'VentesBonsLivraison') {
        return <DeliveryNotesStack />;
    }
    
    // Par défaut, afficher les factures
    return <InvoicesStack />;
}