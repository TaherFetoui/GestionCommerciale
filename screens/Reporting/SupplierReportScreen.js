import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions
} from 'react-native';
import {
    ModernStatusBadge,
    ModernTable
} from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { useReporting } from '../../context/ReportingContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SupplierReportScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { supplierId, supplierName } = route.params;
    const { theme, language } = useAuth();
    const { selectedSupplier } = useReporting();
    
    const [supplier, setSupplier] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        transactionCount: 0
    });

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        if (supplierId) {
            loadSupplierData();
        }
    }, [supplierId]);

    const loadSupplierData = async () => {
        setLoading(true);
        const supplierData = await fetchSupplierDetails();
        if (supplierData) {
            await fetchTransactions(supplierData);
        }
        setLoading(false);
    };

    const fetchSupplierDetails = async () => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', supplierId)
            .single();

        if (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
            return null;
        } else {
            setSupplier(data);
            return data;
        }
    };

    const fetchTransactions = async (supplierData) => {
        try {
            const supplierNameValue = supplierData?.name || route.params?.supplierName || '';

            // Récupérer les bons de commande
            const { data: purchaseOrders, error: poError } = await supabase
                .from('purchase_orders')
                .select('*')
                .eq('supplier_id', supplierId)
                .order('created_at', { ascending: false });

            if (poError) throw poError;

            // Récupérer les retenues à la source fournisseurs
            const { data: returns, error: returnsError } = await supabase
                .from('supplier_returns')
                .select('*')
                .eq('supplier', supplierNameValue)
                .order('retention_date', { ascending: false });

            if (returnsError) console.log('Erreur retenues:', returnsError);

            // Récupérer les ordres de paiement fournisseurs
            const { data: payments, error: paymentsError } = await supabase
                .from('supplier_payment_orders')
                .select('*')
                .eq('supplier', supplierNameValue)
                .order('payment_date', { ascending: false });

            if (paymentsError) console.log('Erreur paiements:', paymentsError);

            // Récupérer les chèques émis au fournisseur
            const { data: checks, error: checksError } = await supabase
                .from('checks')
                .select('*')
                .eq('check_type', 'issued')
                .eq('client_supplier', supplierNameValue)
                .order('issue_date', { ascending: false });

            if (checksError) console.log('Erreur chèques:', checksError);

            // Combiner et formater TOUTES les transactions
            const allTransactions = [
                // Bons de commande (montants à payer)
                ...(purchaseOrders || []).map(po => ({
                    id: `purchase-${po.id}`,
                    date: po.created_at,
                    type: 'Bon de commande',
                    reference: po.order_number,
                    amount: parseFloat(po.total_amount || 0),
                    isDebit: true, // Nous devons payer
                    status: po.status || 'draft',
                    description: po.notes || 'Commande d\'achat'
                })),
                // Retenues à la source (montants retenus)
                ...(returns || []).map(ret => ({
                    id: `return-${ret.id}`,
                    date: ret.retention_date,
                    type: 'Retenue à la source',
                    reference: ret.invoice_number,
                    amount: parseFloat(ret.retention_amount || 0),
                    isDebit: false, // Montant retenu sur paiement
                    status: ret.status || 'pending',
                    description: `Retenue ${ret.retention_rate}% - ${ret.note || 'TVA'}`
                })),
                // Paiements effectués
                ...(payments || []).map(pay => ({
                    id: `payment-${pay.id}`,
                    date: pay.payment_date || pay.created_at,
                    type: 'Paiement',
                    reference: pay.order_number,
                    amount: parseFloat(pay.amount || 0),
                    isDebit: false, // Décaissement
                    status: pay.status || 'pending',
                    description: `${pay.payment_method || 'Paiement'} - ${pay.note || ''}`
                })),
                // Chèques émis
                ...(checks || []).map(chk => ({
                    id: `check-${chk.id}`,
                    date: chk.issue_date,
                    type: 'Chèque émis',
                    reference: chk.check_number,
                    amount: parseFloat(chk.amount || 0),
                    isDebit: false, // Décaissement
                    status: chk.status || 'pending',
                    description: `${chk.bank_name} - Échéance: ${new Date(chk.due_date).toLocaleDateString()}`
                }))
            ];

            // Trier par date (plus récent en premier)
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(allTransactions);
            calculateStats(allTransactions);
        } catch (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
        }
    };

    const calculateStats = (data) => {
        // Total des bons de commande (montants à payer)
        const totalOrders = data
            .filter(t => t.type === 'Bon de commande' && t.status !== 'draft' && t.status !== 'cancelled')
            .reduce((sum, t) => sum + t.amount, 0);

        // Total payé (paiements + chèques encaissés)
        const totalPaid = data
            .filter(t => 
                (t.type === 'Paiement' && (t.status === 'paid' || t.status === 'approved')) ||
                (t.type === 'Chèque émis' && t.status === 'encashed')
            )
            .reduce((sum, t) => sum + t.amount, 0);

        // Retenues à la source
        const totalRetained = data
            .filter(t => t.type === 'Retenue à la source' && t.status === 'paid')
            .reduce((sum, t) => sum + t.amount, 0);

        // Montant restant = Total commandes - (Paiements + Retenues)
        const remaining = totalOrders - (totalPaid + totalRetained);
        
        setStats({
            total: totalOrders,
            paid: totalPaid + totalRetained,
            unpaid: remaining > 0 ? remaining : 0,
            transactionCount: data.length
        });
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSupplierData();
        setRefreshing(false);
    }, [supplierId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
            case 'received':
            case 'encashed':
            case 'approved':
                return tTheme.success;
            case 'pending':
            case 'ordered':
            case 'deposited':
                return tTheme.warning;
            case 'draft':
            case 'cancelled':
                return tTheme.textSecondary;
            case 'bounced':
            case 'rejected':
                return tTheme.danger;
            default:
                return tTheme.primary;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid':
                return 'Payé';
            case 'received':
                return 'Reçu';
            case 'encashed':
                return 'Encaissé';
            case 'approved':
                return 'Approuvé';
            case 'pending':
                return 'En attente';
            case 'ordered':
                return 'Commandé';
            case 'deposited':
                return 'Déposé';
            case 'draft':
                return 'Brouillon';
            case 'cancelled':
                return 'Annulé';
            case 'bounced':
                return 'Impayé';
            case 'rejected':
                return 'Rejeté';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[styles.text, { color: tTheme.textSecondary, marginTop: 16 }]}>
                    Chargement...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView 
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                {/* Supplier Info Header */}
                <View style={[localStyles.supplierHeader, { backgroundColor: tTheme.card }]}>
                    <Text style={[localStyles.supplierName, { color: tTheme.text }]}>
                        {supplierName || supplier?.name}
                    </Text>
                    {supplier?.email && (
                        <Text style={[localStyles.supplierEmail, { color: tTheme.textSecondary }]}>
                            {supplier.email}
                        </Text>
                    )}
                </View>

                <View style={localStyles.statsGrid}>
                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="document-text-outline" size={24} color={tTheme.primary} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Transactions
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.text }]}>
                        {stats.transactionCount}
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="receipt-outline" size={24} color={tTheme.primary} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Total Commandes
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.text }]}>
                        {stats.total.toFixed(2)} DH
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={tTheme.success} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Décaissé
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.success }]}>
                        {stats.paid.toFixed(2)} DH
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="time-outline" size={24} color={tTheme.danger} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Reste à Payer
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.danger }]}>
                        {stats.unpaid.toFixed(2)} DH
                    </Text>
                </View>
            </View>

            {/* Transactions Table */}
            <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>
                Historique des transactions
            </Text>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={localStyles.tableWrapper}
                contentContainerStyle={{ minWidth: '100%' }}
            >
                <View style={{ flex: 1, minWidth: isMobile ? 800 : '100%' }}>
                    <ModernTable
                        data={transactions}
                        columns={[
                            {
                                key: 'date',
                                label: 'Date',
                                flex: 1.2,
                                render: (row) => (
                                    <Text style={{ color: tTheme.textSecondary, fontSize: 12 }}>
                                        {new Date(row.date).toLocaleDateString('fr-FR')}
                                    </Text>
                                ),
                            },
                            {
                                key: 'type',
                                label: 'Type',
                                flex: 1.2,
                                render: (row) => (
                                    <View>
                                        <Text style={{ color: tTheme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
                                            {row.type}
                                        </Text>
                                        <Text style={{ color: tTheme.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                                            {row.reference}
                                        </Text>
                                    </View>
                                ),
                            },
                            {
                                key: 'description',
                                label: 'Description',
                                flex: 1.8,
                                render: (row) => (
                                    <Text style={{ color: tTheme.textSecondary, fontSize: 12 }} numberOfLines={2}>
                                        {row.description || '-'}
                                    </Text>
                                ),
                            },
                            {
                                key: 'amount',
                                label: 'Montant',
                                flex: 1,
                                render: (row) => (
                                    <Text style={{ color: tTheme.text, fontWeight: 'bold', fontSize: 13, textAlign: 'right' }}>
                                        {row.amount.toFixed(3)} TND
                                    </Text>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Statut',
                                flex: 1,
                                render: (row) => {
                                    const statusConfig = {
                                        'paid': { label: 'Payé', variant: 'success' },
                                        'received': { label: 'Reçu', variant: 'success' },
                                        'encashed': { label: 'Encaissé', variant: 'success' },
                                        'approved': { label: 'Approuvé', variant: 'success' },
                                        'pending': { label: 'En attente', variant: 'warning' },
                                        'ordered': { label: 'Commandé', variant: 'warning' },
                                        'deposited': { label: 'Déposé', variant: 'warning' },
                                        'draft': { label: 'Brouillon', variant: 'default' },
                                        'cancelled': { label: 'Annulé', variant: 'default' },
                                        'bounced': { label: 'Impayé', variant: 'error' },
                                        'rejected': { label: 'Rejeté', variant: 'error' },
                                    };
                                    const config = statusConfig[row.status] || { label: row.status, variant: 'default' };
                                    return <ModernStatusBadge label={config.label} variant={config.variant} />;
                                },
                            },
                        ]}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucune transaction trouvée"
                    />
                </View>
            </ScrollView>

            </ScrollView>
            
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                theme={theme}
                onHide={() => setToast({ ...toast, visible: false })}
            />
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    supplierHeader: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    supplierName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    supplierEmail: {
        fontSize: 14,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 8,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 8,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 8,
    },
    tableWrapper: {
        marginBottom: 20,
    },
});
