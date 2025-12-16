import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import {
    ModernSearchBar,
    ModernTable
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ClientsListScreen() {
    const navigation = useNavigation();
    const { theme, language } = useAuth();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching clients:', error);
        } else {
            setClients(data || []);
            setFilteredClients(data || []);
        }
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchClients();
        setRefreshing(false);
    }, []);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredClients(clients);
        } else {
            const filtered = clients.filter(client =>
                client.name?.toLowerCase().includes(text.toLowerCase()) ||
                client.email?.toLowerCase().includes(text.toLowerCase()) ||
                client.phone?.includes(text)
            );
            setFilteredClients(filtered);
        }
    };

    const handleClientPress = (client) => {
        navigation.navigate('ClientReport', {
            clientId: client.id,
            clientName: client.name
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: tTheme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[styles.text, { color: tTheme.text, marginTop: 10 }]}>
                    Chargement des clients...
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
                {/* Search */}
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholder="Rechercher un client..."
                        theme={theme}
                    />
                </View>

                {/* Clients Table */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={localStyles.tableWrapper}
                    contentContainerStyle={{ minWidth: '100%' }}
                >
                    <View style={{ flex: 1, minWidth: isMobile ? 700 : '100%' }}>
                        <ModernTable
                            data={filteredClients}
                            columns={[
                                {
                                    key: 'name',
                                    label: 'Client',
                                    flex: 2,
                                    render: (row) => (
                                        <View>
                                            <Text style={{ color: tTheme.text, fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
                                                {row.name}
                                            </Text>
                                            {row.matricule_fiscale && (
                                                <Text style={{ color: tTheme.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                                                    MF: {row.matricule_fiscale}
                                                </Text>
                                            )}
                                        </View>
                                    ),
                                },
                                {
                                    key: 'email',
                                    label: 'Email',
                                    flex: 1.5,
                                    render: (row) => (
                                        <Text style={{ color: tTheme.textSecondary, fontSize: 13 }} numberOfLines={1}>
                                            {row.email || '-'}
                                        </Text>
                                    ),
                                },
                                {
                                    key: 'phone',
                                    label: 'Téléphone',
                                    flex: 1.2,
                                    render: (row) => (
                                        <Text style={{ color: tTheme.textSecondary, fontSize: 13 }} numberOfLines={1}>
                                            {row.phone || '-'}
                                        </Text>
                                    ),
                                },
                                {
                                    key: 'address',
                                    label: 'Adresse',
                                    flex: 1.5,
                                    render: (row) => (
                                        <Text style={{ color: tTheme.textSecondary, fontSize: 13 }} numberOfLines={1}>
                                            {row.address || '-'}
                                        </Text>
                                    ),
                                },
                                {
                                    key: 'actions',
                                    label: 'Actions',
                                    flex: 0.8,
                                    render: (row) => (
                                        <TouchableOpacity
                                            style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleClientPress(row);
                                            }}
                                        >
                                            <Ionicons name="eye-outline" size={18} color={tTheme.primary} />
                                        </TouchableOpacity>
                                    ),
                                },
                            ]}
                            onRowPress={handleClientPress}
                            theme={theme}
                            loading={loading}
                            emptyMessage="Aucun client trouvé"
                        />
                    </View>
                </ScrollView>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    filtersContainer: {
        marginBottom: 20,
    },
    tableWrapper: {
        marginBottom: 20,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
