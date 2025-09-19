import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { themes } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { PlatformUtils } from '../hooks/usePlatform';
import { useResponsive } from '../hooks/useResponsive';

// --- Import Components & Screens ---
import Sidebar from '../components/Sidebar';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

// --- Import Navigation Stacks for Each Module ---
import AdministrationStack from './stacks/AdministrationStack';
import AppSettingsStack from './stacks/AppSettingsStack';
import CompanySettingsStack from './stacks/CompanySettingsStack';
import DashboardStack from './stacks/DashboardStack';
import PurchasesStack from './stacks/PurchasesStack';
import SalesStack from './stacks/SalesStack';

/**
 * This component acts as a router, selecting which module's navigation stack
 * to display in the main content area based on the user's selection in the sidebar.
 */
const MainContent = React.memo(({ screen }) => {
    const ContentComponent = useMemo(() => {
        switch (screen) {
            case 'Dashboard':
                return DashboardStack;
            case 'Paramétrage':
                return CompanySettingsStack;
            case 'Administration':
                return AdministrationStack;
            case 'Achats':
                return PurchasesStack;
            case 'Ventes':
                return SalesStack;
            case 'Réglages':
                return AppSettingsStack;
            // Add cases for Stock, Finance, etc. as you build their stacks
            // case 'Stock':
            //     return StockStack;
            default:
                return () => <PlaceholderScreen title={screen} />;
        }
    }, [screen]);
    
    return <ContentComponent />;
});

/**
 * This is the main navigator for the application after a user has logged in.
 * It orchestrates the entire responsive layout, including the sidebar and main content area.
 */
export default function AppNavigator() {
    const { user, theme } = useAuth();
    const [activeScreen, setActiveScreen] = useState('Dashboard');
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const responsive = useResponsive();
    const { isMobile, isTablet, getSidebarWidth } = responsive;
    const tTheme = themes[theme];

    // Memoized handlers for better performance
    const handleScreenChange = useCallback((screen) => {
        setActiveScreen(screen);
        if (isMobile) {
            setSidebarVisible(false);
        }
    }, [isMobile]);

    const handleSidebarToggle = useCallback(() => {
        setSidebarVisible(prev => !prev);
    }, []);

    const handleSidebarClose = useCallback(() => {
        setSidebarVisible(false);
    }, []);

    // Memoized styles for better performance
    const containerStyle = useMemo(() => [
        styles.container,
        { backgroundColor: tTheme.background },
        PlatformUtils.getStyles(
            { minHeight: '100vh' }, // Web
            { flex: 1 }, // Mobile
            { flex: 1 } // Android
        )
    ], [tTheme.background]);

    const sidebarStyle = useMemo(() => {
        const baseStyle = isMobile ? styles.sidebarMobile : styles.sidebarDesktop;
        const platformStyle = PlatformUtils.getStyles(
            { 
                position: isMobile ? 'fixed' : 'relative',
                height: isMobile ? '100vh' : 'auto',
                zIndex: isMobile ? 1000 : 'auto'
            },
            {},
            { elevation: isMobile ? 10 : 0 }
        );
        
        return [
            baseStyle,
            platformStyle,
            { width: getSidebarWidth() },
            isMobile && !isSidebarVisible && { left: '-100%' }
        ].filter(Boolean);
    }, [isMobile, isSidebarVisible, getSidebarWidth]);

    // If no user is logged in, show the login screen
    if (!user) {
        return <LoginScreen />;
    }

    // Determine if the sidebar should be visible based on screen size and state
    const showSidebar = !isMobile || isSidebarVisible;

    return (
        <View style={containerStyle}>
            {showSidebar && (
                <View style={sidebarStyle}>
                    <Sidebar 
                        activeScreen={activeScreen} 
                        setActiveScreen={handleScreenChange} 
                        onClose={handleSidebarClose}
                        onToggle={handleSidebarToggle}
                        responsive={responsive}
                    />
                </View>
            )}
            
            <View style={[styles.content, { flex: 1 }]}>
                <MainContent screen={activeScreen} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        ...PlatformUtils.getStyles(
            { 
                minHeight: '100vh',
                overflow: 'hidden'
            },
            { flex: 1 },
            { flex: 1 }
        ),
    },
    sidebarDesktop: {
        // Width is controlled by the Sidebar component itself
        ...PlatformUtils.getStyles(
            { height: '100vh' },
            {},
            {}
        ),
    },
    sidebarMobile: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
        elevation: 10,
        ...PlatformUtils.getStyles(
            { 
                position: 'fixed',
                height: '100vh',
                zIndex: 1000
            },
            {
                position: 'absolute',
                height: '100%'
            },
            {
                position: 'absolute',
                height: '100%',
                elevation: 15
            }
        ),
    },
    content: {
        flex: 1,
        ...PlatformUtils.getStyles(
            { 
                overflow: 'auto',
                height: '100vh'
            },
            { flex: 1 },
            { flex: 1 }
        ),
    },
});