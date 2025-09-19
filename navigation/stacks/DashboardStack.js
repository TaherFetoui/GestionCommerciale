import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';
import DashboardScreen from '../../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function DashboardStack() {
    const { theme } = useAuth();
    return (
        <Stack.Navigator screenOptions={({ navigation, route }) => getStackScreenOptions(theme, navigation, route)}>
            <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                // Le titre ici sera utilisé par notre Header personnalisé
                options={{ title: 'Dashboard' }} 
            />
        </Stack.Navigator>
    );
}