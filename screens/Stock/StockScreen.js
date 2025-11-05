import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ModernActionButton,
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function StockScreen() {
    const navigation = useNavigation();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [adjustModalVisible, setAdjustModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'remove'
    const [adjustmentNote, setAdjustmentNote] = useState('');
    
    // Form states for Create/Edit
    const [formName, setFormName] = useState('');
    const [formReference, setFormReference] = useState('');
    const [formSalePrice, setFormSalePrice] = useState('');
    const [formPurchasePrice, setFormPurchasePrice] = useState('');
    const [formVatRate, setFormVatRate] = useState('19');
    const [formStockQuantity, setFormStockQuantity] = useState('0');
    const [formDescription, setFormDescription] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('name');
        
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setItems(data || []);
            setFilteredItems(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchItems();
        }, [fetchItems])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchItems();
        setRefreshing(false);
    }, [fetchItems]);

    // CRUD Handlers - Must be defined before useLayoutEffect
    // Create new article
    const handleCreateArticle = useCallback(() => {
        setFormName('');
        setFormReference('');
        setFormSalePrice('');
        setFormPurchasePrice('');
        setFormVatRate('19');
        setFormStockQuantity('0');
        setFormDescription('');
        setCreateModalVisible(true);
    }, []);

    // Edit existing article
    const handleEditArticle = useCallback((item) => {
        setSelectedItem(item);
        setFormName(item.name || '');
        setFormReference(item.reference || '');
        setFormSalePrice(item.sale_price?.toString() || '');
        setFormPurchasePrice(item.purchase_price?.toString() || '');
        setFormVatRate(item.vat_rate?.toString() || '19');
        setFormStockQuantity(item.stock_quantity?.toString() || '0');
        setFormDescription(item.description || '');
        setEditModalVisible(true);
    }, []);

    // Delete article
    const handleDeleteArticle = useCallback((item) => {
        setItemToDelete(item);
        setDeleteModalVisible(true);
    }, []);

    // Confirm delete
    const confirmDelete = useCallback(async () => {
        if (!itemToDelete) return;

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemToDelete.id);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, t.articleDeleted);
            setDeleteModalVisible(false);
            setItemToDelete(null);
            fetchItems();
        }
    }, [itemToDelete, t.error, t.success, t.articleDeleted, fetchItems]);

    // Save new article
    const handleSaveNewArticle = useCallback(async () => {
        if (!formName.trim()) {
            Alert.alert(t.error, t.articleNameRequired);
            return;
        }

        setSaveLoading(true);
        const { error } = await supabase
            .from('items')
            .insert([{
                user_id: user.id,
                name: formName.trim(),
                reference: formReference.trim() || null,
                sale_price: parseFloat(formSalePrice) || 0,
                purchase_price: parseFloat(formPurchasePrice) || 0,
                vat_rate: parseFloat(formVatRate) || 19,
                stock_quantity: parseFloat(formStockQuantity) || 0,
                description: formDescription.trim() || null,
            }]);

        setSaveLoading(false);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, t.articleCreated);
            setCreateModalVisible(false);
            fetchItems();
        }
    }, [formName, formReference, formSalePrice, formPurchasePrice, formVatRate, formStockQuantity, formDescription, user.id, t.error, t.success, t.articleCreated, fetchItems]);

    // Update existing article
    const handleUpdateArticle = useCallback(async () => {
        if (!formName.trim()) {
            Alert.alert(t.error, t.articleNameRequired);
            return;
        }

        setSaveLoading(true);
        const { error } = await supabase
            .from('items')
            .update({
                name: formName.trim(),
                reference: formReference.trim() || null,
                sale_price: parseFloat(formSalePrice) || 0,
                purchase_price: parseFloat(formPurchasePrice) || 0,
                vat_rate: parseFloat(formVatRate) || 19,
                stock_quantity: parseFloat(formStockQuantity) || 0,
                description: formDescription.trim() || null,
            })
            .eq('id', selectedItem.id);

        setSaveLoading(false);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, t.articleUpdated);
            setEditModalVisible(false);
            fetchItems();
        }
    }, [formName, formReference, formSalePrice, formPurchasePrice, formVatRate, formStockQuantity, formDescription, selectedItem, t.error, t.success, t.articleUpdated, fetchItems]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[localStyles.headerButton, { backgroundColor: tTheme.successSoft }]}
                        onPress={handleCreateArticle}
                    >
                        <Ionicons name="add" size={20} color={tTheme.success} />
                        <Text style={[localStyles.headerButtonText, { color: tTheme.success }]}>Nouveau</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                        onPress={() => navigation.navigate('StockMovements')}
                    >
                        <Ionicons name="list" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Mouvements</Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, theme, handleCreateArticle, tTheme]);

    // Filter items based on search and stock status
    React.useEffect(() => {
        let result = items;

        // Search filter
        if (searchQuery) {
            result = result.filter(
                (item) =>
                    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.reference?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Stock status filter
        if (stockFilter === 'low') {
            result = result.filter((item) => (item.stock_quantity || 0) <= 10);
        } else if (stockFilter === 'out') {
            result = result.filter((item) => (item.stock_quantity || 0) === 0);
        } else if (stockFilter === 'available') {
            result = result.filter((item) => (item.stock_quantity || 0) > 10);
        }

        setFilteredItems(result);
    }, [searchQuery, stockFilter, items]);

    const getStockStatus = (quantity) => {
        if (quantity === 0) return 'out_of_stock';
        if (quantity <= 10) return 'low_stock';
        return 'in_stock';
    };

    const getStockStatusLabel = (status) => {
        switch (status) {
            case 'out_of_stock':
                return 'Rupture';
            case 'low_stock':
                return 'Faible';
            case 'in_stock':
                return 'Disponible';
            default:
                return 'N/A';
        }
    };

    const handleShowDetails = (item) => {
        setSelectedItem(item);
        setDetailsModalVisible(true);
    };

    const handleAdjustStock = (item) => {
        setSelectedItem(item);
        setAdjustmentQuantity('');
        setAdjustmentNote('');
        setAdjustmentType('add');
        setAdjustModalVisible(true);
    };

    const handleSaveAdjustment = async () => {
        if (!adjustmentQuantity || parseFloat(adjustmentQuantity) <= 0) {
            Alert.alert(t.error, t.enterValidQuantity);
            return;
        }

        const quantity = parseFloat(adjustmentQuantity);
        const currentStock = selectedItem.stock_quantity || 0;
        const newStock = adjustmentType === 'add' ? currentStock + quantity : currentStock - quantity;

        if (newStock < 0) {
            Alert.alert(t.error, t.stockCannotBeNegative);
            return;
        }

        // Update item stock
        const { error: updateError } = await supabase
            .from('items')
            .update({ stock_quantity: newStock })
            .eq('id', selectedItem.id);

        if (updateError) {
            Alert.alert(t.error, updateError.message);
            return;
        }

        // Record stock movement
        const { error: movementError } = await supabase
            .from('stock_movements')
            .insert([{
                user_id: user.id,
                item_id: selectedItem.id,
                movement_type: adjustmentType === 'add' ? 'in' : 'out',
                quantity: quantity,
                reference_type: 'adjustment',
                notes: adjustmentNote || `Ajustement manuel: ${adjustmentType === 'add' ? '+' : '-'}${quantity}`,
            }]);

        if (movementError) {
            console.error('Error recording movement:', movementError);
        }

        Alert.alert(t.success, t.stockUpdated);
        setAdjustModalVisible(false);
        fetchItems();
    };

    const tableColumns = [
        {
            key: 'name',
            label: 'Article',
            flex: 2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.itemName, { color: tTheme.text }]} numberOfLines={1}>
                        {row.name}
                    </Text>
                    {row.reference && (
                        <Text style={[localStyles.itemRef, { color: tTheme.textSecondary }]} numberOfLines={1}>
                            Réf: {row.reference}
                        </Text>
                    )}
                </View>
            ),
        },
        {
            key: 'stock_quantity',
            label: 'Quantité',
            flex: 1,
            render: (row) => (
                <Text style={[localStyles.quantity, { color: tTheme.text }]} numberOfLines={1}>
                    {row.stock_quantity || 0}
                </Text>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            flex: 1,
            render: (row) => {
                const status = getStockStatus(row.stock_quantity || 0);
                return <ModernStatusBadge status={status} theme={theme} />;
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            flex: 2,
            render: (row) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionIconButton, { backgroundColor: tTheme.primarySoft }]}
                        onPress={() => handleShowDetails(row)}
                    >
                        <Ionicons name="eye" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[localStyles.actionIconButton, { backgroundColor: tTheme.infoSoft }]}
                        onPress={() => handleAdjustStock(row)}
                    >
                        <Ionicons name="swap-horizontal" size={18} color={tTheme.info} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[localStyles.actionIconButton, { backgroundColor: tTheme.successSoft }]}
                        onPress={() => handleEditArticle(row)}
                    >
                        <Ionicons name="pencil" size={18} color={tTheme.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[localStyles.actionIconButton, { backgroundColor: tTheme.errorSoft }]}
                        onPress={() => handleDeleteArticle(row)}
                    >
                        <Ionicons name="trash" size={18} color={tTheme.error} />
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'available', label: 'Disponible' },
        { value: 'low', label: 'Stock Faible' },
        { value: 'out', label: 'Rupture' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                {/* Search and Filters */}
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher un article..."
                        theme={theme}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChipsContainer}>
                        {filterOptions.map((filter) => (
                            <ModernFilterChip
                                key={filter.value}
                                label={filter.label}
                                active={stockFilter === filter.value}
                                onPress={() => setStockFilter(filter.value)}
                                theme={theme}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Stock Summary Cards */}
                <View style={localStyles.summaryContainer}>
                    <View style={[localStyles.summaryCard, { backgroundColor: tTheme.card }]}>
                        <Ionicons name="cube" size={24} color={tTheme.primary} />
                        <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                            {items.length}
                        </Text>
                        <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                            Articles
                        </Text>
                    </View>
                    
                    <View style={[localStyles.summaryCard, { backgroundColor: tTheme.card }]}>
                        <Ionicons name="alert-circle" size={24} color={tTheme.warning} />
                        <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                            {items.filter(item => (item.stock_quantity || 0) <= 10).length}
                        </Text>
                        <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                            Stock Faible
                        </Text>
                    </View>
                    
                    <View style={[localStyles.summaryCard, { backgroundColor: tTheme.card }]}>
                        <Ionicons name="close-circle" size={24} color={tTheme.error} />
                        <Text style={[localStyles.summaryValue, { color: tTheme.text }]}>
                            {items.filter(item => (item.stock_quantity || 0) === 0).length}
                        </Text>
                        <Text style={[localStyles.summaryLabel, { color: tTheme.textSecondary }]}>
                            Rupture
                        </Text>
                    </View>
                </View>

                {/* Stock Table */}
                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredItems}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun article trouvé."
                    />
                </View>
            </ScrollView>

            {/* Details Modal */}
            <Modal
                visible={detailsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                                Détails de l'article
                            </Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={28} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={localStyles.modalBody}>
                            {selectedItem && (
                                <>
                                    <View style={localStyles.detailRow}>
                                        <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                            Nom:
                                        </Text>
                                        <Text style={[localStyles.detailValue, { color: tTheme.text }]}>
                                            {selectedItem.name}
                                        </Text>
                                    </View>

                                    {selectedItem.reference && (
                                        <View style={localStyles.detailRow}>
                                            <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                                Référence:
                                            </Text>
                                            <Text style={[localStyles.detailValue, { color: tTheme.text }]}>
                                                {selectedItem.reference}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={localStyles.detailRow}>
                                        <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                            Quantité en stock:
                                        </Text>
                                        <Text style={[localStyles.detailValue, { color: tTheme.primary, fontWeight: '700' }]}>
                                            {selectedItem.stock_quantity || 0}
                                        </Text>
                                    </View>

                                    <View style={localStyles.detailRow}>
                                        <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                            Statut:
                                        </Text>
                                        <ModernStatusBadge 
                                            status={getStockStatus(selectedItem.stock_quantity || 0)} 
                                            theme={theme} 
                                        />
                                    </View>

                                    <View style={[localStyles.divider, { backgroundColor: tTheme.border }]} />

                                    <View style={localStyles.detailRow}>
                                        <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                            Prix de vente:
                                        </Text>
                                        <Text style={[localStyles.detailValue, { color: tTheme.text }]}>
                                            {selectedItem.sale_price ? `${selectedItem.sale_price.toFixed(2)} TND` : 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={localStyles.detailRow}>
                                        <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                            Prix d'achat:
                                        </Text>
                                        <Text style={[localStyles.detailValue, { color: tTheme.text }]}>
                                            {selectedItem.purchase_price ? `${selectedItem.purchase_price.toFixed(2)} TND` : 'N/A'}
                                        </Text>
                                    </View>

                                    <View style={localStyles.detailRow}>
                                        <Text style={[localStyles.detailLabel, { color: tTheme.textSecondary }]}>
                                            Valeur du stock:
                                        </Text>
                                        <Text style={[localStyles.detailValue, { color: tTheme.success, fontWeight: '700' }]}>
                                            {((selectedItem.purchase_price || 0) * (selectedItem.stock_quantity || 0)).toFixed(2)} TND
                                        </Text>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={localStyles.modalFooter}>
                            <ModernActionButton
                                icon="create"
                                label="Ajuster Stock"
                                onPress={() => {
                                    setDetailsModalVisible(false);
                                    handleAdjustStock(selectedItem);
                                }}
                                theme={theme}
                                variant="primary"
                                fullWidth
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal
                visible={adjustModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAdjustModalVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                                Ajuster le stock
                            </Text>
                            <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                                <Ionicons name="close" size={28} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={localStyles.modalBody}>
                            {selectedItem && (
                                <>
                                    <Text style={[localStyles.itemNameModal, { color: tTheme.text }]}>
                                        {selectedItem.name}
                                    </Text>
                                    <Text style={[localStyles.currentStock, { color: tTheme.textSecondary }]}>
                                        Stock actuel: {selectedItem.stock_quantity || 0}
                                    </Text>

                                    <View style={localStyles.typeSelector}>
                                        <TouchableOpacity
                                            style={[
                                                localStyles.typeButton,
                                                adjustmentType === 'add' && { backgroundColor: tTheme.successSoft },
                                            ]}
                                            onPress={() => setAdjustmentType('add')}
                                        >
                                            <Ionicons 
                                                name="add-circle" 
                                                size={24} 
                                                color={adjustmentType === 'add' ? tTheme.success : tTheme.textSecondary} 
                                            />
                                            <Text style={[
                                                localStyles.typeButtonText,
                                                { color: adjustmentType === 'add' ? tTheme.success : tTheme.textSecondary }
                                            ]}>
                                                Ajouter
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                localStyles.typeButton,
                                                adjustmentType === 'remove' && { backgroundColor: tTheme.errorSoft },
                                            ]}
                                            onPress={() => setAdjustmentType('remove')}
                                        >
                                            <Ionicons 
                                                name="remove-circle" 
                                                size={24} 
                                                color={adjustmentType === 'remove' ? tTheme.error : tTheme.textSecondary} 
                                            />
                                            <Text style={[
                                                localStyles.typeButtonText,
                                                { color: adjustmentType === 'remove' ? tTheme.error : tTheme.textSecondary }
                                            ]}>
                                                Retirer
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[styles.label, { color: tTheme.text }]}>Quantité *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.background, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={adjustmentQuantity}
                                        onChangeText={setAdjustmentQuantity}
                                        keyboardType="numeric"
                                        placeholder="Entrez la quantité"
                                        placeholderTextColor={tTheme.textSecondary}
                                    />

                                    <Text style={[styles.label, { color: tTheme.text }]}>Note (optionnel)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.background, color: tTheme.text, borderColor: tTheme.border, height: 80 }]}
                                        value={adjustmentNote}
                                        onChangeText={setAdjustmentNote}
                                        multiline
                                        numberOfLines={3}
                                        placeholder="Raison de l'ajustement..."
                                        placeholderTextColor={tTheme.textSecondary}
                                    />
                                </>
                            )}
                        </ScrollView>

                        <View style={localStyles.modalFooter}>
                            <ModernActionButton
                                icon="close"
                                label="Annuler"
                                onPress={() => setAdjustModalVisible(false)}
                                theme={theme}
                                variant="secondary"
                            />
                            <View style={{ width: 12 }} />
                            <ModernActionButton
                                icon="checkmark"
                                label="Enregistrer"
                                onPress={handleSaveAdjustment}
                                theme={theme}
                                variant="primary"
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Article Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                statusBarTranslucent={true}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={localStyles.modalBackground}>
                    <View style={[localStyles.modalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalHeader, { borderBottomColor: tTheme.border }]}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                                Nouvel Article
                            </Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={localStyles.modalBody}>
                            <Text style={[styles.label, { color: tTheme.text }]}>
                                Nom de l'article <Text style={{ color: tTheme.error }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder="Ex: MacBook Pro 14"
                                placeholderTextColor={tTheme.textSecondary}
                            />

                            <Text style={[styles.label, { color: tTheme.text }]}>Référence</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                value={formReference}
                                onChangeText={setFormReference}
                                placeholder="Ex: ART-2024-001"
                                placeholderTextColor={tTheme.textSecondary}
                            />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>Prix d'achat (TND)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formPurchasePrice}
                                        onChangeText={setFormPurchasePrice}
                                        placeholder="0.000"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>Prix de vente (TND)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formSalePrice}
                                        onChangeText={setFormSalePrice}
                                        placeholder="0.000"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>TVA (%)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formVatRate}
                                        onChangeText={setFormVatRate}
                                        placeholder="19"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>Stock initial</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formStockQuantity}
                                        onChangeText={setFormStockQuantity}
                                        placeholder="0"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: tTheme.text }]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                value={formDescription}
                                onChangeText={setFormDescription}
                                placeholder="Description détaillée de l'article..."
                                placeholderTextColor={tTheme.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </ScrollView>
                        <View style={[localStyles.modalFooter, { borderTopColor: tTheme.border }]}>
                            <ModernActionButton
                                icon="close"
                                label="Annuler"
                                onPress={() => setCreateModalVisible(false)}
                                theme={theme}
                                variant="secondary"
                            />
                            <View style={{ width: 12 }} />
                            <ModernActionButton
                                icon="checkmark"
                                label={saveLoading ? "Enregistrement..." : "Créer"}
                                onPress={handleSaveNewArticle}
                                theme={theme}
                                variant="primary"
                                disabled={saveLoading}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Article Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                statusBarTranslucent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={localStyles.modalBackground}>
                    <View style={[localStyles.modalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalHeader, { borderBottomColor: tTheme.border }]}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                                Modifier l'Article
                            </Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={localStyles.modalBody}>
                            <Text style={[styles.label, { color: tTheme.text }]}>
                                Nom de l'article <Text style={{ color: tTheme.error }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder="Ex: MacBook Pro 14"
                                placeholderTextColor={tTheme.textSecondary}
                            />

                            <Text style={[styles.label, { color: tTheme.text }]}>Référence</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                value={formReference}
                                onChangeText={setFormReference}
                                placeholder="Ex: ART-2024-001"
                                placeholderTextColor={tTheme.textSecondary}
                            />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>Prix d'achat (TND)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formPurchasePrice}
                                        onChangeText={setFormPurchasePrice}
                                        placeholder="0.000"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>Prix de vente (TND)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formSalePrice}
                                        onChangeText={setFormSalePrice}
                                        placeholder="0.000"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>TVA (%)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formVatRate}
                                        onChangeText={setFormVatRate}
                                        placeholder="19"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: tTheme.text }]}>Quantité en stock</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                        value={formStockQuantity}
                                        onChangeText={setFormStockQuantity}
                                        placeholder="0"
                                        placeholderTextColor={tTheme.textSecondary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: tTheme.text }]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: tTheme.inputBackground, color: tTheme.text, borderColor: tTheme.border }]}
                                value={formDescription}
                                onChangeText={setFormDescription}
                                placeholder="Description détaillée de l'article..."
                                placeholderTextColor={tTheme.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </ScrollView>
                        <View style={[localStyles.modalFooter, { borderTopColor: tTheme.border }]}>
                            <ModernActionButton
                                icon="close"
                                label="Annuler"
                                onPress={() => setEditModalVisible(false)}
                                theme={theme}
                                variant="secondary"
                            />
                            <View style={{ width: 12 }} />
                            <ModernActionButton
                                icon="checkmark"
                                label={saveLoading ? "Enregistrement..." : "Mettre à jour"}
                                onPress={handleUpdateArticle}
                                theme={theme}
                                variant="primary"
                                disabled={saveLoading}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                statusBarTranslucent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={localStyles.modalBackground}>
                    <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalHeader, { borderBottomColor: tTheme.border }]}>
                            <Ionicons name="warning" size={32} color={tTheme.error} />
                            <Text style={[localStyles.modalTitle, { color: tTheme.text, marginLeft: 12 }]}>
                                Confirmer la suppression
                            </Text>
                        </View>
                        <View style={localStyles.modalBody}>
                            <Text style={[localStyles.deleteWarningText, { color: tTheme.text }]}>
                                Êtes-vous sûr de vouloir supprimer <Text style={{ fontWeight: 'bold' }}>"{itemToDelete?.name}"</Text> ?
                            </Text>
                            <Text style={[localStyles.deleteSubText, { color: tTheme.textSecondary, marginTop: 12 }]}>
                                Cette action est irréversible et supprimera également l'historique des mouvements de stock.
                            </Text>
                        </View>
                        <View style={[localStyles.modalFooter, { borderTopColor: tTheme.border }]}>
                            <ModernActionButton
                                icon="close"
                                label="Annuler"
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setItemToDelete(null);
                                }}
                                theme={theme}
                                variant="secondary"
                            />
                            <View style={{ width: 12 }} />
                            <ModernActionButton
                                icon="trash"
                                label="Supprimer"
                                onPress={confirmDelete}
                                theme={theme}
                                variant="danger"
                            />
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
    filtersContainer: {
        marginBottom: 20,
        gap: 12,
    },
    filterChipsContainer: {
        marginTop: 4,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '700',
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    tableWrapper: {
        marginBottom: 20,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    itemRef: {
        fontSize: 12,
        marginTop: 2,
    },
    quantity: {
        fontSize: 15,
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    actionIconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 16,
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    deleteModalContainer: {
        width: '100%',
        maxWidth: 450,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    deleteWarningText: {
        fontSize: 16,
        lineHeight: 24,
    },
    deleteSubText: {
        fontSize: 14,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 16,
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalBody: {
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    itemNameModal: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    currentStock: {
        fontSize: 14,
        marginBottom: 20,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
