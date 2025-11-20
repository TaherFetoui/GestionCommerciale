import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes, translations } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
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
];

export default function Sidebar({ activeScreen, setActiveScreen, onClose }) {
    const { user, theme, language, signOut } = useAuth();
    const { isMobile, isTablet, getSidebarWidth } = useResponsive();
    const tTheme = themes[theme];
    const t = translations[language];
    const [profileName, setProfileName] = useState('');
    const [reportingExpanded, setReportingExpanded] = useState(false);
    const [administrationExpanded, setAdministrationExpanded] = useState(false);
    const [salesExpanded, setSalesExpanded] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                // Utiliser directement l'email de l'utilisateur
                const capitalizeFirstLetter = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
                
                if (user.user_metadata?.full_name) {
                    setProfileName(capitalizeFirstLetter(user.user_metadata.full_name));
                } else if (user.email) {
                    setProfileName(capitalizeFirstLetter(user.email.split('@')[0]));
                }
            }
        };
        fetchProfile();
    }, [user]);

    const handleNavigate = (screen, subScreen = null) => {
        if (screen === 'Pilotage' && !subScreen) {
            // Toggle reporting submenu
            setReportingExpanded(!reportingExpanded);
            return;
        }
        
        if (screen === 'Administration' && !subScreen) {
            // Toggle administration submenu
            setAdministrationExpanded(!administrationExpanded);
            return;
        }
        
        if (screen === 'Ventes' && !subScreen) {
            // Toggle sales submenu
            setSalesExpanded(!salesExpanded);
            return;
        }
        
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
                    <View key={item.name}>
                        <TouchableOpacity
                            style={[
                                styles.navItem,
                                (activeScreen === item.screen || 
                                 (item.screen === 'Pilotage' && reportingExpanded) ||
                                 (item.screen === 'Administration' && administrationExpanded) ||
                                 (item.screen === 'Ventes' && salesExpanded)) && 
                                { backgroundColor: tTheme.sidebarActiveBackground }
                            ]}
                            onPress={() => handleNavigate(item.screen)}
                        >
                            <Ionicons 
                                name={item.icon} 
                                size={22} 
                                color={activeScreen === item.screen ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                            />
                            <Text style={[
                                styles.navText, 
                                { color: activeScreen === item.screen ? tTheme.sidebarActiveText : tTheme.sidebarText }
                            ]}>
                                {t[item.name]}
                            </Text>
                            {(item.screen === 'Pilotage' || item.screen === 'Administration' || item.screen === 'Ventes') && (
                                <Ionicons 
                                    name={
                                        (item.screen === 'Pilotage' && reportingExpanded) ||
                                        (item.screen === 'Administration' && administrationExpanded) ||
                                        (item.screen === 'Ventes' && salesExpanded)
                                            ? "chevron-down" 
                                            : "chevron-forward"
                                    } 
                                    size={18} 
                                    color={tTheme.sidebarText}
                                />
                            )}
                        </TouchableOpacity>
                        
                        {/* Sous-menu Administration */}
                        {item.screen === 'Administration' && administrationExpanded && (
                            <View style={styles.submenu}>
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'AdministrationClients' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('AdministrationClients')}
                                >
                                    <Ionicons 
                                        name="people-outline" 
                                        size={20} 
                                        color={activeScreen === 'AdministrationClients' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'AdministrationClients' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Clients
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'AdministrationFournisseurs' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('AdministrationFournisseurs')}
                                >
                                    <Ionicons 
                                        name="business-outline" 
                                        size={20} 
                                        color={activeScreen === 'AdministrationFournisseurs' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'AdministrationFournisseurs' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Fournisseurs
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        {/* Sous-menu Ventes */}
                        {item.screen === 'Ventes' && salesExpanded && (
                            <View style={styles.submenu}>
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'VentesDevis' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('VentesDevis')}
                                >
                                    <Ionicons 
                                        name="document-text-outline" 
                                        size={20} 
                                        color={activeScreen === 'VentesDevis' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'VentesDevis' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Devis
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'VentesFactures' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('VentesFactures')}
                                >
                                    <Ionicons 
                                        name="receipt-outline" 
                                        size={20} 
                                        color={activeScreen === 'VentesFactures' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'VentesFactures' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Factures
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'VentesBonsLivraison' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('VentesBonsLivraison')}
                                >
                                    <Ionicons 
                                        name="cube-outline" 
                                        size={20} 
                                        color={activeScreen === 'VentesBonsLivraison' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'VentesBonsLivraison' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Bons de livraison
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        {/* Sous-menu Reporting */}
                        {item.screen === 'Pilotage' && reportingExpanded && (
                            <View style={styles.submenu}>
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'ReportingClients' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('ReportingClients')}
                                >
                                    <Ionicons 
                                        name="people-outline" 
                                        size={20} 
                                        color={activeScreen === 'ReportingClients' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'ReportingClients' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Clients
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.submenuItem,
                                        activeScreen === 'ReportingFournisseurs' && 
                                        { backgroundColor: tTheme.sidebarActiveBackground }
                                    ]}
                                    onPress={() => handleNavigate('ReportingFournisseurs')}
                                >
                                    <Ionicons 
                                        name="business-outline" 
                                        size={20} 
                                        color={activeScreen === 'ReportingFournisseurs' ? tTheme.sidebarActiveText : tTheme.sidebarText} 
                                    />
                                    <Text style={[
                                        styles.submenuText,
                                        { color: activeScreen === 'ReportingFournisseurs' ? tTheme.sidebarActiveText : tTheme.sidebarText }
                                    ]}>
                                        Fournisseurs
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={[styles.creditText, { color: tTheme.sidebarText }]}>
                    Développé par
                </Text>
                <Text style={[styles.creditText, { color: tTheme.sidebarText, fontWeight: '600' }]}>
                    Taher Fetoui & Hiba Bouchaala
                </Text>
            </View>
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
    submenu: {
        paddingLeft: 20,
        marginTop: 2,
    },
    submenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 2,
    },
    submenuText: {
        fontSize: 12,
        marginLeft: 10,
        fontWeight: '400',
    },
    footer: { 
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        marginTop: 6,
        flexShrink: 0,
    },
    creditText: {
        fontSize: 11,
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 16,
    }
});