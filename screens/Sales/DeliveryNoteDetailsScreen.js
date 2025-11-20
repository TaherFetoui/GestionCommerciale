import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function DeliveryNoteDetailsScreen({ route, navigation }) {
    const { noteId } = route.params;
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const globalStyles = getGlobalStyles(theme);

    const [note, setNote] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchNoteDetails();
    }, [noteId]);

    const fetchNoteDetails = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('delivery_notes')
            .select('*')
            .eq('id', noteId)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching delivery note:', error);
            Alert.alert('Erreur', 'Impossible de charger le bon de livraison');
            navigation.goBack();
        } else if (data) {
            setNote(data);
            if (data.client_id) {
                fetchClientDetails(data.client_id);
            }
        }
        setLoading(false);
    };

    const fetchClientDetails = async (clientId) => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (!error && data) {
            setClient(data);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        const { error } = await supabase
            .from('delivery_notes')
            .update({ status: newStatus })
            .eq('id', noteId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error updating status:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
        } else {
            setNote({ ...note, status: newStatus });
            Alert.alert('Succès', 'Statut mis à jour');
        }
        setUpdating(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return '#F59E0B';
            case 'delivered':
                return '#10B981';
            case 'cancelled':
                return '#EF4444';
            default:
                return tTheme.textSecondary;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return 'En attente';
            case 'delivered':
                return 'Livré';
            case 'cancelled':
                return 'Annulé';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[localStyles.loadingText, { color: tTheme.textSecondary }]}>Chargement...</Text>
            </View>
        );
    }

    if (!note) {
        return (
            <View style={[globalStyles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <Ionicons name="alert-circle-outline" size={48} color={tTheme.textSecondary} />
                <Text style={[localStyles.errorText, { color: tTheme.textSecondary }]}>
                    Bon de livraison introuvable
                </Text>
            </View>
        );
    }

    const items = note.items || [];
    const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

    return (
        <ScrollView 
            style={[globalStyles.container, { backgroundColor: tTheme.background }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={localStyles.content}>
                {/* Header Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.headerContent}>
                        <View>
                            <Text style={[localStyles.noteNumber, { color: tTheme.text }]}>
                                {note.note_number}
                            </Text>
                            <Text style={[localStyles.dateText, { color: tTheme.textSecondary }]}>
                                Créé le {new Date(note.created_at).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                        <View style={[localStyles.statusBadge, { backgroundColor: getStatusColor(note.status) + '20' }]}>
                            <Text style={[localStyles.statusText, { color: getStatusColor(note.status) }]}>
                                {getStatusLabel(note.status)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Client Info Card */}
                {client && (
                    <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <View style={localStyles.cardHeader}>
                            <Ionicons name="person" size={20} color={tTheme.primary} />
                            <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Client</Text>
                        </View>
                        <View style={localStyles.cardContent}>
                            <Text style={[localStyles.clientName, { color: tTheme.text }]}>
                                {client.name}
                            </Text>
                            {client.phone && (
                                <View style={localStyles.infoRow}>
                                    <Ionicons name="call" size={16} color={tTheme.textSecondary} />
                                    <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                        {client.phone}
                                    </Text>
                                </View>
                            )}
                            {client.email && (
                                <View style={localStyles.infoRow}>
                                    <Ionicons name="mail" size={16} color={tTheme.textSecondary} />
                                    <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                        {client.email}
                                    </Text>
                                </View>
                            )}
                            {client.address && (
                                <View style={localStyles.infoRow}>
                                    <Ionicons name="location" size={16} color={tTheme.textSecondary} />
                                    <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                        {client.address}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Items Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="list" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Articles</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        {items.length === 0 ? (
                            <Text style={[localStyles.emptyText, { color: tTheme.textSecondary }]}>
                                Aucun article
                            </Text>
                        ) : (
                            items.map((item, index) => (
                                <View 
                                    key={index} 
                                    style={[
                                        localStyles.itemRow,
                                        { 
                                            backgroundColor: tTheme.background,
                                            borderColor: tTheme.border
                                        }
                                    ]}
                                >
                                    <View style={localStyles.itemInfo}>
                                        <Text style={[localStyles.itemName, { color: tTheme.text }]}>
                                            {item.item_name || 'Article sans nom'}
                                        </Text>
                                        <Text style={[localStyles.itemQuantity, { color: tTheme.textSecondary }]}>
                                            Qté: {parseFloat(item.quantity || 0).toFixed(0)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Total Summary Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="calculator" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Résumé</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        <View style={localStyles.summaryRow}>
                            <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                                Total articles
                            </Text>
                            <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                                {items.length}
                            </Text>
                        </View>
                        <View style={localStyles.summaryRow}>
                            <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                                Quantité totale
                            </Text>
                            <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                                {totalQuantity.toFixed(0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status Management Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="settings" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Gestion du statut</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        <Text style={[localStyles.label, { color: tTheme.text }]}>Changer le statut</Text>
                        <View style={[localStyles.pickerContainer, { 
                            backgroundColor: tTheme.background,
                            borderColor: tTheme.border
                        }]}>
                            <Picker
                                selectedValue={note.status}
                                onValueChange={(value) => handleStatusChange(value)}
                                enabled={!updating}
                                style={{ color: tTheme.text }}
                            >
                                <Picker.Item label="En attente" value="pending" />
                                <Picker.Item label="Livré" value="delivered" />
                                <Picker.Item label="Annulé" value="cancelled" />
                            </Picker>
                        </View>
                        {updating && (
                            <ActivityIndicator 
                                size="small" 
                                color={tTheme.primary} 
                                style={{ marginTop: 12 }}
                            />
                        )}
                    </View>
                </View>

                {/* Notes Card (if any) */}
                {note.notes && (
                    <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <View style={localStyles.cardHeader}>
                            <Ionicons name="document-text" size={20} color={tTheme.primary} />
                            <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Notes</Text>
                        </View>
                        <View style={localStyles.cardContent}>
                            <Text style={[localStyles.notesText, { color: tTheme.text }]}>
                                {note.notes}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    headerContent: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    noteNumber: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    cardContent: {
        padding: 16,
        paddingTop: 0,
    },
    clientName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
    },
    itemRow: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemQuantity: {
        fontSize: 13,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    notesText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
