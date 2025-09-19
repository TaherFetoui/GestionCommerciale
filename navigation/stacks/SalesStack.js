import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';
import { translations } from '../../constants/AppConfig';

import InvoicesListScreen from '../../screens/Sales/InvoicesListScreen';
import CreateInvoiceScreen from '../../screens/Sales/CreateInvoiceScreen';
// Importez vos autres écrans de Ventes ici

const Stack = createNativeStackNavigator();

export default function SalesStack() {
    const { language } = useAuth();
    const t = translations[language];
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions}>
             <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: t.invoices }}/>
             <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ title: t.createInvoice }}/>
             {/* Ajoutez QuotesList, etc. ici */}
        </Stack.Navigator>
    );
}