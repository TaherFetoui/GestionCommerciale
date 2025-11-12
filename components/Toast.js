import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes } from '../constants/AppConfig';

export default function Toast({ visible, message, type = 'success', onHide, theme = 'light' }) {
    const tTheme = themes[theme];
    const translateY = new Animated.Value(-100);

    useEffect(() => {
        if (visible) {
            // Show animation
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }).start();

            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                hideToast();
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            // Hide animation
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            if (onHide) onHide();
        });
    };

    if (!visible && translateY._value === -100) return null;

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#10B981',
                    icon: 'checkmark-circle',
                    iconColor: '#FFFFFF',
                };
            case 'error':
                return {
                    backgroundColor: '#EF4444',
                    icon: 'close-circle',
                    iconColor: '#FFFFFF',
                };
            case 'info':
                return {
                    backgroundColor: '#3B82F6',
                    icon: 'information-circle',
                    iconColor: '#FFFFFF',
                };
            case 'warning':
                return {
                    backgroundColor: '#F59E0B',
                    icon: 'warning',
                    iconColor: '#FFFFFF',
                };
            default:
                return {
                    backgroundColor: '#10B981',
                    icon: 'checkmark-circle',
                    iconColor: '#FFFFFF',
                };
        }
    };

    const config = getTypeConfig();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    backgroundColor: config.backgroundColor,
                    ...tTheme.shadow.medium,
                },
            ]}
        >
            <View style={styles.content}>
                <Ionicons name={config.icon} size={24} color={config.iconColor} />
                <Text style={styles.message}>{message}</Text>
            </View>
            <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        minHeight: 60,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    message: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});
