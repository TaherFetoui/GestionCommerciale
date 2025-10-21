import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { themes } from '../constants/AppConfig';

// ===== MODERN TABLE COMPONENT =====
export const ModernTable = ({ data, columns, onRowPress, theme, loading, emptyMessage }) => {
    const tTheme = themes[theme];

    if (loading) {
        return (
            <View style={[modernStyles.centered, { padding: 40 }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[modernStyles.loadingText, { color: tTheme.textSecondary }]}>
                    Chargement...
                </Text>
            </View>
        );
    }

    if (!data || data.length === 0) {
        return (
            <View style={modernStyles.emptyState}>
                <Ionicons name="folder-open-outline" size={64} color={tTheme.border} />
                <Text style={[modernStyles.emptyTitle, { color: tTheme.text }]}>
                    Aucune donnée
                </Text>
                <Text style={[modernStyles.emptySubtitle, { color: tTheme.textSecondary }]}>
                    {emptyMessage || "Créez votre premier élément pour commencer"}
                </Text>
            </View>
        );
    }

    return (
        <View style={modernStyles.tableContainer}>
            {/* Table Header */}
            <View style={[modernStyles.tableHeader, { backgroundColor: tTheme.cardGlass, borderBottomColor: tTheme.border }]}>
                {columns.map((col, idx) => (
                    <View key={idx} style={[modernStyles.tableHeaderCell, { flex: col.flex || 1 }]}>
                        <Text style={[modernStyles.tableHeaderText, { color: tTheme.text }]}>
                            {col.label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Table Rows */}
            {data.map((row, rowIdx) => (
                <TouchableOpacity
                    key={row.id || rowIdx}
                    style={[
                        modernStyles.tableRow,
                        { backgroundColor: tTheme.card, borderBottomColor: tTheme.divider },
                        rowIdx % 2 === 0 && { backgroundColor: tTheme.background }
                    ]}
                    onPress={() => onRowPress && onRowPress(row)}
                    activeOpacity={0.7}
                >
                    {columns.map((col, colIdx) => (
                        <View key={colIdx} style={[modernStyles.tableCell, { flex: col.flex || 1 }]}>
                            {col.render ? col.render(row) : (
                                <Text style={[modernStyles.tableCellText, { color: tTheme.text }]} numberOfLines={1}>
                                    {row[col.key] || '-'}
                                </Text>
                            )}
                        </View>
                    ))}
                </TouchableOpacity>
            ))}
        </View>
    );
};

// ===== MODERN ACTION BUTTON =====
export const ModernActionButton = ({ icon, label, onPress, variant = 'primary', theme, fullWidth = false, loading = false }) => {
    const tTheme = themes[theme];

    const getButtonStyle = () => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: tTheme.primary };
            case 'secondary':
                return { backgroundColor: tTheme.primarySoft, borderWidth: 1, borderColor: tTheme.primary };
            case 'danger':
                return { backgroundColor: tTheme.danger };
            case 'success':
                return { backgroundColor: tTheme.success };
            default:
                return { backgroundColor: tTheme.primary };
        }
    };

    const getTextColor = () => {
        return variant === 'secondary' ? tTheme.primary : '#FFFFFF';
    };

    return (
        <TouchableOpacity
            style={[
                modernStyles.actionButton,
                getButtonStyle(),
                fullWidth && { width: '100%' },
                loading && { opacity: 0.7 }
            ]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator size="small" color={getTextColor()} />
            ) : (
                <>
                    {icon && <Ionicons name={icon} size={20} color={getTextColor()} style={{ marginRight: 8 }} />}
                    <Text style={[modernStyles.actionButtonText, { color: getTextColor() }]}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

// ===== MODERN SEARCH BAR =====
export const ModernSearchBar = ({ value, onChangeText, placeholder, theme }) => {
    const tTheme = themes[theme];

    return (
        <View style={[modernStyles.searchContainer, { backgroundColor: tTheme.card, borderColor: tTheme.border }]}>
            <Ionicons name="search-outline" size={20} color={tTheme.textSecondary} />
            <TextInput
                style={[modernStyles.searchInput, { color: tTheme.text }]}
                placeholder={placeholder || "Rechercher..."}
                placeholderTextColor={tTheme.textSecondary}
                value={value}
                onChangeText={onChangeText}
            />
            {value?.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText('')}>
                    <Ionicons name="close-circle" size={20} color={tTheme.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

// ===== MODERN FILTER CHIP =====
export const ModernFilterChip = ({ label, active, onPress, theme }) => {
    const tTheme = themes[theme];

    return (
        <TouchableOpacity
            style={[
                modernStyles.filterChip,
                {
                    backgroundColor: active ? tTheme.primary : tTheme.card,
                    borderColor: active ? tTheme.primary : tTheme.border,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[
                modernStyles.filterChipText,
                { color: active ? '#FFFFFF' : tTheme.text }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

// ===== MODERN STATUS BADGE =====
export const ModernStatusBadge = ({ status, theme }) => {
    const tTheme = themes[theme];

    const getStatusConfig = () => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'payé':
            case 'completed':
            case 'terminé':
            case 'active':
            case 'actif':
                return { color: tTheme.success, icon: 'checkmark-circle', label: 'Payé' };
            case 'pending':
            case 'en_attente':
            case 'awaiting_payment':
                return { color: tTheme.warning, icon: 'time', label: 'En attente' };
            case 'overdue':
            case 'en_retard':
            case 'late':
                return { color: tTheme.danger, icon: 'alert-circle', label: 'En retard' };
            case 'draft':
            case 'brouillon':
                return { color: tTheme.textSecondary, icon: 'document-outline', label: 'Brouillon' };
            case 'cancelled':
            case 'annulé':
                return { color: tTheme.textSecondary, icon: 'close-circle', label: 'Annulé' };
            // Stock statuses
            case 'in_stock':
            case 'disponible':
                return { color: tTheme.success, icon: 'checkmark-circle', label: 'Disponible' };
            case 'low_stock':
            case 'faible':
                return { color: tTheme.warning, icon: 'warning', label: 'Faible' };
            case 'out_of_stock':
            case 'rupture':
                return { color: tTheme.error, icon: 'close-circle', label: 'Rupture' };
            default:
                return { color: tTheme.textSecondary, icon: 'ellipse', label: status };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={[modernStyles.statusBadge, { backgroundColor: `${config.color}15` }]}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[modernStyles.statusBadgeText, { color: config.color }]}>
                {config.label}
            </Text>
        </View>
    );
};

// ===== MODERN INFO CARD =====
export const ModernInfoCard = ({ icon, title, value, subtitle, onPress, theme, color }) => {
    const tTheme = themes[theme];
    const cardColor = color || tTheme.primary;

    return (
        <TouchableOpacity
            style={[modernStyles.infoCard, { backgroundColor: tTheme.card, borderColor: tTheme.border }]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            <View style={[modernStyles.infoCardIcon, { backgroundColor: `${cardColor}15` }]}>
                <Ionicons name={icon} size={28} color={cardColor} />
            </View>
            <View style={modernStyles.infoCardContent}>
                <Text style={[modernStyles.infoCardTitle, { color: tTheme.textSecondary }]}>
                    {title}
                </Text>
                <Text style={[modernStyles.infoCardValue, { color: tTheme.text }]}>
                    {value}
                </Text>
                {subtitle && (
                    <Text style={[modernStyles.infoCardSubtitle, { color: tTheme.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

// ===== STYLES =====
const modernStyles = StyleSheet.create({
    // Table Styles
    tableContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
    },
    tableHeaderCell: {
        paddingHorizontal: 8,
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    tableCell: {
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    tableCellText: {
        fontSize: 14,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },

    // Loading
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },

    // Action Button
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Search Bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },

    // Filter Chip
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Status Badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        gap: 6,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    infoCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    infoCardContent: {
        flex: 1,
    },
    infoCardTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCardValue: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 2,
    },
    infoCardSubtitle: {
        fontSize: 12,
    },
});

export default {
    ModernTable,
    ModernActionButton,
    ModernSearchBar,
    ModernFilterChip,
    ModernStatusBadge,
    ModernInfoCard,
};
