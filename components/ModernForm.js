import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { themes } from '../constants/AppConfig';

/**
 * Composant Modal pour les formulaires avec design moderne et fond flouté
 */
export function ModernFormModal({ visible, onClose, children, title, theme = 'dark' }) {
    const tTheme = themes[theme];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                {/* Fond flouté/assombri */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />
                
                <View style={[styles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: tTheme.border }]}>
                        <Text style={[styles.modalTitle, { color: tTheme.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={tTheme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView 
                        style={styles.modalBody}
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

/**
 * Composant Card pour grouper les champs de formulaire
 */
export function FormCard({ children, title, icon, theme = 'dark' }) {
    const tTheme = themes[theme];

    return (
        <View style={[styles.card, { backgroundColor: tTheme.background, borderColor: tTheme.border }]}>
            {title && (
                <View style={styles.cardHeader}>
                    {icon && <Ionicons name={icon} size={20} color={tTheme.primary} />}
                    <Text style={[styles.cardTitle, { color: tTheme.text }]}>{title}</Text>
                </View>
            )}
            <View style={styles.cardContent}>
                {children}
            </View>
        </View>
    );
}

/**
 * Composant Input avec label et style moderne
 */
export function FormInput({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    keyboardType = 'default',
    required = false,
    multiline = false,
    numberOfLines = 1,
    editable = true,
    theme = 'dark',
    icon,
    error
}) {
    const tTheme = themes[theme];

    return (
        <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
                {icon && <Ionicons name={icon} size={16} color={tTheme.textSecondary} style={styles.labelIcon} />}
                <Text style={[styles.label, { color: tTheme.text }]}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            </View>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: editable ? tTheme.card : tTheme.background,
                        color: tTheme.text,
                        borderColor: error ? '#EF4444' : tTheme.border,
                        borderWidth: error ? 2 : 1,
                    },
                    multiline && { minHeight: 80, textAlignVertical: 'top' }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={tTheme.textSecondary}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={numberOfLines}
                editable={editable}
            />
            {error && (
                <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            )}
        </View>
    );
}

/**
 * Composant Picker avec label et style moderne
 */
export function FormPicker({ 
    label, 
    selectedValue, 
    onValueChange, 
    items = [],
    placeholder = '-- Sélectionner --',
    required = false,
    theme = 'dark',
    icon,
    error
}) {
    const tTheme = themes[theme];

    return (
        <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
                {icon && <Ionicons name={icon} size={16} color={tTheme.textSecondary} style={styles.labelIcon} />}
                <Text style={[styles.label, { color: tTheme.text }]}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            </View>
            <View style={[
                styles.pickerContainer,
                {
                    backgroundColor: tTheme.card,
                    borderColor: error ? '#EF4444' : tTheme.border,
                    borderWidth: error ? 2 : 1,
                }
            ]}>
                <Picker
                    selectedValue={selectedValue || '__empty__'}
                    onValueChange={(value) => {
                        const actualValue = value === '__empty__' ? '' : value;
                        onValueChange(actualValue);
                    }}
                    style={{ color: tTheme.text }}
                >
                    <Picker.Item label={placeholder} value="__empty__" />
                    {items.map((item) => (
                        <Picker.Item key={item.value} label={item.label} value={item.value} />
                    ))}
                </Picker>
            </View>
            {error && (
                <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            )}
        </View>
    );
}

/**
 * Composant pour organiser les inputs en ligne (row)
 */
export function FormRow({ children }) {
    return <View style={styles.row}>{children}</View>;
}

/**
 * Composant pour les colonnes dans un FormRow
 */
export function FormColumn({ children, flex = 1 }) {
    return <View style={[styles.column, { flex }]}>{children}</View>;
}

/**
 * Bouton de soumission avec style moderne
 */
export function FormSubmitButton({ 
    onPress, 
    loading = false, 
    disabled = false,
    label = 'Enregistrer',
    icon = 'checkmark-circle',
    theme = 'dark',
    variant = 'primary' // primary, secondary, danger
}) {
    const tTheme = themes[theme];
    
    const getButtonColor = () => {
        if (disabled) return tTheme.textSecondary + '40';
        switch (variant) {
            case 'primary':
                return tTheme.primary;
            case 'secondary':
                return tTheme.accent;
            case 'danger':
                return '#EF4444';
            default:
                return tTheme.primary;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.submitButton,
                { backgroundColor: getButtonColor(), ...tTheme.shadow.medium },
                disabled && styles.submitButtonDisabled
            ]}
            onPress={onPress}
            disabled={loading || disabled}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <>
                    <Ionicons name={icon} size={22} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>{label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

/**
 * Bouton secondaire (Annuler, etc.)
 */
export function FormSecondaryButton({ 
    onPress, 
    label = 'Annuler',
    icon = 'close-circle',
    theme = 'dark'
}) {
    const tTheme = themes[theme];

    return (
        <TouchableOpacity
            style={[
                styles.secondaryButton,
                { 
                    backgroundColor: tTheme.background,
                    borderColor: tTheme.border
                }
            ]}
            onPress={onPress}
        >
            <Ionicons name={icon} size={20} color={tTheme.text} />
            <Text style={[styles.secondaryButtonText, { color: tTheme.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

/**
 * Conteneur pour les boutons d'action (Submit + Cancel)
 */
export function FormActions({ children }) {
    return <View style={styles.actionsContainer}>{children}</View>;
}

const styles = StyleSheet.create({
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 600,
        maxHeight: '90%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },

    // Card styles
    card: {
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
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

    // Input styles
    inputContainer: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelIcon: {
        marginRight: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    required: {
        color: '#EF4444',
        fontSize: 14,
    },
    input: {
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    pickerContainer: {
        borderRadius: 10,
        overflow: 'hidden',
    },

    // Layout styles
    row: {
        flexDirection: 'row',
        marginHorizontal: -6,
    },
    column: {
        paddingHorizontal: 6,
    },

    // Button styles
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 20,
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
