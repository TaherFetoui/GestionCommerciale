import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes, translations } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { supabase } from '../lib/supabase';

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
    const { isMobile, isTablet, getSidebarWidth } = useResponsive();
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

    const sidebarWidth = getSidebarWidth();
    
    return (
        <View style={[
            styles.container, 
            { 
                backgroundColor: tTheme.sidebarBackground,
                width: sidebarWidth
            }
        ]}>
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
        height: '100%',
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        overflow: 'hidden',
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 20,
        paddingHorizontal: 6,
    },
    logo: { 
        width: 32, 
        height: 32, 
        borderRadius: 8,
        flexShrink: 0,
    },
    title: { 
        color: '#FFFFFF', 
        fontSize: 14, 
        fontWeight: '700', 
        marginLeft: 10, 
        flex: 1,
        minWidth: 0,
    },
    navContainer: { 
        flex: 1,
        overflow: 'auto',
    },
    navItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10, 
        paddingHorizontal: 12, 
        borderRadius: 10, 
        marginBottom: 3,
    },
    navText: { 
        fontSize: 13, 
        marginLeft: 12, 
        fontWeight: '500',
        flex: 1,
        minWidth: 0,
    },
    footer: { 
        paddingVertical: 14, 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        marginTop: 6,
        flexShrink: 0,
    }
});