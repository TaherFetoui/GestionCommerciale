import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';
import { translations } from '../../constants/AppConfig';

import AppSettingsScreen from '../../screens/AppSettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppSettingsStack() {
    const { language } = useAuth();
    const t = translations[language];
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions}>
            <Stack.Screen 
                name="AppSettings" 
                component={AppSettingsScreen} 
                options={{ title: t.appSettings }} 
            />
        </Stack.Navigator>
    );
}