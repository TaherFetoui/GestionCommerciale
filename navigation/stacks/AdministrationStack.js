import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';

// Import all necessary Administration screens
import AdministrationScreen from '../../screens/Administration/AdministrationScreen';
import ClientsListScreen from '../../screens/Administration/ClientsListScreen';
import CreateClientScreen from '../../screens/Administration/CreateClientScreen';
import SuppliersListScreen from '../../screens/Administration/SuppliersListScreen';
import CreateSupplierScreen from '../../screens/Administration/CreateSupplierScreen';
import ArticlesListScreen from '../../screens/Administration/ArticlesListScreen';
import CreateArticleScreen from '../../screens/Administration/CreateArticleScreen';

const Stack = createNativeStackNavigator();

export default function AdministrationStack() {
    const { theme } = useAuth();
    return (
        <Stack.Navigator screenOptions={({ navigation }) => getStackScreenOptions(theme, navigation)}>
            <Stack.Screen name="AdministrationHub" component={AdministrationScreen} options={{ title: 'Administration' }} />
            <Stack.Screen name="ClientsList" component={ClientsListScreen} options={{ title: 'Clients' }} />
            <Stack.Screen name="CreateClient" component={CreateClientScreen} options={{ headerShown: false }} />
            
            {/* --- MISSING SCREENS ADDED HERE --- */}
            <Stack.Screen name="SuppliersList" component={SuppliersListScreen} options={{ title: 'Fournisseurs' }} />
            <Stack.Screen name="CreateSupplier" component={CreateSupplierScreen} options={{ title: 'Nouveau Fournisseur' }} />
            <Stack.Screen name="ArticlesList" component={ArticlesListScreen} options={{ title: 'Articles' }} />
            <Stack.Screen name="CreateArticle" component={CreateArticleScreen} options={{ title: 'Nouvel Article' }} />
        </Stack.Navigator>
    );
}