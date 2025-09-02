import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes } from '../constants/AppConfig';
import { useResponsive } from '../hooks/useResponsive';

// Import Components
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import LoginScreen from '../screens/LoginScreen';

// Import Stacks and Screens
import AdministrationStack from './stacks/AdministrationStack';
import CompanySettingsStack from './stacks/CompanySettingsStack';
import PurchasesStack from './stacks/PurchasesStack';
import SalesStack from './stacks/SalesStack';
import DashboardScreen from '../screens/DashboardScreen';
import AppSettingsScreen from '../screens/AppSettingsScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const MainContent = ({ screen }) => {
    switch (screen) {
        case 'Dashboard':
            return <DashboardScreen />;
        case 'Paramétrage':
            return <CompanySettingsStack />;
        case 'Administration':
            return <AdministrationStack />;
        case 'Achats':
            return <PurchasesStack />;
        case 'Ventes':
            return <SalesStack />;
        case 'Réglages':
            return <AppSettingsScreen />;
        default:
            return <PlaceholderScreen title={screen} />;
    }
};

export default function AppNavigator() {
    const { user, theme } = useAuth();
    const [activeScreen, setActiveScreen] = useState('Dashboard');
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const { isMobile } = useResponsive();
    const tTheme = themes[theme];

    if (!user) {
        return <LoginScreen />;
    }

    // On mobile, the sidebar becomes an overlay
    const sidebarStyle = isMobile ? [styles.sidebarMobile, !isSidebarVisible && { left: '-100%' }] : styles.sidebarDesktop;

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <View style={sidebarStyle}>
                <Sidebar 
                    activeScreen={activeScreen} 
                    setActiveScreen={setActiveScreen} 
                    onClose={() => setSidebarVisible(false)}
                />
            </View>

            <View style={styles.content}>
                <Header 
                  title={activeScreen} 
                  onToggleSidebar={() => setSidebarVisible(v => !v)} 
                />
                <MainContent screen={activeScreen} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebarDesktop: {
        // La largeur est définie dans le composant Sidebar lui-même
    },
    sidebarMobile: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10, // Assure que la sidebar est au-dessus du contenu
        elevation: 10,
    },
    content: {
        flex: 1,
    },
});