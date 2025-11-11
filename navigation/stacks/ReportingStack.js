import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import ClientReportScreen from '../../screens/Reporting/ClientReportScreen';
import ClientsListScreen from '../../screens/Reporting/ClientsListScreen';
import SupplierReportScreen from '../../screens/Reporting/SupplierReportScreen';
import SuppliersListScreen from '../../screens/Reporting/SuppliersListScreen';
import { getStackScreenOptions } from '../navigationConfig';

const Stack = createNativeStackNavigator();

// Stack pour les clients
function ClientsStack({ theme }) {
    return (
        <Stack.Navigator 
            initialRouteName="ClientsList"
            screenOptions={({ navigation, route }) => getStackScreenOptions(theme, navigation, route)}
        >
            <Stack.Screen
                name="ClientsList"
                component={ClientsListScreen}
                options={{ title: 'Reporting Clients' }}
            />
            <Stack.Screen
                name="ClientReport"
                component={ClientReportScreen}
                options={{ title: 'Rapport Client' }}
            />
        </Stack.Navigator>
    );
}

// Stack pour les fournisseurs
function SuppliersStack({ theme }) {
    return (
        <Stack.Navigator 
            initialRouteName="SuppliersList"
            screenOptions={({ navigation, route }) => getStackScreenOptions(theme, navigation, route)}
        >
            <Stack.Screen
                name="SuppliersList"
                component={SuppliersListScreen}
                options={{ title: 'Reporting Fournisseurs' }}
            />
            <Stack.Screen
                name="SupplierReport"
                component={SupplierReportScreen}
                options={{ title: 'Rapport Fournisseur' }}
            />
        </Stack.Navigator>
    );
}

// Wrapper qui décide quel stack afficher
export default function ReportingStack({ initialScreen }) {
    const { theme } = useAuth();
    
    // Afficher le stack approprié selon la sélection
    if (initialScreen === 'ReportingFournisseurs') {
        return <SuppliersStack theme={theme} />;
    }
    
    // Par défaut, afficher le stack clients
    return <ClientsStack theme={theme} />;
}
