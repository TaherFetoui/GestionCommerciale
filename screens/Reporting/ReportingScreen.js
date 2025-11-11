import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { useReporting } from '../../context/ReportingContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ReportingScreen() {
    const navigation = useNavigation();
    const { theme, language } = useAuth();
    const { selectClient, selectSupplier, setReportType } = useReporting();
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedType, setSelectedType] = useState('client');
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(false);

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];

    useEffect(() => {
        fetchClients();
        fetchSuppliers();
    }, []);

    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setClients(data || []);
        }
    };

    const fetchSuppliers = async () => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setSuppliers(data || []);
        }
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        setSelectedId('');
        setReportType(type);
    };

    const handleViewReport = () => {
        console.log('=== handleViewReport called ===');
        console.log('selectedId:', selectedId);
        console.log('selectedType:', selectedType);
        
        if (!selectedId) {
            Alert.alert(
                t.warning || 'Attention',
                `Veuillez sélectionner un ${selectedType === 'client' ? 'client' : 'fournisseur'}`
            );
            return;
        }

        const selected = selectedType === 'client'
            ? clients.find(c => c.id === selectedId || c.id.toString() === selectedId)
            : suppliers.find(s => s.id === selectedId || s.id.toString() === selectedId);

        console.log('selected:', selected);

        if (selected) {
            if (selectedType === 'client') {
                console.log('Navigating to ClientReport with:', { clientId: selectedId, clientName: selected.name });
                selectClient(selected);
                navigation.navigate('ClientReport', { clientId: selectedId, clientName: selected.name });
            } else {
                console.log('Navigating to SupplierReport with:', { supplierId: selectedId, supplierName: selected.name });
                selectSupplier(selected);
                navigation.navigate('SupplierReport', { supplierId: selectedId, supplierName: selected.name });
            }
        } else {
            console.log('ERROR: selected is null/undefined');
            Alert.alert('Erreur', 'Impossible de trouver l\'élément sélectionné');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <View style={[localStyles.card, { backgroundColor: tTheme.cardBackground }]}>
                <View style={localStyles.header}>
                    <Ionicons name="analytics-outline" size={32} color={tTheme.primary} />
                    <Text style={[localStyles.title, { color: tTheme.text }]}>
                        Reporting
                    </Text>
                </View>

                <View style={localStyles.typeSelector}>
                    <TouchableOpacity
                        style={[
                            localStyles.typeButton,
                            { borderColor: tTheme.border },
                            selectedType === 'client' && { 
                                backgroundColor: tTheme.primary,
                                borderColor: tTheme.primary
                            }
                        ]}
                        onPress={() => handleTypeChange('client')}
                    >
                        <Ionicons 
                            name="people-outline" 
                            size={24} 
                            color={selectedType === 'client' ? '#fff' : tTheme.text} 
                        />
                        <Text style={[
                            localStyles.typeButtonText,
                            { color: selectedType === 'client' ? '#fff' : tTheme.text }
                        ]}>
                            Clients
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            localStyles.typeButton,
                            { borderColor: tTheme.border },
                            selectedType === 'supplier' && { 
                                backgroundColor: tTheme.primary,
                                borderColor: tTheme.primary
                            }
                        ]}
                        onPress={() => handleTypeChange('supplier')}
                    >
                        <Ionicons 
                            name="business-outline" 
                            size={24} 
                            color={selectedType === 'supplier' ? '#fff' : tTheme.text} 
                        />
                        <Text style={[
                            localStyles.typeButtonText,
                            { color: selectedType === 'supplier' ? '#fff' : tTheme.text }
                        ]}>
                            Fournisseurs
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={localStyles.selectionSection}>
                    <Text style={[localStyles.label, { color: tTheme.text }]}>
                        Sélectionner {selectedType === 'client' ? 'un client' : 'un fournisseur'}
                    </Text>
                    
                    <View style={[localStyles.pickerContainer, { 
                        borderColor: tTheme.border,
                        backgroundColor: tTheme.inputBackground 
                    }]}>
                        <Picker
                            selectedValue={selectedId}
                            onValueChange={(itemValue) => setSelectedId(itemValue)}
                            style={[localStyles.picker, { color: tTheme.text }]}
                            dropdownIconColor={tTheme.text}
                        >
                            <Picker.Item label="-- Choisir --" value="" />
                            {(selectedType === 'client' ? clients : suppliers).map(item => (
                                <Picker.Item 
                                    key={item.id} 
                                    label={item.name} 
                                    value={item.id.toString()} 
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        localStyles.viewButton,
                        { backgroundColor: tTheme.success },
                        !selectedId && localStyles.viewButtonDisabled
                    ]}
                    onPress={handleViewReport}
                    disabled={!selectedId}
                >
                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                    <Text style={localStyles.viewButtonText}>
                        Voir les transactions
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    card: {
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        gap: 8,
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectionSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
    },
    viewButtonDisabled: {
        opacity: 0.5,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
