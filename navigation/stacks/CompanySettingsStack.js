import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getStackScreenOptions } from '../navigationConfig';
import { translations } from '../../constants/AppConfig';

import CompanyInfoScreen from '../../screens/CompanySettings/CompanyInfoScreen';

const Stack = createNativeStackNavigator();

export default function CompanySettingsStack() {
    const { theme, language } = useAuth();
    const t = translations[language];
    return (
        <Stack.Navigator screenOptions={({ navigation }) => getStackScreenOptions(theme, navigation)}>
            <Stack.Screen name="CompanyInfo" component={CompanyInfoScreen} options={{title: t.companyInfo}} />
        </Stack.Navigator>
    );
}