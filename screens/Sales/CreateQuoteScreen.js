import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    FormActions,
    FormCard,
    FormInput,
    FormPicker,
    FormSecondaryButton,
    FormSubmitButton,
    ModernFormModal
} from '../../components/ModernForm';
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
    const [items, setItems] = useState([{ description: '', quantity: '1', unitPrice: '0' }]);
    const [loading, setLoading] = useState(false);
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('id, name').eq('user_id', user.id);
            if (error) {
                setToast({ visible: true, message: error.message, type: 'error' });
            } else {
                setClients(data);
            }
        };
        fetchClients();
    }, [user.id]);

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

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: '1', unitPrice: '0' }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSaveQuote = async () => {
        if (!selectedClientId || !quoteNumber) {
            setToast({
                visible: true,
                message: 'Client et numéro de devis sont requis.',
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
                                onPress={handleAddItem}
                                style={[localStyles.addButton, { backgroundColor: tTheme.success }]}
                            >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        }
                    >
                        {items.map((item, index) => (
                            <View 
                                key={index}
                                style={[localStyles.itemCard, { 
                                    backgroundColor: tTheme.background,
                                    borderColor: tTheme.border
                                }]}
                            >
                                <View style={localStyles.itemHeader}>
                                    <Text style={[localStyles.itemNumber, { color: tTheme.textSecondary }]}>
                                        Article #{index + 1}
                                    </Text>
                                    {items.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveItem(index)}
                                            style={localStyles.removeButton}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <FormInput
                                    label="Description"
                                    value={item.description}
                                    onChangeText={(val) => handleItemChange(index, 'description', val)}
                                    placeholder="Description de l'article"
                                    icon="document-text"
                                    multiline
                                    theme={theme}
                                />

                                <View style={localStyles.itemRow}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <FormInput
                                            label="Quantité"
                                            value={item.quantity}
                                            onChangeText={(val) => handleItemChange(index, 'quantity', val)}
                                            placeholder="1"
                                            icon="cube"
                                            keyboardType="numeric"
                                            theme={theme}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <FormInput
                                            label="Prix unitaire"
                                            value={item.unitPrice}
                                            onChangeText={(val) => handleItemChange(index, 'unitPrice', val)}
                                            placeholder="0.000"
                                            icon="pricetag"
                                            keyboardType="numeric"
                                            theme={theme}
                                        />
                                    </View>
                                </View>

                                <View style={[localStyles.subtotal, { backgroundColor: tTheme.primarySoft }]}>
                                    <Text style={[localStyles.subtotalText, { color: tTheme.primary }]}>
                                        Sous-total: {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(3)} TND
                                    </Text>
                                </View>
                            </View>
                        ))}
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
    itemCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemNumber: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    removeButton: {
        padding: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    subtotal: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    subtotalText: {
        fontSize: 16,
        fontWeight: '600',
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
});