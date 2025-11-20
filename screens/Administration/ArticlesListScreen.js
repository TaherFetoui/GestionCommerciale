import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
    ModernSearchBar,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ArticlesListScreen() {
    const navigation = useNavigation();
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('items').select('*').order('name');
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setArticles(data || []);
            setFilteredArticles(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchArticles();
        }, [fetchArticles])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateArticle')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchArticles();
        setRefreshing(false);
    }, [fetchArticles]);

    // Filter articles based on search
    React.useEffect(() => {
        if (searchQuery) {
            setFilteredArticles(
                articles.filter(
                    (article) =>
                        article.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        article.reference?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredArticles(articles);
        }
    }, [searchQuery, articles]);

    const confirmDeleteArticle = useCallback(async () => {
        if (!articleToDelete) return;
        
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', articleToDelete.id);

            if (error) {
                Alert.alert(t.error, error.message);
            } else {
                setArticles(prev => prev.filter(article => article.id !== articleToDelete.id));
                Alert.alert('✓ Succès', 'Article supprimé avec succès');
            }
        } catch (error) {
            Alert.alert(t.error, 'Impossible de supprimer l\'article');
        }
        
        setArticleToDelete(null);
    }, [articleToDelete, t.error]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setArticleToDelete(null);
    }, []);

    const handleUpdateArticle = useCallback(async () => {
        if (!selectedArticle?.name) {
            Alert.alert(t.error, 'Le nom est requis');
            return;
        }

        try {
            const { error } = await supabase
                .from('items')
                .update({
                    name: selectedArticle.name,
                    reference: selectedArticle.reference,
                    sale_price: parseFloat(selectedArticle.sale_price) || 0,
                    purchase_price: parseFloat(selectedArticle.purchase_price) || 0,
                })
                .eq('id', selectedArticle.id);

            if (error) {
                Alert.alert(t.error, error.message);
            } else {
                Alert.alert('✓ Succès', 'Article modifié avec succès');
                setEditModalVisible(false);
                fetchArticles();
            }
        } catch (error) {
            Alert.alert(t.error, 'Impossible de modifier l\'article');
        }
    }, [selectedArticle, t.error, fetchArticles]);

    const tableColumns = [
        {
            key: 'name',
            label: 'Article',
            flex: 2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.articleName, { color: tTheme.text }]} numberOfLines={1}>
                        {row.name}
                    </Text>
                    {row.reference && (
                        <Text style={[localStyles.articleRef, { color: tTheme.textSecondary }]} numberOfLines={1}>
                            Réf: {row.reference}
                        </Text>
                    )}
                </View>
            ),
        },
        {
            key: 'sale_price',
            label: 'Prix de vente',
            flex: 1,
            render: (row) => (
                <Text style={[localStyles.price, { color: tTheme.primary }]}>
                    {row.sale_price?.toFixed(3) || '0.000'} TND
                </Text>
            ),
        },
        {
            key: 'purchase_price',
            label: 'Prix d\'achat',
            flex: 1,
            render: (row) => (
                <Text style={{ color: tTheme.text }}>
                    {row.purchase_price?.toFixed(3) || '0.000'} TND
                </Text>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            flex: 1,
            render: (row) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            setSelectedArticle(row);
                            setEditModalVisible(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { 
                            backgroundColor: '#FEE2E2',
                            borderColor: '#EF4444'
                        }]}
                        onPress={(e) => {
                            if (e && e.stopPropagation) {
                                e.stopPropagation();
                            }
                            setArticleToDelete(row);
                            setDeleteModalVisible(true);
                        }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
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
                        placeholder="Rechercher un article (nom, référence)..."
                        theme={theme}
                    />
                </View>

                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredArticles}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun article trouvé. Créez votre premier article."
                    />
                </View>
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelDelete}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>
                        <Text style={[localStyles.deleteModalTitle, { color: tTheme.text }]}>
                            Supprimer l'article
                        </Text>
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Voulez-vous vraiment supprimer l'article{'\n'}
                            <Text style={{ fontWeight: 'bold', color: tTheme.primary }}>
                                {articleToDelete?.name}
                            </Text>
                            {'\n\n'}
                            <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                                Cette action est irréversible.
                            </Text>
                        </Text>
                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.cancelButton, { backgroundColor: tTheme.border }]}
                                onPress={cancelDelete}
                                activeOpacity={0.7}
                            >
                                <Text style={[localStyles.modalButtonText, { color: tTheme.text }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[localStyles.modalButton, { backgroundColor: '#DC2626' }]}
                                onPress={confirmDeleteArticle}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={18} color="#FFFFFF" />
                                <Text style={[localStyles.modalButtonText, { color: '#FFFFFF', marginLeft: 6 }]}>
                                    Supprimer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.editModalContainer, { backgroundColor: tTheme.card, borderColor: tTheme.border }]}>
                        <View style={[localStyles.modalHeader, { borderBottomColor: tTheme.border }]}>
                            <Text style={[styles.title, { color: tTheme.text }]}>Modifier l'article</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={localStyles.modalBody}>
                            <Text style={[styles.label, { color: tTheme.text }]}>Nom *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedArticle?.name}
                                onChangeText={(val) => setSelectedArticle(prev => ({ ...prev, name: val }))}
                            />
                            <Text style={[styles.label, { color: tTheme.text }]}>Référence</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedArticle?.reference}
                                onChangeText={(val) => setSelectedArticle(prev => ({ ...prev, reference: val }))}
                            />
                            <Text style={[styles.label, { color: tTheme.text }]}>Prix de vente (TND)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedArticle?.sale_price?.toString()}
                                onChangeText={(val) => setSelectedArticle(prev => ({ ...prev, sale_price: val }))}
                                keyboardType="decimal-pad"
                            />
                            <Text style={[styles.label, { color: tTheme.text }]}>Prix d'achat (TND)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedArticle?.purchase_price?.toString()}
                                onChangeText={(val) => setSelectedArticle(prev => ({ ...prev, purchase_price: val }))}
                                keyboardType="decimal-pad"
                            />
                        </ScrollView>
                        <View style={[localStyles.modalFooter, { borderTopColor: tTheme.border }]}>
                            <TouchableOpacity
                                style={[localStyles.saveButton, { backgroundColor: tTheme.primary }]}
                                onPress={handleUpdateArticle}
                                activeOpacity={0.7}
                            >
                                <Text style={[localStyles.saveButtonText, { color: '#FFFFFF' }]}>
                                    Enregistrer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    articleName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    articleRef: {
        fontSize: 12,
        marginTop: 2,
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    editModalContainer: {
        width: '90%',
        maxWidth: 600,
        maxHeight: '80%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalBody: {
        padding: 20,
        maxHeight: 400,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
    },
    saveButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});