import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';

import CreateInvoiceScreen from '../../screens/Sales/CreateInvoiceScreen';
import InvoiceDetailsScreen from '../../screens/Sales/InvoiceDetailsScreen';
import InvoicesListScreen from '../../screens/Sales/InvoicesListScreen';
// Importez vos autres écrans de Ventes ici

const Stack = createNativeStackNavigator();

export default function SalesStack() {
    const { language } = useAuth();
    const t = translations[language];
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions}>
             <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: t.invoices }}/>
             <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ title: t.createInvoice }}/>
             <Stack.Screen name="InvoiceDetail" component={InvoiceDetailsScreen} options={{ title: 'Détails Facture' }}/>
             {/* Ajoutez QuotesList, etc. ici */}
        </Stack.Navigator>
    );
}