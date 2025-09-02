import React from 'react';
import { TouchableOpacity } from 'react-native';
import { themes } from '../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

export const getStackScreenOptions = (theme, navigation) => {
    const tTheme = themes[theme];
    return {
        headerStyle: {
            backgroundColor: tTheme.card,
        },
        headerTintColor: tTheme.text,
        headerTitleStyle: {
            fontWeight: 'bold',
        },
        headerShadowVisible: false,
        headerLeft: () => (
            navigation.canGoBack() ? (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 20 }}>
                    <Ionicons name="arrow-back-outline" size={24} color={tTheme.primary} />
                </TouchableOpacity>
            ) : null
        ),
    };
};