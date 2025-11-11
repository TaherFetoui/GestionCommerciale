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
            <View style={[localStyles.header, { backgroundColor: tTheme.cardBackground }]}>
                <View style={localStyles.titleContainer}>
                    <Ionicons name="people-outline" size={32} color={tTheme.primary} />
                    <Text style={[localStyles.title, { color: tTheme.text }]}>
                        Reporting Clients
                    </Text>
                </View>
                <Text style={[localStyles.subtitle, { color: tTheme.textSecondary }]}>
                    Sélectionnez un client pour voir ses transactions
                </Text>
            </View>

            <View style={localStyles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={tTheme.textSecondary} />
                <TextInput
                    style={[localStyles.searchInput, { color: tTheme.text }]}
                    placeholder="Rechercher un client..."
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
                {filteredClients.length === 0 ? (
                    <View style={localStyles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={tTheme.textSecondary} />
                        <Text style={[localStyles.emptyText, { color: tTheme.textSecondary }]}>
                            {searchQuery ? 'Aucun client trouvé' : 'Aucun client disponible'}
                        </Text>
                    </View>
                ) : (
                    <View style={localStyles.clientsList}>
                        {filteredClients.map((client) => (
                            <TouchableOpacity
                                key={client.id}
                                style={[localStyles.clientCard, { backgroundColor: tTheme.cardBackground }]}
                                onPress={() => handleClientPress(client)}
                            >
                                <View style={[localStyles.clientIcon, { backgroundColor: tTheme.primary + '20' }]}>
                                    <Ionicons name="person" size={24} color={tTheme.primary} />
                                </View>
                                <View style={localStyles.clientInfo}>
                                    <Text style={[localStyles.clientName, { color: tTheme.text }]}>
                                        {client.name}
                                    </Text>
                                    {client.email && (
                                        <Text style={[localStyles.clientDetail, { color: tTheme.textSecondary }]}>
                                            <Ionicons name="mail-outline" size={14} /> {client.email}
                                        </Text>
                                    )}
                                    {client.phone && (
                                        <Text style={[localStyles.clientDetail, { color: tTheme.textSecondary }]}>
                                            <Ionicons name="call-outline" size={14} /> {client.phone}
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
    clientsList: {
        padding: 16,
        paddingTop: 0,
    },
    clientCard: {
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
    clientIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    clientDetail: {
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
