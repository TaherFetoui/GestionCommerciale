import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SuppliersListScreen() {
    const navigation = useNavigation();
    const { theme, language } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching suppliers:', error);
        } else {
            setSuppliers(data || []);
            setFilteredSuppliers(data || []);
        }
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSuppliers();
        setRefreshing(false);
    }, []);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredSuppliers(suppliers);
        } else {
            const filtered = suppliers.filter(supplier =>
                supplier.name?.toLowerCase().includes(text.toLowerCase()) ||
                supplier.email?.toLowerCase().includes(text.toLowerCase()) ||
                supplier.phone?.includes(text)
            );
            setFilteredSuppliers(filtered);
        }
    };

    const handleSupplierPress = (supplier) => {
        navigation.navigate('SupplierReport', {
            supplierId: supplier.id,
            supplierName: supplier.name
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: tTheme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[styles.text, { color: tTheme.text, marginTop: 10 }]}>
                    Chargement des fournisseurs...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <View style={[localStyles.header, { backgroundColor: tTheme.cardBackground }]}>
                <View style={localStyles.titleContainer}>
                    <Ionicons name="business-outline" size={32} color={tTheme.primary} />
                    <Text style={[localStyles.title, { color: tTheme.text }]}>
                        Reporting Fournisseurs
                    </Text>
                </View>
                <Text style={[localStyles.subtitle, { color: tTheme.textSecondary }]}>
                    Sélectionnez un fournisseur pour voir ses transactions
                </Text>
            </View>

            <View style={localStyles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={tTheme.textSecondary} />
                <TextInput
                    style={[localStyles.searchInput, { color: tTheme.text }]}
                    placeholder="Rechercher un fournisseur..."
                    placeholderTextColor={tTheme.textSecondary}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Ionicons name="close-circle" size={20} color={tTheme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredSuppliers.length === 0 ? (
                    <View style={localStyles.emptyContainer}>
                        <Ionicons name="business-outline" size={64} color={tTheme.textSecondary} />
                        <Text style={[localStyles.emptyText, { color: tTheme.textSecondary }]}>
                            {searchQuery ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur disponible'}
                        </Text>
                    </View>
                ) : (
                    <View style={localStyles.suppliersList}>
                        {filteredSuppliers.map((supplier) => (
                            <TouchableOpacity
                                key={supplier.id}
                                style={[localStyles.supplierCard, { backgroundColor: tTheme.cardBackground }]}
                                onPress={() => handleSupplierPress(supplier)}
                            >
                                <View style={[localStyles.supplierIcon, { backgroundColor: tTheme.primary + '20' }]}>
                                    <Ionicons name="business" size={24} color={tTheme.primary} />
                                </View>
                                <View style={localStyles.supplierInfo}>
                                    <Text style={[localStyles.supplierName, { color: tTheme.text }]}>
                                        {supplier.name}
                                    </Text>
                                    {supplier.email && (
                                        <Text style={[localStyles.supplierDetail, { color: tTheme.textSecondary }]}>
                                            <Ionicons name="mail-outline" size={14} /> {supplier.email}
                                        </Text>
                                    )}
                                    {supplier.phone && (
                                        <Text style={[localStyles.supplierDetail, { color: tTheme.textSecondary }]}>
                                            <Ionicons name="call-outline" size={14} /> {supplier.phone}
                                        </Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={tTheme.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    header: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 12,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    suppliersList: {
        padding: 16,
        paddingTop: 0,
    },
    supplierCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    supplierIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    supplierInfo: {
        flex: 1,
    },
    supplierName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    supplierDetail: {
        fontSize: 13,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
