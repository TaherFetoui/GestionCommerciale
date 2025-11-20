import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
    FormActions,
    FormCard,
    FormColumn,
    FormInput,
    FormPicker,
    FormRow,
    FormSecondaryButton,
    FormSubmitButton
} from '../../components/ModernForm';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CreateArticleScreen({ navigation }) {
    const [name, setName] = useState('');
    const [reference, setReference] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [vatRate, setVatRate] = useState('19');
    const [stock, setStock] = useState('0');
    const [supplierId, setSupplierId] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const globalStyles = getGlobalStyles(theme);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setInitialLoading(true);
        const { data, error } = await supabase
            .from('suppliers')
            .select('id, name')
            .eq('user_id', user.id)
            .order('name');
            
        if (error) {
            console.error('Error fetching suppliers:', error);
            setToast({ visible: true, message: 'Impossible de charger les fournisseurs', type: 'error' });
        } else {
            setSuppliers(data || []);
        }
        setInitialLoading(false);
    };

    const handleSave = async () => {
        if (!name || !salePrice) {
            setToast({ visible: true, message: 'Le nom et le prix de vente sont requis', type: 'error' });
            return;
        }
        
        setLoading(true);
        const { error } = await supabase
            .from('items')
            .insert([{ 
                user_id: user.id, 
                name, 
                reference, 
                sale_price: parseFloat(salePrice) || 0,
                purchase_price: parseFloat(purchasePrice) || 0,
                vat_rate: parseFloat(vatRate) || 0,
                stock_quantity: parseFloat(stock) || 0,
                supplier_id: supplierId || null,
            }]);

        if (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
            setLoading(false);
        } else {
            setToast({ visible: true, message: 'Article ajouté avec succès!', type: 'success' });
            setTimeout(() => {
                navigation.goBack();
            }, 1500);
        }
    };

    if (initialLoading) {
        return (
            <View style={[globalStyles.container, styles.centered, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[styles.loadingText, { color: tTheme.textSecondary }]}>Chargement...</Text>
            </View>
        );
    }

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                theme={theme}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ScrollView 
                style={[globalStyles.container, { backgroundColor: tTheme.background }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Informations de base */}
                    <FormCard title="Informations de base" icon="information-circle" theme={theme}>
                        <FormInput
                            label="Nom de l'article"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex: Ordinateur portable"
                            required
                            theme={theme}
                            icon="pricetag-outline"
                        />
                        
                        <FormInput
                            label="Référence"
                            value={reference}
                            onChangeText={setReference}
                            placeholder="Ex: REF-001"
                            theme={theme}
                            icon="barcode-outline"
                        />

                        <FormPicker
                            label="Fournisseur"
                            selectedValue={supplierId}
                            onValueChange={setSupplierId}
                            items={suppliers.map(s => ({ label: s.name, value: s.id }))}
                            placeholder="-- Sélectionner un fournisseur (optionnel) --"
                            theme={theme}
                            icon="business-outline"
                        />
                    </FormCard>

                    {/* Prix */}
                    <FormCard title="Prix" icon="cash" theme={theme}>
                        <FormRow>
                            <FormColumn>
                                <FormInput
                                    label="Prix de Vente"
                                    value={salePrice}
                                    onChangeText={setSalePrice}
                                    placeholder="0.000"
                                    keyboardType="numeric"
                                    required
                                    theme={theme}
                                    icon="trending-up"
                                />
                            </FormColumn>
                            <FormColumn>
                                <FormInput
                                    label="Prix d'Achat"
                                    value={purchasePrice}
                                    onChangeText={setPurchasePrice}
                                    placeholder="0.000"
                                    keyboardType="numeric"
                                    theme={theme}
                                    icon="trending-down"
                                />
                            </FormColumn>
                        </FormRow>

                        <FormRow>
                            <FormColumn>
                                <FormInput
                                    label="TVA (%)"
                                    value={vatRate}
                                    onChangeText={setVatRate}
                                    placeholder="19"
                                    keyboardType="numeric"
                                    theme={theme}
                                    icon="calculator"
                                />
                            </FormColumn>
                            <FormColumn>
                                <FormInput
                                    label="Stock Initial"
                                    value={stock}
                                    onChangeText={setStock}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    theme={theme}
                                    icon="cube"
                                />
                            </FormColumn>
                        </FormRow>
                    </FormCard>

                    {/* Actions */}
                    <FormActions>
                        <FormSecondaryButton
                            label="Annuler"
                            onPress={() => navigation.goBack()}
                            theme={theme}
                        />
                        <FormSubmitButton
                            label={loading ? 'Enregistrement...' : 'Enregistrer'}
                            onPress={handleSave}
                            loading={loading}
                            theme={theme}
                        />
                    </FormActions>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        marginTop: 12, 
        fontSize: 16 
    },
    content: {
        padding: 16,
    },
});