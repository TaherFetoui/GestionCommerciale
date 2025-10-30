import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function FinanceScreen() {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Simulate refresh
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const financeModules = [
        {
            id: 'supplier-returns',
            title: 'Retenues à la source fournisseurs',
            icon: 'receipt-outline',
            color: '#FF6B6B',
            route: 'SupplierReturns',
            description: 'Gestion des retenues fiscales sur paiements fournisseurs'
        },
        {
            id: 'client-returns',
            title: 'Retenues à la source clients',
            icon: 'receipt',
            color: '#4ECDC4',
            route: 'ClientReturns',
            description: 'Gestion des retenues fiscales sur encaissements clients'
        },
        {
            id: 'supplier-payment-orders',
            title: 'Ordres de paiement fournisseurs',
            icon: 'document-text-outline',
            color: '#95E1D3',
            route: 'SupplierPaymentOrders',
            description: 'Création et suivi des ordres de paiement fournisseurs'
        },
        {
            id: 'client-payment-orders',
            title: 'Ordres de paiement clients',
            icon: 'document-text',
            color: '#F38181',
            route: 'ClientPaymentOrders',
            description: 'Création et suivi des ordres de paiement clients'
        },
        {
            id: 'payment-slips',
            title: 'Bordereaux de versement',
            icon: 'folder-outline',
            color: '#AA96DA',
            route: 'PaymentSlips',
            description: 'Gestion des bordereaux de remise bancaire'
        },
        {
            id: 'bank-accounts',
            title: 'Agences bancaires\\caisses',
            icon: 'business-outline',
            color: '#FCBAD3',
            route: 'BankAccounts',
            description: 'Configuration des comptes bancaires et caisses'
        },
        {
            id: 'supplier-fiscal-year',
            title: 'Début exercice fournisseur',
            icon: 'calendar-outline',
            color: '#A8D8EA',
            route: 'SupplierFiscalYear',
            description: 'Paramétrage exercice comptable fournisseurs'
        },
        {
            id: 'client-fiscal-year',
            title: 'Début exercice client',
            icon: 'calendar',
            color: '#FFAAA5',
            route: 'ClientFiscalYear',
            description: 'Paramétrage exercice comptable clients'
        },
        {
            id: 'cash-session',
            title: 'Session de caisse',
            icon: 'cash-outline',
            color: '#FF8B94',
            route: 'CashSession',
            description: 'Ouverture/fermeture de caisse et gestion des fonds'
        },
        {
            id: 'checks',
            title: 'Chèques',
            icon: 'card-outline',
            color: '#C7CEEA',
            route: 'Checks',
            description: 'Suivi et encaissement des chèques clients'
        },
    ];

    const renderModuleCard = (module) => (
        <TouchableOpacity
            key={module.id}
            style={[localStyles.moduleCard, { backgroundColor: tTheme.card, ...tTheme.shadow.medium }]}
            onPress={() => navigation.navigate(module.route)}
            activeOpacity={0.7}
        >
            <View style={[localStyles.iconContainer, { backgroundColor: module.color + '20' }]}>
                <Ionicons name={module.icon} size={32} color={module.color} />
            </View>
            <View style={localStyles.moduleContent}>
                <Text style={[localStyles.moduleTitle, { color: tTheme.text }]}>
                    {module.title}
                </Text>
                <Text style={[localStyles.moduleDescription, { color: tTheme.textSecondary }]}>
                    {module.description}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={tTheme.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Quick Stats */}
                <View style={localStyles.statsContainer}>
                    <View style={[localStyles.statCard, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <Ionicons name="trending-up" size={24} color="#4CAF50" />
                        <Text style={[localStyles.statValue, { color: tTheme.text }]}>0 DT</Text>
                        <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>Encaissements</Text>
                    </View>
                    <View style={[localStyles.statCard, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <Ionicons name="trending-down" size={24} color="#F44336" />
                        <Text style={[localStyles.statValue, { color: tTheme.text }]}>0 DT</Text>
                        <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>Décaissements</Text>
                    </View>
                    <View style={[localStyles.statCard, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <Ionicons name="wallet" size={24} color="#2196F3" />
                        <Text style={[localStyles.statValue, { color: tTheme.text }]}>0 DT</Text>
                        <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>Solde</Text>
                    </View>
                </View>

                {/* Finance Modules */}
                <View style={localStyles.modulesContainer}>
                    <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>
                        Modules Financiers
                    </Text>
                    {financeModules.map(renderModuleCard)}
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 24,
        paddingTop: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    modulesContainer: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    moduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    moduleContent: {
        flex: 1,
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    moduleDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
});
