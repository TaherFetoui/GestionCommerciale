import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    FormActions,
    FormCard,
    FormInput,
    FormPicker,
    FormSecondaryButton,
    FormSubmitButton,
    ModernFormModal
} from '../../components/ModernForm';
import { ModernSearchBar } from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CreateQuoteScreen({ navigation }) {
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const globalStyles = getGlobalStyles(theme);

    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [quoteNumber, setQuoteNumber] = useState('');
    const [issueDate, setIssueDate] = useState(new Date());
    const [expiryDate, setExpiryDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [availableArticles, setAvailableArticles] = useState([]);
    const [articleSearchQuery, setArticleSearchQuery] = useState('');
    const [loadingArticles, setLoadingArticles] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('user_id', user.id);
            
            if (clientsError) {
                setToast({ visible: true, message: clientsError.message, type: 'error' });
            } else {
                setClients(clientsData);
            }

            // Generate quote number
            const { data: lastQuote } = await supabase
                .from('quotes')
                .select('quote_number')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (lastQuote && lastQuote.quote_number) {
                const match = lastQuote.quote_number.match(/DEV-(\d+)/);
                if (match) {
                    const nextNumber = parseInt(match[1]) + 1;
                    setQuoteNumber(`DEV-${String(nextNumber).padStart(3, '0')}`);
                } else {
                    setQuoteNumber('DEV-001');
                }
            } else {
                setQuoteNumber('DEV-001');
            }

            // Fetch available articles
            fetchArticles();
        };
        fetchInitialData();
    }, [user.id]);

    const fetchArticles = async () => {
        setLoadingArticles(true);
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('user_id', user.id)
            .order('name');
        
        if (!error && data) {
            setAvailableArticles(data);
        }
        setLoadingArticles(false);
    };

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            return sum + (quantity * unitPrice);
        }, 0);
    }, [items]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddArticle = (article) => {
        const newItem = {
            article_id: article.id,
            description: article.name,
            quantity: 1,
            unitPrice: parseFloat(article.price) || 0,
        };
        setItems([...items, newItem]);
        setShowArticleModal(false);
        setArticleSearchQuery('');
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const filteredAvailableArticles = useMemo(() => {
        if (!articleSearchQuery) return availableArticles;
        return availableArticles.filter(article =>
            article.name?.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
            article.reference?.toLowerCase().includes(articleSearchQuery.toLowerCase())
        );
    }, [availableArticles, articleSearchQuery]);

    const handleSaveQuote = async () => {
        if (!selectedClientId) {
            setToast({
                visible: true,
                message: 'Veuillez sélectionner un client.',
                type: 'error',
            });
            return;
        }

        if (items.length === 0) {
            setToast({
                visible: true,
                message: 'Veuillez ajouter au moins un article.',
                type: 'error',
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('quotes').insert([{
            user_id: user.id,
            client_id: selectedClientId,
            quote_number: quoteNumber,
            issue_date: issueDate.toISOString(),
            expiry_date: expiryDate.toISOString(),
            items: items,
            total_amount: totalAmount,
            status: 'sent',
        }]);

        if (error) {
            setToast({
                visible: true,
                message: error.message,
                type: 'error',
            });
        } else {
            setToast({
                visible: true,
                message: 'Devis créé avec succès!',
                type: 'success',
            });
            setTimeout(() => navigation.goBack(), 1500);
        }
        setLoading(false);
    };

    const handleDateChange = (type, event, selectedDate) => {
        if (type === 'issue') {
            setShowIssueDatePicker(Platform.OS === 'ios');
            if (selectedDate) setIssueDate(selectedDate);
        } else {
            setShowExpiryDatePicker(Platform.OS === 'ios');
            if (selectedDate) setExpiryDate(selectedDate);
        }
    };

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                theme={theme}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ModernFormModal
                visible={true}
                onClose={() => navigation.goBack()}
                title="Créer un Devis"
                theme={theme}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FormCard title="Informations du devis" icon="document-text" theme={theme}>
                        <FormInput
                            label="Numéro de Devis"
                            value={quoteNumber}
                            onChangeText={setQuoteNumber}
                            placeholder="DEV-001"
                            icon="barcode"
                            required
                            editable={false}
                            theme={theme}
                        />

                        <FormPicker
                            label="Client"
                            selectedValue={selectedClientId}
                            onValueChange={setSelectedClientId}
                            items={clients.map(c => ({ label: c.name, value: c.id }))}
                            placeholder="-- Sélectionner un client --"
                            icon="person"
                            required
                            theme={theme}
                        />

                        {/* Date Pickers */}
                        <View style={localStyles.inputContainer}>
                            <Text style={[globalStyles.label, { color: tTheme.text }]}>
                                Date d'émission <Text style={{ color: '#EF4444' }}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowIssueDatePicker(true)}
                                style={[localStyles.dateButton, { 
                                    backgroundColor: tTheme.card, 
                                    borderColor: tTheme.border 
                                }]}
                            >
                                <Ionicons name="calendar" size={20} color={tTheme.primary} style={{ marginRight: 12 }} />
                                <Text style={[localStyles.dateText, { color: tTheme.text }]}>
                                    {issueDate.toLocaleDateString('fr-FR')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showIssueDatePicker && (
                            <DateTimePicker
                                value={issueDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => handleDateChange('issue', event, date)}
                            />
                        )}

                        <View style={localStyles.inputContainer}>
                            <Text style={[globalStyles.label, { color: tTheme.text }]}>
                                Date d'expiration <Text style={{ color: '#EF4444' }}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowExpiryDatePicker(true)}
                                style={[localStyles.dateButton, { 
                                    backgroundColor: tTheme.card, 
                                    borderColor: tTheme.border 
                                }]}
                            >
                                <Ionicons name="calendar" size={20} color={tTheme.primary} style={{ marginRight: 12 }} />
                                <Text style={[localStyles.dateText, { color: tTheme.text }]}>
                                    {expiryDate.toLocaleDateString('fr-FR')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showExpiryDatePicker && (
                            <DateTimePicker
                                value={expiryDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => handleDateChange('expiry', event, date)}
                            />
                        )}
                    </FormCard>

                    <FormCard 
                        title="Articles" 
                        icon="list" 
                        theme={theme}
                        rightButton={
                            <TouchableOpacity
                                onPress={() => setShowArticleModal(true)}
                                style={[localStyles.addButton, { backgroundColor: tTheme.primary }]}
                            >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        }
                    >
                        {items.length === 0 ? (
                            <View style={localStyles.emptyState}>
                                <Ionicons name="cube-outline" size={48} color={tTheme.textSecondary} />
                                <Text style={[localStyles.emptyText, { color: tTheme.textSecondary }]}>
                                    Aucun article ajouté
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowArticleModal(true)}
                                    style={[localStyles.emptyButton, { backgroundColor: tTheme.primary }]}
                                >
                                    <Text style={localStyles.emptyButtonText}>Ajouter un article</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            items.map((item, index) => (
                                <View 
                                    key={index}
                                    style={[localStyles.itemCard, { 
                                        backgroundColor: tTheme.background,
                                        borderColor: tTheme.border
                                    }]}
                                >
                                    <View style={localStyles.itemHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[localStyles.itemName, { color: tTheme.text }]}>
                                                {item.description}
                                            </Text>
                                            <Text style={[localStyles.itemNumber, { color: tTheme.textSecondary }]}>
                                                Article #{index + 1}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveItem(index)}
                                            style={[localStyles.removeButton, { backgroundColor: '#EF444415' }]}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={localStyles.itemRow}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <FormInput
                                                label="Quantité"
                                                value={String(item.quantity)}
                                                onChangeText={(val) => handleItemChange(index, 'quantity', parseFloat(val) || 1)}
                                                placeholder="1"
                                                icon="cube"
                                                keyboardType="numeric"
                                                theme={theme}
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <FormInput
                                                label="Prix unitaire"
                                                value={String(item.unitPrice)}
                                                onChangeText={(val) => handleItemChange(index, 'unitPrice', parseFloat(val) || 0)}
                                                placeholder="0.000"
                                                icon="pricetag"
                                                keyboardType="numeric"
                                                theme={theme}
                                            />
                                        </View>
                                    </View>

                                    <View style={[localStyles.subtotal, { backgroundColor: tTheme.primary + '15' }]}>
                                        <Text style={[localStyles.subtotalText, { color: tTheme.primary }]}>
                                            Sous-total: {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(3)} TND
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </FormCard>

                    {/* Total Summary */}
                    <View style={[localStyles.summaryCard, { 
                        backgroundColor: tTheme.card,
                        borderColor: tTheme.border
                    }]}>
                        <View style={localStyles.summaryRow}>
                            <Text style={[localStyles.summaryLabel, { color: tTheme.text }]}>
                                Total
                            </Text>
                            <Text style={[localStyles.summaryValue, { color: tTheme.primary }]}>
                                {totalAmount.toFixed(3)} TND
                            </Text>
                        </View>
                    </View>

                    <FormActions>
                        <FormSecondaryButton
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                            theme={theme}
                        >
                            Annuler
                        </FormSecondaryButton>
                        <FormSubmitButton
                            onPress={handleSaveQuote}
                            loading={loading}
                            theme={theme}
                        >
                            {loading ? t.saving : 'Créer le devis'}
                        </FormSubmitButton>
                    </FormActions>
                </ScrollView>
            </ModernFormModal>

            {/* Article Selection Modal */}
            <Modal
                visible={showArticleModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowArticleModal(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalHeader, { borderBottomColor: tTheme.border }]}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                                Sélectionner un article
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowArticleModal(false)}
                                style={localStyles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={localStyles.modalBody}>
                            <ModernSearchBar
                                value={articleSearchQuery}
                                onChangeText={setArticleSearchQuery}
                                placeholder="Rechercher un article..."
                                theme={theme}
                            />

                            {loadingArticles ? (
                                <View style={localStyles.loadingContainer}>
                                    <ActivityIndicator size="large" color={tTheme.primary} />
                                </View>
                            ) : (
                                <ScrollView style={localStyles.articlesList}>
                                    {filteredAvailableArticles.length === 0 ? (
                                        <View style={localStyles.emptyState}>
                                            <Ionicons name="cube-outline" size={48} color={tTheme.textSecondary} />
                                            <Text style={[localStyles.emptyText, { color: tTheme.textSecondary }]}>
                                                Aucun article disponible
                                            </Text>
                                        </View>
                                    ) : (
                                        filteredAvailableArticles.map((article) => (
                                            <TouchableOpacity
                                                key={article.id}
                                                style={[localStyles.articleItem, { 
                                                    backgroundColor: tTheme.background,
                                                    borderColor: tTheme.border
                                                }]}
                                                onPress={() => handleAddArticle(article)}
                                            >
                                                <View style={[localStyles.articleIcon, { backgroundColor: tTheme.primary + '15' }]}>
                                                    <Ionicons name="cube" size={24} color={tTheme.primary} />
                                                </View>
                                                <View style={localStyles.articleInfo}>
                                                    <Text style={[localStyles.articleName, { color: tTheme.text }]}>
                                                        {article.name}
                                                    </Text>
                                                    {article.reference && (
                                                        <Text style={[localStyles.articleReference, { color: tTheme.textSecondary }]}>
                                                            Réf: {article.reference}
                                                        </Text>
                                                    )}
                                                    <Text style={[localStyles.articlePrice, { color: tTheme.primary }]}>
                                                        {parseFloat(article.price || 0).toFixed(3)} TND
                                                    </Text>
                                                </View>
                                                <Ionicons name="add-circle" size={28} color={tTheme.primary} />
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const localStyles = StyleSheet.create({
    inputContainer: {
        marginBottom: 20,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
    },
    dateText: {
        fontSize: 16,
        flex: 1,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
        marginBottom: 20,
    },
    emptyButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    itemCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    itemNumber: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    removeButton: {
        padding: 8,
        borderRadius: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    subtotal: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    subtotalText: {
        fontSize: 15,
        fontWeight: '700',
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    articlesList: {
        marginTop: 16,
    },
    articleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    articleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    articleInfo: {
        flex: 1,
    },
    articleName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    articleReference: {
        fontSize: 13,
        marginBottom: 4,
    },
    articlePrice: {
        fontSize: 15,
        fontWeight: '700',
    },
});