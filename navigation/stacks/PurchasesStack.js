import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';

import CreatePurchaseOrderScreen from '../../screens/Purchases/CreatePurchaseOrderScreen';
import PurchaseOrderDetailsScreen from '../../screens/Purchases/PurchaseOrderDetailsScreen';
import PurchaseOrdersListScreen from '../../screens/Purchases/PurchaseOrdersListScreen';

const Stack = createNativeStackNavigator();

export default function PurchasesStack() {
    const { language } = useAuth();
    const t = translations[language];
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions}>
            <Stack.Screen name="PurchaseOrdersList" component={PurchaseOrdersListScreen} options={{title: t.purchaseOrders}} />
            <Stack.Screen name="CreatePurchaseOrder" component={CreatePurchaseOrderScreen} options={{title: "Nouvelle Commande"}} />
            <Stack.Screen name="PurchaseOrderDetails" component={PurchaseOrderDetailsScreen} options={{title: "Détails de la commande"}} />
        </Stack.Navigator>
    );
}