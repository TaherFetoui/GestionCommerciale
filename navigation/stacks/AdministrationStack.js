import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';

import AdministrationScreen from '../../screens/Administration/AdministrationScreen';
import ArticlesListScreen from '../../screens/Administration/ArticlesListScreen';
import ClientsListScreen from '../../screens/Administration/ClientsListScreen';
import CreateArticleScreen from '../../screens/Administration/CreateArticleScreen';
import CreateClientScreen from '../../screens/Administration/CreateClientScreen';
import CreateSupplierScreen from '../../screens/Administration/CreateSupplierScreen';
import SuppliersListScreen from '../../screens/Administration/SuppliersListScreen';

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
                options={{ title: 'Clients' }} 
            />
            <Stack.Screen 
                name="CreateClient" 
                component={CreateClientScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="ArticlesList" 
                component={ArticlesListScreen} 
                options={{ title: 'Articles' }} 
            />
            <Stack.Screen 
                name="CreateArticle" 
                component={CreateArticleScreen} 
                options={{ title: 'Nouvel Article' }} 
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
                options={{ title: 'Fournisseurs' }} 
            />
            <Stack.Screen 
                name="CreateSupplier" 
                component={CreateSupplierScreen} 
                options={{ title: 'Nouveau Fournisseur' }} 
            />
            <Stack.Screen 
                name="ArticlesList" 
                component={ArticlesListScreen} 
                options={{ title: 'Articles' }} 
            />
            <Stack.Screen 
                name="CreateArticle" 
                component={CreateArticleScreen} 
                options={{ title: 'Nouvel Article' }} 
            />
        </Stack.Navigator>
    );
}

// Stack pour le hub administration (si nécessaire)
function AdministrationHubStack({ theme }) {
    return (
        <Stack.Navigator 
            initialRouteName="AdministrationHub"
            screenOptions={({ navigation, route }) => getStackScreenOptions(theme, navigation, route)}
        >
            <Stack.Screen 
                name="AdministrationHub" 
                component={AdministrationScreen} 
                options={{ title: 'Administration' }} 
            />
            <Stack.Screen 
                name="ClientsList" 
                component={ClientsListScreen} 
                options={{ title: 'Clients' }} 
            />
            <Stack.Screen 
                name="CreateClient" 
                component={CreateClientScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="SuppliersList" 
                component={SuppliersListScreen} 
                options={{ title: 'Fournisseurs' }} 
            />
            <Stack.Screen 
                name="CreateSupplier" 
                component={CreateSupplierScreen} 
                options={{ title: 'Nouveau Fournisseur' }} 
            />
            <Stack.Screen 
                name="ArticlesList" 
                component={ArticlesListScreen} 
                options={{ title: 'Articles' }} 
            />
            <Stack.Screen 
                name="CreateArticle" 
                component={CreateArticleScreen} 
                options={{ title: 'Nouvel Article' }} 
            />
        </Stack.Navigator>
    );
}

// Wrapper qui décide quel stack afficher
export default function AdministrationStack({ initialScreen }) {
    const { theme } = useAuth();
    
    // Afficher le stack approprié selon la sélection
    if (initialScreen === 'AdministrationClients') {
        return <ClientsStack theme={theme} />;
    }
    
    if (initialScreen === 'AdministrationFournisseurs') {
        return <SuppliersStack theme={theme} />;
    }
    
    // Par défaut, afficher le hub administration
    return <AdministrationHubStack theme={theme} />;
}