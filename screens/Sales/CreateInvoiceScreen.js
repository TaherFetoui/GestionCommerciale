import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

// Modern Form Components
const FormSection = React.memo(({ title, children, theme }) => {
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.section]}>
            <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>{title}</Text>
            {children}
        </View>
    );
});

const FormInput = React.memo(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    keyboardType = 'default',
    multiline = false,
    theme,
    error = false
}) => {
    const tTheme = themes[theme];
    return (
        <View style={localStyles.inputContainer}>
            <Text style={[getGlobalStyles(theme).label, { color: tTheme.text }]}>{label}</Text>
            <View style={[
                localStyles.inputWrapper, 
                { backgroundColor: tTheme.card, borderColor: error ? tTheme.danger : tTheme.border }
            ]}>
                {icon && <Ionicons name={icon} size={20} color={tTheme.textSecondary} style={localStyles.inputIcon} />}
                <TextInput
                    style={[localStyles.textInput, { color: tTheme.text, flex: 1 }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={tTheme.textSecondary}
                    keyboardType={keyboardType}
                    multiline={multiline}
                />
            </View>
        </View>
    );
});

const DatePicker = React.memo(({ label, date, onDateChange, theme }) => {
    const [showPicker, setShowPicker] = useState(false);
    const tTheme = themes[theme];

    const handleDateChange = useCallback((event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowPicker(Platform.OS === 'ios');
        onDateChange(currentDate);
    }, [date, onDateChange]);

    return (
        <View style={localStyles.inputContainer}>
            <Text style={[getGlobalStyles(theme).label, { color: tTheme.text }]}>{label}</Text>
            <TouchableOpacity 
                onPress={() => setShowPicker(true)}
                style={[localStyles.inputWrapper, { backgroundColor: tTheme.card, borderColor: tTheme.border }]}
            >
                <Ionicons name="calendar-outline" size={20} color={tTheme.textSecondary} style={localStyles.inputIcon} />
                <Text style={[localStyles.textInput, { color: tTheme.text }]}>
                    {date.toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color={tTheme.textSecondary} />
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker 
                    value={date} 
                    mode="date" 
                    display="default" 
                    onChange={handleDateChange} 
                />
            )}
        </View>
    );
});

const SelectPicker = React.memo(({ label, selectedValue, onValueChange, options, theme, placeholder }) => {
    const tTheme = themes[theme];
    return (
        <View style={localStyles.inputContainer}>
            <Text style={[getGlobalStyles(theme).label, { color: tTheme.text }]}>{label}</Text>
            <View style={[
                localStyles.inputWrapper, 
                localStyles.pickerWrapper,
                { backgroundColor: tTheme.card, borderColor: tTheme.border }
            ]}>
                <Ionicons name="person-outline" size={20} color={tTheme.textSecondary} style={localStyles.inputIcon} />
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    style={[localStyles.picker, { color: tTheme.text }]}
                >
                    <Picker.Item label={placeholder} value="" />
                    {options.map(option => (
                        <Picker.Item 
                            key={option.value} 
                            label={option.label} 
                            value={option.value} 
                        />
                    ))}
                </Picker>
            </View>
        </View>
    );
});

const ActionButton = React.memo(({ onPress, icon, title, variant = 'primary', theme, loading = false }) => {
    const tTheme = themes[theme];
    const buttonStyle = variant === 'primary' 
        ? { backgroundColor: tTheme.primary } 
        : variant === 'success'
        ? { backgroundColor: tTheme.success }
        : { backgroundColor: tTheme.danger };

    return (
        <TouchableOpacity 
            style={[localStyles.actionButton, buttonStyle]}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={tTheme.buttonText} size="small" />
            ) : (
                <Ionicons name={icon} size={20} color={tTheme.buttonText} />
            )}
            <Text style={[localStyles.actionButtonText, { color: tTheme.buttonText }]}>
                {loading ? 'Loading...' : title}
            </Text>
        </TouchableOpacity>
    );
});

export default function CreateInvoiceScreen({ navigation }) {
    const { user, theme, language } = useAuth();
    const { isDesktop, getColumns, getContentPadding } = useResponsive();
    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];
    // Form State
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [issueDate, setIssueDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
    const [paymentMethod, setPaymentMethod] = useState('Chèque');
    const [lineItems, setLineItems] = useState([{ ref: '', description: '', quantity: '1', unitPrice: '0', vatRate: '19' }]);
    const [fiscalStamp, setFiscalStamp] = useState('1.000');
    
    // UI State
    const [loading, setLoading] = useState(false);
    
    // Add LineItem component
    const LineItemCard = React.memo(({ item, index, onItemChange, onRemoveItem }) => {
        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
        
        return (
            <View style={[styles.card, localStyles.lineItemCard]}>
                <View style={localStyles.lineItemHeader}>
                    <Text style={[localStyles.lineItemTitle, { color: tTheme.text }]}>
                        {t.article || 'Item'} #{index + 1}
                    </Text>
                    <TouchableOpacity 
                        onPress={() => onRemoveItem(index)}
                        style={[localStyles.removeButton, { backgroundColor: tTheme.danger }]}
                        disabled={lineItems.length === 1}
                    >
                        <Ionicons name="trash-outline" size={16} color={tTheme.buttonText} />
                    </TouchableOpacity>
                </View>
                
                <FormInput
                    label={t.description || 'Description'}
                    value={item.description}
                    onChangeText={(val) => onItemChange(index, 'description', val)}
                    placeholder={t.enterDescription || 'Enter item description'}
                    icon="document-text-outline"
                    theme={theme}
                    multiline={true}
                />
                
                <View style={localStyles.lineItemRow}>
                    <View style={localStyles.lineItemField}>
                        <FormInput
                            label={t.quantity || 'Qty'}
                            value={item.quantity}
                            onChangeText={(val) => onItemChange(index, 'quantity', val)}
                            placeholder="1"
                            icon="cube-outline"
                            theme={theme}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={localStyles.lineItemField}>
                        <FormInput
                            label={t.unitPrice || 'Unit Price'}
                            value={item.unitPrice}
                            onChangeText={(val) => onItemChange(index, 'unitPrice', val)}
                            placeholder="0.000"
                            icon="pricetag-outline"
                            theme={theme}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={localStyles.lineItemField}>
                        <FormInput
                            label="VAT %"
                            value={item.vatRate}
                            onChangeText={(val) => onItemChange(index, 'vatRate', val)}
                            placeholder="19"
                            icon="calculator-outline"
                            theme={theme}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                
                <View style={[localStyles.itemTotal, { backgroundColor: tTheme.primarySoft }]}>
                    <Text style={[localStyles.itemTotalText, { color: tTheme.primary }]}>
                        Total: {itemTotal.toFixed(3)} TND
                    </Text>
                </View>
            </View>
        );
    });

    // Fetch clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('id, name');
            if (error) Alert.alert('Error fetching clients', error.message);
            else setClients(data);
        };
        fetchClients();
    }, []);
    
    // --- Automatic Calculations ---
    const { totalHT, totalVAT, totalTTC, vatSummary } = useMemo(() => {
        let ht = 0;
        let vat = 0;
        const summary = {};

        lineItems.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const itemHT = quantity * unitPrice;
            const vatRate = parseFloat(item.vatRate) || 0;
            const itemVAT = itemHT * (vatRate / 100);

            ht += itemHT;
            vat += itemVAT;

            if (summary[vatRate]) {
                summary[vatRate].base += itemHT;
                summary[vatRate].amount += itemVAT;
            } else {
                summary[vatRate] = { base: itemHT, amount: itemVAT };
            }
        });

        const stamp = parseFloat(fiscalStamp) || 0;
        const ttc = ht + vat + stamp;
        
        return { totalHT: ht, totalVAT: vat, totalTTC: ttc, vatSummary: summary };
    }, [lineItems, fiscalStamp]);

    // --- Line Item Handlers ---
    const handleItemChange = (index, field, value) => {
        const newItems = [...lineItems];
        newItems[index][field] = value;
        setLineItems(newItems);
    };

    const handleAddItem = () => {
        setLineItems([...lineItems, { ref: '', description: '', quantity: '1', unitPrice: '0', vatRate: '19' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = lineItems.filter((_, i) => i !== index);
        setLineItems(newItems);
    };

    // Summary Component
    const SummaryCard = React.memo(() => (
        <View style={[styles.card, localStyles.summaryCard]}>
            <Text style={[localStyles.sectionTitle, { color: tTheme.text, marginBottom: 20 }]}>
                {t.summary || 'Invoice Summary'}
            </Text>
            
            <View style={localStyles.summaryContent}>
                <View style={localStyles.summaryRow}>
                    <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                        Total HT (excl. VAT)
                    </Text>
                    <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                        {totalHT.toFixed(3)} TND
                    </Text>
                </View>
                
                {Object.entries(vatSummary).map(([rate, totals]) => (
                    <View key={rate} style={localStyles.summaryRow}>
                        <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                            VAT ({rate}%) on {totals.base.toFixed(3)} TND
                        </Text>
                        <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                            {totals.amount.toFixed(3)} TND
                        </Text>
                    </View>
                ))}
                
                <View style={localStyles.summaryRow}>
                    <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                        Fiscal Stamp
                    </Text>
                    <View style={localStyles.fiscalStampInput}>
                        <TextInput
                            style={[localStyles.fiscalInput, { color: tTheme.text, borderColor: tTheme.border }]}
                            value={fiscalStamp}
                            onChangeText={setFiscalStamp}
                            keyboardType="numeric"
                            placeholder="1.000"
                            placeholderTextColor={tTheme.textSecondary}
                        />
                        <Text style={[localStyles.currency, { color: tTheme.textSecondary }]}>TND</Text>
                    </View>
                </View>
                
                <View style={[localStyles.divider, { backgroundColor: tTheme.border }]} />
                
                <View style={[localStyles.summaryRow, localStyles.totalRow]}>
                    <Text style={[localStyles.totalLabel, { color: tTheme.text }]}>
                        Total TTC (incl. VAT)
                    </Text>
                    <Text style={[localStyles.totalValue, { color: tTheme.primary }]}>
                        {totalTTC.toFixed(3)} TND
                    </Text>
                </View>
            </View>
        </View>
    ));

    // --- Save Invoice ---
    const handleSaveInvoice = async () => {
        if (!selectedClientId || !invoiceNumber) {
            Alert.alert('Error', 'Please select a client and enter an invoice number.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('invoices').insert([{
            user_id: user.id,
            client_id: selectedClientId,
            invoice_number: invoiceNumber,
            issue_date: issueDate.toISOString(),
            due_date: dueDate.toISOString(),
            payment_method: paymentMethod,
            items: lineItems, // Save all items as JSON
            fiscal_stamp: parseFloat(fiscalStamp) || 0,
            total_ht: totalHT,
            total_vat: totalVAT,
            total_amount: totalTTC, // Total TTC goes into the main amount column
            status: 'awaiting_payment',
        }]);

        if (error) {
            Alert.alert('Error creating invoice', error.message);
        } else {
            Alert.alert('Success', 'Invoice created!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <ScrollView 
            style={[styles.container, { padding: getContentPadding() }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Invoice Header */}
            <FormSection title={t.createInvoice || 'Create Invoice'} theme={theme}>
                <View style={isDesktop ? localStyles.desktopRow : localStyles.mobileColumn}>
                    <View style={isDesktop ? localStyles.desktopField : null}>
                        <FormInput
                            label={t.invoiceNumber || 'Invoice Number'}
                            value={invoiceNumber}
                            onChangeText={setInvoiceNumber}
                            placeholder="FA250103"
                            icon="document-outline"
                            theme={theme}
                        />
                    </View>
                    <View style={isDesktop ? localStyles.desktopField : null}>
                        <FormInput
                            label={t.paymentMethod || 'Payment Method'}
                            value={paymentMethod}
                            onChangeText={setPaymentMethod}
                            placeholder="Chèque, Virement..."
                            icon="card-outline"
                            theme={theme}
                        />
                    </View>
                </View>
                
                <View style={isDesktop ? localStyles.desktopRow : localStyles.mobileColumn}>
                    <View style={isDesktop ? localStyles.desktopField : null}>
                        <DatePicker
                            label={t.issueDate || 'Issue Date'}
                            date={issueDate}
                            onDateChange={setIssueDate}
                            theme={theme}
                        />
                    </View>
                    <View style={isDesktop ? localStyles.desktopField : null}>
                        <DatePicker
                            label={t.dueDate || 'Due Date'}
                            date={dueDate}
                            onDateChange={setDueDate}
                            theme={theme}
                        />
                    </View>
                </View>
                
                <SelectPicker
                    label={t.client || 'Client'}
                    selectedValue={selectedClientId}
                    onValueChange={setSelectedClientId}
                    options={clients.map(client => ({
                        label: client.name,
                        value: client.id
                    }))}
                    placeholder="-- Select a Client --"
                    theme={theme}
                />
            </FormSection>

            {/* Line Items */}
            <FormSection title={t.lineItems || 'Line Items'} theme={theme}>
                {lineItems.map((item, index) => (
                    <LineItemCard
                        key={index}
                        item={item}
                        index={index}
                        onItemChange={handleItemChange}
                        onRemoveItem={handleRemoveItem}
                    />
                ))}
                
                <ActionButton
                    onPress={handleAddItem}
                    icon="add-circle-outline"
                    title={t.addItem || 'Add Item'}
                    variant="success"
                    theme={theme}
                />
            </FormSection>

            {/* Summary */}
            <SummaryCard />

            {/* Save Button */}
            <View style={localStyles.saveButtonContainer}>
                <ActionButton
                    onPress={handleSaveInvoice}
                    icon="save-outline"
                    title={loading ? (t.saving || 'Saving...') : (t.saveInvoice || 'Save Invoice')}
                    variant="primary"
                    theme={theme}
                    loading={loading}
                />
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    // Section styles
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    
    // Form input styles
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        fontSize: 16,
        minHeight: 20,
    },
    pickerWrapper: {
        paddingVertical: 0,
        paddingHorizontal: 12,
    },
    picker: {
        flex: 1,
        marginLeft: 8,
    },
    
    // Line item styles
    lineItemCard: {
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    lineItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    lineItemTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lineItemRow: {
        flexDirection: 'row',
        gap: 12,
    },
    lineItemField: {
        flex: 1,
    },
    itemTotal: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    itemTotalText: {
        fontSize: 16,
        fontWeight: '600',
    },
    
    // Summary styles
    summaryCard: {
        marginBottom: 24,
    },
    summaryContent: {
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 16,
        flex: 1,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
    },
    fiscalStampInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fiscalInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        textAlign: 'right',
        minWidth: 80,
    },
    currency: {
        fontSize: 16,
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    totalRow: {
        paddingVertical: 16,
        paddingTop: 16,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'right',
    },
    
    // Action button styles
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonContainer: {
        marginBottom: 32,
        paddingTop: 16,
    },
    
    // Responsive layouts
    desktopRow: {
        flexDirection: 'row',
        gap: 16,
    },
    desktopField: {
        flex: 1,
    },
    mobileColumn: {
        flexDirection: 'column',
    },
});