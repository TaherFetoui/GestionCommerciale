import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes } from '../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useResponsive } from '../hooks/useResponsive';

export default function Header({ title, onToggleSidebar }) {
    const { theme, user } = useAuth();
    const { isMobile } = useResponsive();
    const tTheme = themes[theme];
    const username = user?.email ? user.email.split('@')[0] : 'Guest';

    return (
        <View style={[styles.container, { backgroundColor: tTheme.card, borderBottomColor: tTheme.border }]}>
            <View style={styles.leftContainer}>
                {/* Show menu button only on mobile */}
                {isMobile && (
                    <TouchableOpacity onPress={onToggleSidebar} style={{ marginRight: 16 }}>
                        <Ionicons name="menu-outline" size={28} color={tTheme.text} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.title, { color: tTheme.text }]}>{title}</Text>
            </View>
            <View style={styles.rightContainer}>
                <Ionicons name="notifications-outline" size={24} color={tTheme.textSecondary} style={{marginRight: 20}} />
                <View style={[styles.avatar, {backgroundColor: tTheme.primarySoft}]}>
                    <Text style={{color: tTheme.primary, fontWeight: 'bold'}}>{username.charAt(0).toUpperCase()}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        borderBottomWidth: 1,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    }
});