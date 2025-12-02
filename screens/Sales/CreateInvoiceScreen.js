import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// Modern Form Components (removed React.memo to fix TextInput focus issues)
const FormSection = ({ title, children, theme, rightButton }) => {
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.section]}>
            <View style={localStyles.sectionHeader}>
                <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>{title}</Text>
                {rightButton}
            </View>
            {children}
        </View>
    );
};

const FormInput = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
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
                    style={[localStyles.textInput, { color: tTheme.text, flex: 1, minHeight: multiline ? 80 : 44 }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={tTheme.textSecondary}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={multiline ? numberOfLines : 1}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    blurOnSubmit={false}
                    onSubmitEditing={undefined}
                />
            </View>
        </View>
    );
};

const DatePicker = ({ label, date, onDateChange, theme }) => {
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
};

const SelectPicker = ({ label, selectedValue, onValueChange, options, theme, placeholder }) => {
    const tTheme = themes[theme];
    const selectedOption = options.find(opt => opt.value === selectedValue);
    const displayText = selectedOption ? selectedOption.label : placeholder;
    
    return (
        <View style={localStyles.inputContainer}>
            <Text style={[getGlobalStyles(theme).label, { color: tTheme.text, marginBottom: 8, fontSize: 14, fontWeight: '600' }]}>
                {label}
            </Text>
            <View style={[
                localStyles.modernPickerWrapper,
                { 
                    backgroundColor: tTheme.card, 
                    borderColor: selectedValue ? tTheme.primary : tTheme.border,
                    borderWidth: selectedValue ? 2 : 1,
                }
            ]}>
                <View style={localStyles.pickerIconContainer}>
                    <Ionicons 
                        name="people-circle-outline" 
                        size={24} 
                        color={selectedValue ? tTheme.primary : tTheme.textSecondary} 
                    />
                </View>
                <View style={localStyles.pickerContent}>
                    <Text style={[
                        localStyles.pickerLabel,
                        { 
                            color: selectedValue ? tTheme.text : tTheme.textSecondary,
                            fontWeight: selectedValue ? '600' : '400'
                        }
                    ]}>
                        {displayText}
                    </Text>
                    <Picker
                        selectedValue={selectedValue}
                        onValueChange={onValueChange}
                        style={localStyles.hiddenPicker}
                        dropdownIconColor={tTheme.primary}
                    >
                        <Picker.Item 
                            label={placeholder} 
                            value="" 
                            color={tTheme.textSecondary}
                        />
                        {options.map(option => (
                            <Picker.Item 
                                key={option.value} 
                                label={option.label} 
                                value={option.value}
                                color={tTheme.text}
                            />
                        ))}
                    </Picker>
                </View>
                <View style={localStyles.pickerChevronContainer}>
                    <Ionicons 
                        name="chevron-down" 
                        size={20} 
                        color={tTheme.primary} 
                    />
                </View>
            </View>
        </View>
    );
};

const ActionButton = ({ onPress, icon, title, variant = 'primary', theme, loading = false }) => {
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
};

// LineItem Card Component - MOVED OUTSIDE to prevent re-creation on every render
const LineItemCard = ({ item, index, onItemChange, onRemoveItem, theme, tTheme, t, styles, lineItems }) => {
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
            
            {/* Description - Direct TextInput */}
            <View style={localStyles.inputContainer}>
                <Text style={[getGlobalStyles(theme).label, { color: tTheme.text }]}>
                    {t.description || 'Description'}
                </Text>
                <View style={[
                    localStyles.inputWrapper, 
                    { backgroundColor: tTheme.card, borderColor: tTheme.border }
                ]}>
                    <Ionicons name="document-text-outline" size={20} color={tTheme.textSecondary} style={localStyles.inputIcon} />
                    <TextInput
                        style={[localStyles.textInput, { 
                            color: tTheme.text, 
                            flex: 1, 
                            minHeight: 80,
                            maxHeight: 120,
                            paddingTop: 12
                        }]}
                        value={item.description}
                        onChangeText={(text) => onItemChange(index, 'description', text)}
                        placeholder={t.enterDescription || 'Enter item description'}
                        placeholderTextColor={tTheme.textSecondary}
                        multiline={true}
                        textAlignVertical="top"
                        autoCorrect={false}
                        autoCapitalize="sentences"
                        scrollEnabled={true}
                    />
                </View>
            </View>
            
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
};

// Summary Card Component - MOVED OUTSIDE to prevent re-creation on every render
const SummaryCard = ({ totalHT, totalVAT, totalTTC, vatSummary, fiscalStamp, setFiscalStamp, theme, tTheme, t, styles }) => (
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
);

export default function CreateInvoiceScreen({ navigation, route }) {
    const { user, theme, language } = useAuth();
    const { isDesktop, getColumns, getContentPadding } = useResponsive();
    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];
    
    // Check if editing existing invoice
    const invoiceToEdit = route?.params?.invoiceToEdit;
    const clientData = route?.params?.clientData;
    const isEditing = !!invoiceToEdit;
    
    // Form State
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(invoiceToEdit?.client_id || '');
    const [invoiceNumber, setInvoiceNumber] = useState(invoiceToEdit?.invoice_number || '');
    const [issueDate, setIssueDate] = useState(invoiceToEdit ? new Date(invoiceToEdit.issue_date) : new Date());
    const [dueDate, setDueDate] = useState(invoiceToEdit ? new Date(invoiceToEdit.due_date) : new Date(new Date().setDate(new Date().getDate() + 30)));
    const [paymentMethod, setPaymentMethod] = useState(invoiceToEdit?.payment_method || 'Chèque');
    const [lineItems, setLineItems] = useState(
        invoiceToEdit?.items || [{ ref: '', description: '', quantity: '1', unitPrice: '0', vatRate: '19' }]
    );
    const [fiscalStamp, setFiscalStamp] = useState(invoiceToEdit?.fiscal_stamp?.toString() || '1.000');
    
    // UI State
    const [loading, setLoading] = useState(false);
    
    // Update navigation title
    useEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Modifier Facture' : 'Nouvelle Facture'
        });
    }, [navigation, isEditing]);
    
    // Fetch clients and generate invoice number on component mount
    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('id, name');
            if (error) Alert.alert(t.error, error.message);
            else setClients(data);
        };
        fetchClients();
        
        // Auto-generate invoice number if creating new invoice
        if (!isEditing && !invoiceNumber) {
            const generateInvoiceNumber = async () => {
                // Get the latest invoice number to increment
                const { data, error } = await supabase
                    .from('invoices')
                    .select('invoice_number')
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (error) {
                    console.error('Error fetching last invoice:', error);
                }
                
                // Generate number like FA-251128-001
                const today = new Date();
                const year = today.getFullYear().toString().slice(-2);
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const dateStr = `${year}${month}${day}`;
                
                let sequence = 1;
                if (data && data.length > 0) {
                    const lastNumber = data[0].invoice_number;
                    // Extract sequence from last invoice if it matches today's date pattern
                    const match = lastNumber.match(/FA-\d{6}-(\d{3})/);
                    if (match && lastNumber.includes(dateStr)) {
                        sequence = parseInt(match[1], 10) + 1;
                    }
                }
                
                const newNumber = `FA-${dateStr}-${String(sequence).padStart(3, '0')}`;
                setInvoiceNumber(newNumber);
            };
            
            generateInvoiceNumber();
        }
    }, [t.error, isEditing, invoiceNumber]);
    
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
    const handleItemChange = useCallback((index, field, value) => {
        setLineItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    }, []);

    const handleAddItem = () => {
        setLineItems([...lineItems, { ref: '', description: '', quantity: '1', unitPrice: '0', vatRate: '19' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = lineItems.filter((_, i) => i !== index);
        setLineItems(newItems);
    };

    // --- Save Invoice ---
    const handleSaveInvoice = async () => {
        console.log('🔴 handleSaveInvoice CALLED');
        console.log('🔴 selectedClientId:', selectedClientId);
        console.log('🔴 invoiceNumber:', invoiceNumber);
        
        if (!selectedClientId || !invoiceNumber) {
            console.log('🔴 VALIDATION FAILED');
            Alert.alert(t.error, t.pleaseSelectClient);
            return;
        }
        
        console.log('🔴 Starting save process...');
        setLoading(true);
        
        const invoiceData = {
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
        };
        
        console.log('🔴 Invoice data:', invoiceData);
        
        let error;
        if (isEditing) {
            console.log('🔴 Updating existing invoice...');
            // Update existing invoice
            const result = await supabase
                .from('invoices')
                .update(invoiceData)
                .eq('id', invoiceToEdit.id);
            error = result.error;
            console.log('🔴 Update result:', result);
        } else {
            console.log('🔴 Creating new invoice...');
            // Create new invoice
            const result = await supabase
                .from('invoices')
                .insert([{ ...invoiceData, status: 'awaiting_payment' }]);
            error = result.error;
            console.log('🔴 Insert result:', result);
        }

        if (error) {
            console.error('🔴 Supabase error:', error);
            Alert.alert(t.error, error.message);
        } else {
            console.log('🔴 SUCCESS!');
            Alert.alert(
                t.success, 
                isEditing ? 'Facture modifiée avec succès' : t.invoiceCreated
            );
            if (isEditing) {
                // Navigate back to invoice list after editing
                navigation.navigate('InvoicesList');
            } else {
                // Go back after creating new invoice
                navigation.goBack();
            }
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
            <FormSection 
                title={t.lineItems || 'Line Items'} 
                theme={theme}
                rightButton={
                    <TouchableOpacity
                        onPress={handleAddItem}
                        style={[localStyles.addItemButton, { backgroundColor: tTheme.success }]}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                }
            >
                {lineItems.map((item, index) => (
                    <LineItemCard
                        key={`line-item-${index}`}
                        item={item}
                        index={index}
                        onItemChange={handleItemChange}
                        onRemoveItem={handleRemoveItem}
                        theme={theme}
                        tTheme={tTheme}
                        t={t}
                        styles={styles}
                        lineItems={lineItems}
                    />
                ))}
            </FormSection>

            {/* Summary */}
            <SummaryCard 
                totalHT={totalHT}
                totalVAT={totalVAT}
                totalTTC={totalTTC}
                vatSummary={vatSummary}
                fiscalStamp={fiscalStamp}
                setFiscalStamp={setFiscalStamp}
                theme={theme}
                tTheme={tTheme}
                t={t}
                styles={styles}
            />

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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    addItemButton: {
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
    
    // Modern Picker Styles
    modernPickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: 'relative',
    },
    pickerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pickerContent: {
        flex: 1,
        position: 'relative',
    },
    pickerLabel: {
        fontSize: 16,
        lineHeight: 24,
    },
    hiddenPicker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        width: '100%',
        height: '100%',
    },
    pickerChevronContainer: {
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