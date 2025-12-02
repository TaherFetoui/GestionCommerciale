import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { supabase } from '../lib/supabase';

export default function Header({ title, navigation, onToggleSidebar, rightActions }) {
    const { theme, user, toggleTheme, signOut } = useAuth();
    const { isMobile, getContentPadding } = useResponsive();
    const tTheme = themes[theme];
    const username = user?.email ? user.email.split('@')[0] : 'Guest';
    const canGoBack = navigation?.canGoBack();
    const padding = getContentPadding();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [activities, setActivities] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [companyLogo, setCompanyLogo] = useState(null);

    useEffect(() => {
        if (user) {
            fetchActivities();
            fetchCompanyLogo();
        }
    }, [user]);

    const fetchCompanyLogo = async () => {
        try {
            const { data, error } = await supabase
                .from('company_info')
                .select('logo_url')
                .eq('user_id', user.id)
                .single();
            
            if (data?.logo_url) {
                setCompanyLogo(data.logo_url);
            }
        } catch (error) {
            console.error('Error fetching company logo:', error);
        }
    };

    const fetchActivities = async () => {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Fetch recent data
            const [invoicesData, purchasesData, clientsData] = await Promise.all([
                supabase.from('invoices').select('*, client_id, invoice_number, created_at, status, total_amount, items').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('purchase_orders').select('*, order_number, created_at, status, total_amount, items').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('clients').select('id, name, created_at').eq('user_id', user.id).gte('created_at', startOfMonth.toISOString()).order('created_at', { ascending: false }).limit(3)
            ]);

            const activityList = [];

            // Add recent invoices
            invoicesData.data?.slice(0, 3).forEach(invoice => {
                const invoiceTotal = invoice.total_amount || 0;
                activityList.push({
                    icon: 'cart-outline',
                    color: '#10B981',
                    title: `Facture ${invoice.invoice_number}`,
                    time: formatTimeAgo(invoice.created_at),
                    amount: invoiceTotal.toFixed(3),
                    type: 'income'
                });
            });

            // Add recent purchases
            purchasesData.data?.slice(0, 2).forEach(purchase => {
                const purchaseTotal = purchase.total_amount || 0;
                activityList.push({
                    icon: 'download-outline',
                    color: '#EF4444',
                    title: `Achat ${purchase.order_number}`,
                    time: formatTimeAgo(purchase.created_at),
                    amount: purchaseTotal > 0 ? purchaseTotal.toFixed(3) : null,
                    type: 'expense'
                });
            });

            // Add new clients
            clientsData.data?.forEach(client => {
                activityList.push({
                    icon: 'person-add-outline',
                    color: '#3B82F6',
                    title: `Nouveau client - ${client.name}`,
                    time: formatTimeAgo(client.created_at),
                    type: 'info'
                });
            });

            // Sort by time
            activityList.sort((a, b) => {
                const timeA = parseTime(a.time);
                const timeB = parseTime(b.time);
                return timeA - timeB;
            });

            setActivities(activityList.slice(0, 8));
            setUnreadCount(activityList.length);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    const parseTime = (timeStr) => {
        if (timeStr.includes("instant")) return 0;
        if (timeStr.includes("min")) return parseInt(timeStr);
        if (timeStr.includes("h")) return parseInt(timeStr) * 60;
        if (timeStr.includes("j")) return parseInt(timeStr) * 1440;
        return 9999;
    };

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
                        <TouchableOpacity 
                            onPress={() => {
                                setShowNotifications(!showNotifications);
                                if (!showNotifications) setUnreadCount(0);
                            }}
                            style={styles.notificationButton}
                        >
                            <Ionicons name="notifications-outline" size={24} color={tTheme.textSecondary} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: tTheme.danger }]}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <TouchableOpacity 
                                    style={styles.menuOverlay} 
                                    onPress={() => setShowNotifications(false)}
                                    activeOpacity={1}
                                />
                                <View style={[styles.notificationsMenu, { 
                                    backgroundColor: tTheme.card,
                                    borderColor: tTheme.border,
                                    shadowColor: theme === 'dark' ? '#000' : '#000',
                                }]}>
                                    <View style={[styles.notifHeader, { borderBottomColor: tTheme.border }]}>
                                        <Text style={[styles.notifTitle, { color: tTheme.text }]}>
                                            Notifications
                                        </Text>
                                        <Ionicons name="time-outline" size={18} color={tTheme.primary} />
                                    </View>
                                    
                                    <ScrollView style={styles.notifScroll} showsVerticalScrollIndicator={false}>
                                        {activities.length === 0 ? (
                                            <View style={styles.emptyNotif}>
                                                <Ionicons name="notifications-off-outline" size={40} color={tTheme.border} />
                                                <Text style={[styles.emptyText, { color: tTheme.textSecondary }]}>
                                                    Aucune activité récente
                                                </Text>
                                            </View>
                                        ) : (
                                            activities.map((activity, index) => (
                                                <View key={index} style={[styles.notifItem, { borderBottomColor: tTheme.border }]}>
                                                    <View style={[
                                                        styles.notifIcon, 
                                                        { backgroundColor: activity.color + '20' }
                                                    ]}>
                                                        <Ionicons name={activity.icon} size={16} color={activity.color} />
                                                    </View>
                                                    <View style={styles.notifContent}>
                                                        <Text style={[styles.notifItemTitle, { color: tTheme.text }]} numberOfLines={2}>
                                                            {activity.title}
                                                        </Text>
                                                        <Text style={[styles.notifTime, { color: tTheme.textSecondary }]}>
                                                            {activity.time}
                                                        </Text>
                                                    </View>
                                                    {activity.amount && (
                                                        <Text style={[
                                                            styles.notifAmount, 
                                                            { color: activity.type === 'income' ? '#10B981' : '#EF4444' }
                                                        ]}>
                                                            {activity.type === 'income' ? '+' : '-'}{activity.amount}
                                                        </Text>
                                                    )}
                                                </View>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            </>
                        )}
                        
                        <TouchableOpacity onPress={() => setShowProfileMenu(!showProfileMenu)}>
                            {companyLogo ? (
                                <View style={[styles.logoAvatar, { borderColor: tTheme.primary }]}>
                                    <Image 
                                        source={{ uri: companyLogo }} 
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            ) : (
                                <View style={[styles.avatar, {backgroundColor: tTheme.primarySoft}]}>
                                    <Text style={{color: tTheme.primary, fontWeight: 'bold'}}>
                                        {username.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        
                        {/* Profile Dropdown Menu */}
                        {showProfileMenu && (
                            <>
                                <TouchableOpacity 
                                    style={styles.menuOverlay} 
                                    onPress={() => setShowProfileMenu(false)}
                                    activeOpacity={1}
                                />
                                <View style={[styles.dropdownMenu, { 
                                    backgroundColor: tTheme.card,
                                    borderColor: tTheme.border,
                                    shadowColor: theme === 'dark' ? '#000' : '#000',
                                }]}>
                                    <TouchableOpacity 
                                        style={[styles.menuItem, { borderBottomColor: tTheme.border }]}
                                        onPress={() => {
                                            toggleTheme();
                                            setShowProfileMenu(false);
                                        }}
                                    >
                                        <Ionicons 
                                            name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} 
                                            size={20} 
                                            color={tTheme.text} 
                                        />
                                        <Text style={[styles.menuText, { color: tTheme.text }]}>
                                            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setShowProfileMenu(false);
                                            signOut();
                                        }}
                                    >
                                        <Ionicons name="log-out-outline" size={20} color={tTheme.danger} />
                                        <Text style={[styles.menuText, { color: tTheme.danger }]}>Déconnexion</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
        gap: 12,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        lineHeight: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    logoAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#FFF',
        overflow: 'hidden',
    },
    logoImage: {
        width: 36,
        height: 36,
    },
    menuOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 54,
        right: 10,
        width: 200,
        borderRadius: 12,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 12,
    },
    notificationsMenu: {
        position: 'absolute',
        top: 54,
        right: 60,
        width: 380,
        maxHeight: 480,
        borderRadius: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
        zIndex: 1000,
        overflow: 'hidden',
    },
    notifHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    notifScroll: {
        maxHeight: 400,
    },
    emptyNotif: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        gap: 12,
    },
    notifIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    notifContent: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    notifItemTitle: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    notifTime: {
        fontSize: 12,
        opacity: 0.7,
    },
    notifAmount: {
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 0,
    },
});