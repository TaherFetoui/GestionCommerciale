import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CreateDeliveryNoteScreen({ navigation }) {
    const { user, theme, language } = useAuth();
    const t = translations[language];
    const globalStyles = getGlobalStyles(theme);

    const [clients, setClients] = useState([]);
    const [articles, setArticles] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [noteNumber, setNoteNumber] = useState('');
    const [status, setStatus] = useState('pending');
    const [lineItems, setLineItems] = useState([{ item_id: null, item_name: '', quantity: '1' }]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    useEffect(() => {
        const fetchData = async () => {
            setInitialLoading(true);
            
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name');
                
            if (clientsError) {
                console.error('Error fetching clients:', clientsError);
                Alert.alert('Erreur', clientsError.message);
            } else {
                setClients(clientsData || []);
            }

            const { data: articlesData, error: articlesError } = await supabase
                .from('items')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name');
                
            if (articlesError) {
                console.error('Error fetching articles:', articlesError);
                Alert.alert('Erreur', articlesError.message);
            } else {
                setArticles(articlesData || []);
            }
            
            generateNoteNumber();
            setInitialLoading(false);
        };
        fetchData();
    }, [user.id]);

    const generateNoteNumber = async () => {
        const { data, error } = await supabase
            .from('delivery_notes')
            .select('note_number')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (!error && data && data.length > 0) {
            const lastNumber = data[0].note_number;
            const match = lastNumber.match(/(\d+)$/);
            if (match) {
                const nextNumber = parseInt(match[1]) + 1;
                setNoteNumber(`BL-${String(nextNumber).padStart(4, '0')}`);
            } else {
                setNoteNumber('BL-0001');
            }
        } else {
            setNoteNumber('BL-0001');
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...lineItems];
        newItems[index][field] = value;
        
        if (field === 'item_id') {
            const selectedArticle = articles.find(a => a.id === value);
            if (selectedArticle) {
                newItems[index]['item_name'] = selectedArticle.name;
            }
        }
        
        setLineItems(newItems);
    };

    const handleAddItem = () => {
        setLineItems([...lineItems, { item_id: null, item_name: '', quantity: '1' }]);
    };
    
    const handleRemoveItem = (index) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        } else {
            Alert.alert('Information', 'Vous devez avoir au moins un article.');
        }
    };

    const handleSave = async () => {
        if (!selectedClientId) {
            return Alert.alert('Champ requis', 'Veuillez sélectionner un client.');
        }
        if (!noteNumber.trim()) {
            return Alert.alert('Champ requis', 'Veuillez entrer un numéro de bon.');
        }
        
        const validItems = lineItems
            .filter(item => item.item_id)
            .map(item => ({
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: parseFloat(item.quantity) || 0,
            }));
        
        if (validItems.length === 0) {
            return Alert.alert('Articles requis', 'Veuillez sélectionner au moins un article.');
        }
        
        setLoading(true);
        
        try {
            const noteData = {
                user_id: user.id,
                client_id: selectedClientId,
                note_number: noteNumber.trim(),
                status: status,
                items: validItems,
            };
            
            const { error } = await supabase.from('delivery_notes').insert([noteData]);

            if (error) {
                console.error('Error creating delivery note:', error);
                setLoading(false);
                setToast({
                    visible: true,
                    message: 'Erreur lors de la création du bon de livraison',
                    type: 'error',
                });
            } else {
                setLoading(false);
                setToast({
                    visible: true,
                    message: 'Bon de livraison créé avec succès!',
                    type: 'success',
                });
                setTimeout(() => {
                    navigation.navigate('DeliveryNotesList');
                }, 1500);
            }
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
            setToast({
                visible: true,
                message: 'Une erreur est survenue',
                type: 'error',
            });
        }
    };

    if (initialLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
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
            <ModernFormModal
                visible={true}
                onClose={() => navigation.goBack()}
                title="Créer un Bon de Livraison"
                theme={theme}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FormCard title="Informations du bon" icon="document-text" theme={theme}>
                        <FormInput
                            label="Numéro de bon"
                            value={noteNumber}
                            onChangeText={setNoteNumber}
                            placeholder="Ex: BL-0001"
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

                        <FormPicker
                            label="Statut"
                            selectedValue={status}
                            onValueChange={setStatus}
                            items={[
                                { label: 'En attente', value: 'pending' },
                                { label: 'Livré', value: 'delivered' }
                            ]}
                            icon="flag"
                            theme={theme}
                        />
                    </FormCard>

                    <FormCard title="Articles" icon="list" theme={theme}>
                        {lineItems.map((item, index) => (
                            <View key={index} style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600' }}>
                                        Article #{index + 1}
                                    </Text>
                                    {lineItems.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <FormPicker
                                    label="Article"
                                    selectedValue={item.item_id}
                                    onValueChange={(val) => handleItemChange(index, 'item_id', val)}
                                    items={articles.map(a => ({ label: a.name, value: a.id }))}
                                    placeholder="-- Sélectionner un article --"
                                    icon="cube"
                                    theme={theme}
                                />

                                <FormInput
                                    label="Quantité"
                                    value={item.quantity}
                                    onChangeText={(val) => handleItemChange(index, 'quantity', val)}
                                    placeholder="1"
                                    icon="calculator"
                                    keyboardType="numeric"
                                    theme={theme}
                                />
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleAddItem}
                            style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                padding: 14,
                                borderRadius: 8,
                                backgroundColor: '#10B98115',
                                gap: 8,
                                marginTop: 4
                            }}
                        >
                            <Ionicons name="add-circle" size={22} color="#10B981" />
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#10B981' }}>
                                Ajouter un article
                            </Text>
                        </TouchableOpacity>
                    </FormCard>

                    <FormActions>
                        <FormSecondaryButton
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                            theme={theme}
                        >
                            Annuler
                        </FormSecondaryButton>
                        <FormSubmitButton
                            onPress={handleSave}
                            loading={loading}
                            theme={theme}
                        >
                            {loading ? 'Création...' : 'Créer le bon'}
                        </FormSubmitButton>
                    </FormActions>
                </ScrollView>
            </ModernFormModal>
        </>
    );
}
