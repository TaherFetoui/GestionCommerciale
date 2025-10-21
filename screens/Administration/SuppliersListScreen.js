import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    ModernSearchBar,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SuppliersListScreen() {
    const navigation = useNavigation();
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setSuppliers(data || []);
            setFilteredSuppliers(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchSuppliers();
        }, [fetchSuppliers])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateSupplier')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSuppliers();
        setRefreshing(false);
    }, [fetchSuppliers]);

    // Filter suppliers based on search
    React.useEffect(() => {
        if (searchQuery) {
            setFilteredSuppliers(
                suppliers.filter(
                    (supplier) =>
                        supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        supplier.phone?.includes(searchQuery)
                )
            );
        } else {
            setFilteredSuppliers(suppliers);
        }
    }, [searchQuery, suppliers]);

    const tableColumns = [
        {
            key: 'name',
            label: 'Nom',
            flex: 1.5,
            render: (row) => (
                <View>
                    <Text style={[localStyles.supplierName, { color: tTheme.text }]} numberOfLines={1}>
                        {row.name}
                    </Text>
                    {row.email && (
                        <Text style={[localStyles.supplierEmail, { color: tTheme.textSecondary }]} numberOfLines={1}>
                            {row.email}
                        </Text>
                    )}
                </View>
            ),
        },
        {
            key: 'phone',
            label: 'Téléphone',
            flex: 1,
            render: (row) => (
                <Text style={{ color: tTheme.text }} numberOfLines={1}>
                    {row.phone || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'address',
            label: 'Adresse',
            flex: 1.5,
            render: (row) => (
                <Text style={{ color: tTheme.textSecondary }} numberOfLines={2}>
                    {row.address || 'Aucune adresse'}
                </Text>
            ),
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                <View style={localStyles.searchContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher un fournisseur (nom, email, téléphone)..."
                        theme={theme}
                    />
                </View>

                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredSuppliers}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun fournisseur trouvé. Créez votre premier fournisseur."
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    headerButton: {
        marginRight: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    scrollContent: {
        padding: 20,
    },
    searchContainer: {
        marginBottom: 20,
    },
    tableWrapper: {
        marginBottom: 20,
    },
    supplierName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    supplierEmail: {
        fontSize: 12,
        marginTop: 2,
    },
});