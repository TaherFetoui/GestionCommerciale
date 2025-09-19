import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { themes, translations } from '../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useResponsive } from '../hooks/useResponsive';

const navItems = [
    { name: 'dashboard', icon: 'apps-outline', screen: 'Dashboard' },
    { name: 'companySettings', icon: 'business-outline', screen: 'Paramétrage' },
    { name: 'administration', icon: 'briefcase-outline', screen: 'Administration' },
    { name: 'purchases', icon: 'download-outline', screen: 'Achats' },
    { name: 'sales', icon: 'cart-outline', screen: 'Ventes' },
    { name: 'stock', icon: 'cube-outline', screen: 'Stock' },
    { name: 'finance', icon: 'wallet-outline', screen: 'Finance' },
    { name: 'reporting', icon: 'analytics-outline', screen: 'Pilotage' },
    { name: 'appSettings', icon: 'settings-outline', screen: 'Réglages' },
];

export default function Sidebar({ activeScreen, setActiveScreen, onClose }) {
    const { user, theme, language, signOut } = useAuth();
    const { isMobile } = useResponsive();
    const tTheme = themes[theme];
    const t = translations[language];
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                
                const capitalizeFirstLetter = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
                
                if (data && data.full_name) {
                    setProfileName(capitalizeFirstLetter(data.full_name));
                } else if (user.email) {
                    setProfileName(capitalizeFirstLetter(user.email.split('@')[0]));
                }
            }
        };
        fetchProfile();
    }, [user]);

    const handleNavigate = (screen) => {
        setActiveScreen(screen);
        if (isMobile) {
            onClose();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: tTheme.sidebarBackground }]}>
            <View style={styles.header}>
                <Image source={require('../assets/images/logo.png')} style={styles.logo} />
                <Text style={[styles.title, { textTransform: 'capitalize' }]} numberOfLines={1}>
                    {profileName || '...'}
                </Text>
            </View>

            <View style={styles.navContainer}>
                {navItems.map((item) => (
                    <TouchableOpacity
                        key={item.name}
                        style={[
                            styles.navItem,
                            activeScreen === item.screen && { backgroundColor: tTheme.sidebarActiveBackground }
                        ]}
                        onPress={() => handleNavigate(item.screen)}
                    >
                        <Ionicons name={item.icon} size={22} color={activeScreen === item.screen ? tTheme.sidebarActiveText : tTheme.sidebarText} />
                        <Text style={[styles.navText, { color: activeScreen === item.screen ? tTheme.sidebarActiveText : tTheme.sidebarText }]}>
                            {t[item.name]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.footer} onPress={() => signOut()}>
                <Ionicons name="log-out-outline" size={22} color={tTheme.sidebarText} />
                <Text style={[styles.navText, { color: tTheme.sidebarText }]}>{t.logout}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 220, // --- WIDTH REDUCED HERE ---
        height: '100%',
        paddingTop: 40,
        paddingHorizontal: 16,
        borderRightWidth: 1,
        borderRightColor: '#374151',
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, },
    logo: { width: 40, height: 40, borderRadius: 8, },
    title: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12, flexShrink: 1 },
    navContainer: { flex: 1, },
    navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 8, },
    navText: { fontSize: 15, marginLeft: 16, fontWeight: '500', },
    footer: { paddingVertical: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, }
});