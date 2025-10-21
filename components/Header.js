import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

export default function Header({ title, navigation, onToggleSidebar, rightActions }) {
    const { theme, user } = useAuth();
    const { isMobile, getContentPadding } = useResponsive();
    const tTheme = themes[theme];
    const username = user?.email ? user.email.split('@')[0] : 'Guest';
    const canGoBack = navigation?.canGoBack();
    const padding = getContentPadding();

    return (
        <View style={[
            styles.container, 
            { 
                backgroundColor: tTheme.card, 
                borderBottomColor: tTheme.border,
                paddingHorizontal: padding
            }
        ]}>
            <View style={styles.leftContainer}>
                {/* Show menu button on mobile IF it's the first screen */}
                {isMobile && !canGoBack && (
                    <TouchableOpacity onPress={onToggleSidebar} style={{ marginRight: 16 }}>
                        <Ionicons name="menu-outline" size={28} color={tTheme.text} />
                    </TouchableOpacity>
                )}
                {/* Show back button if we can go back */}
                {canGoBack && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Ionicons name="arrow-back-outline" size={24} color={tTheme.primary} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.title, { color: tTheme.text }]}>{title}</Text>
            </View>
            <View style={styles.rightContainer}>
                {/* Custom right actions for specific screens */}
                {rightActions && rightActions}
                {!rightActions && (
                    <>
                        <Ionicons name="notifications-outline" size={24} color={tTheme.textSecondary} style={{marginRight: 20}} />
                        <View style={[styles.avatar, {backgroundColor: tTheme.primarySoft}]}>
                            <Text style={{color: tTheme.primary, fontWeight: 'bold'}}>{username.charAt(0).toUpperCase()}</Text>
                        </View>
                    </>
                )}
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
        borderBottomWidth: 1,
        flexShrink: 0,
        paddingVertical: 8,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
        marginRight: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        minWidth: 0,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }
});