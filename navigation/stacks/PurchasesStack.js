import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';
import { translations } from '../../constants/AppConfig';

import PurchaseOrdersListScreen from '../../screens/Purchases/PurchaseOrdersListScreen';
import CreatePurchaseOrderScreen from '../../screens/Purchases/CreatePurchaseOrderScreen';

const Stack = createNativeStackNavigator();

export default function PurchasesStack() {
    const { theme, language } = useAuth();
    const t = translations[language];
    return (
        <Stack.Navigator screenOptions={({ navigation }) => getStackScreenOptions(theme, navigation)}>
            <Stack.Screen name="PurchaseOrdersList" component={PurchaseOrdersListScreen} options={{title: t.purchaseOrders}} />
            <Stack.Screen name="CreatePurchaseOrder" component={CreatePurchaseOrderScreen} options={{title: "Nouvelle Commande"}} />
        </Stack.Navigator>
    );
}