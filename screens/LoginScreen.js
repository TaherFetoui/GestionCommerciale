import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { themes, translations } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { supabase } from '../lib/supabase';
import { getGlobalStyles } from '../styles/GlobalStyles';
import { createFloatingAnimation } from '../styles/ThreeDEffects';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, language } = useAuth();
    const { isMobile, width } = useResponsive();
    const t = translations[language];

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const logoFloatAnim = useRef(new Animated.Value(0)).current;
    const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
    const glowPulse = useRef(new Animated.Value(0)).current;

    const tTheme = themes.dark;
    const globalStyles = getGlobalStyles('dark');

    // Entrance animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.spring(cardScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Logo floating animation
        const floatAnimation = createFloatingAnimation(logoFloatAnim, 3000);
        floatAnimation.start();

        // Glow pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowPulse, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            floatAnimation.stop();
        };
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t.error, t.fillAllFields);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await signIn({ email, password });
            console.log('Login attempt:', { data, error });
            if (error) {
                console.error('Login error:', error);
                Alert.alert(t.loginError, error.message || t.unexpectedError);
            } else {
                // Success - session is saved automatically
                console.log('Login successful, session saved');
            }
        } catch (err) {
            console.error('Login exception:', err);
            Alert.alert(t.error, t.unexpectedError);
        } finally {
            setLoading(false);
        }
    };

    const createTestUser = async () => {
        try {
            const testEmail = 'test@example.com';
            const testPassword = 'Test123456!';
            
            const { data, error } = await supabase.auth.signUp({
                email: testEmail,
                password: testPassword,
                options: { emailRedirectTo: undefined }
            });
            
            if (error) {
                if (error.message.includes('already registered')) {
                    Alert.alert(t.error, `${t.userAlreadyExists}\n\n${t.use}:\n${t.email}: ${testEmail}\n${t.password}: ${testPassword}`);
                } else {
                    Alert.alert(t.error, error.message);
                }
            } else {
                Alert.alert(t.success, `${t.userCreated}\n\n${t.email}: ${testEmail}\n${t.password}: ${testPassword}`);
                setEmail(testEmail);
                setPassword(testPassword);
            }
        } catch (err) {
            Alert.alert(t.error, err.message);
        }
    };

    const glowOpacity = glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    // Dynamic styles based on screen size
    const dynamicStyles = {
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: isMobile ? 16 : 24,
            minHeight: '100%',
        },
        content: {
            width: '100%',
            maxWidth: isMobile ? '100%' : 480,
            alignSelf: 'center',
        },
        logo: {
            width: isMobile ? 80 : 120,
            height: isMobile ? 80 : 120,
        },
        title: {
            fontSize: isMobile ? 32 : 42,
            fontWeight: '800',
            color: '#F1F5F9',
            marginBottom: 8,
            letterSpacing: -1,
        },
        subtitle: {
            fontSize: isMobile ? 14 : 16,
            color: '#94A3B8',
            fontWeight: '400',
        },
        cardPadding: {
            padding: isMobile ? 20 : 32,
        },
        logoMargin: {
            marginBottom: isMobile ? 20 : 32,
        },
        titleMargin: {
            marginBottom: isMobile ? 12 : 16,
        },
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Animated Background Gradient */}
            <LinearGradient
                colors={['#0F172A', '#1E293B', '#0F172A']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Animated Glow Effects */}
            <Animated.View style={[styles.glowCircle, styles.glowTop, { opacity: glowOpacity }]} />
            <Animated.View style={[styles.glowCircle, styles.glowBottom, { opacity: glowOpacity }]} />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={dynamicStyles.scrollContent}>
                    <Animated.View 
                        style={[
                            dynamicStyles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Logo with Floating Animation */}
                        <Animated.View 
                            style={[
                                styles.logoContainer,
                                dynamicStyles.logoMargin,
                                {
                                    transform: [
                                        {
                                            translateY: logoFloatAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, isMobile ? -8 : -12],
                                            }),
                                        }
                                    ]
                                }
                            ]}
                        >
                            <View style={styles.logoGlow}>
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    style={dynamicStyles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </Animated.View>

                        {/* Title Section */}
                        <View style={[styles.titleSection, dynamicStyles.titleMargin]}>
                            <Text style={dynamicStyles.title}>Bienvenue</Text>
                            <Text style={dynamicStyles.subtitle}>Connectez-vous à votre espace</Text>
                            
                            {/* Security Badge */}
                            <View style={styles.securityBadge}>
                                <Ionicons name="shield-checkmark" size={14} color={tTheme.success} />
                                <Text style={styles.securityText}>Connexion sécurisée</Text>
                            </View>
                        </View>

                        {/* 3D Glass Card */}
                        <Animated.View 
                            style={[
                                styles.card,
                                {
                                    transform: [{ scale: cardScaleAnim }]
                                }
                            ]}
                        >
                            <LinearGradient
                                colors={['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.5)']}
                                style={[styles.cardGradient, dynamicStyles.cardPadding]}
                            >
                                {/* Email Input */}
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="mail-outline" size={22} color={tTheme.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor={tTheme.textSecondary}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        editable={!loading}
                                    />
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="lock-closed-outline" size={22} color={tTheme.primary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Mot de passe"
                                        placeholderTextColor={tTheme.textSecondary}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        editable={!loading}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons 
                                            name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                            size={22} 
                                            color={tTheme.textSecondary} 
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Login Button with Gradient */}
                                <TouchableOpacity 
                                    style={styles.loginButtonWrapper}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={tTheme.primaryGradient}
                                        style={styles.loginButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {loading ? (
                                            <Text style={styles.loginButtonText}>Connexion...</Text>
                                        ) : (
                                            <>
                                                <Text style={styles.loginButtonText}>Se connecter</Text>
                                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Create Account Button */}
                                <TouchableOpacity 
                                    style={styles.createAccountButton}
                                    onPress={createTestUser}
                                >
                                    <Ionicons name="person-add-outline" size={16} color={tTheme.primary} />
                                    <Text style={styles.createAccountText}>Créer un compte</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        width: '100%',
        height: '100%',
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    glowCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#6366F1',
        blur: 100,
    },
    glowTop: {
        top: -150,
        right: -100,
        opacity: 0.15,
    },
    glowBottom: {
        bottom: -150,
        left: -100,
        opacity: 0.15,
    },
    keyboardView: {
        flex: 1,
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoGlow: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    titleSection: {
        alignItems: 'center',
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 10,
        width: '100%',
    },
    cardGradient: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 4,
        width: '100%',
    },
    inputIconContainer: {
        marginRight: 12,
        flexShrink: 0,
    },
    input: {
        flex: 1,
        color: '#F1F5F9',
        fontSize: 16,
        paddingVertical: 16,
        fontWeight: '400',
        minWidth: 0,
    },
    eyeIcon: {
        padding: 8,
        flexShrink: 0,
    },
    loginButtonWrapper: {
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        width: '100%',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
        width: '100%',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    createAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    createAccountText: {
        color: '#818CF8',
        fontSize: 14,
        fontWeight: '600',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginTop: 12,
    },
    securityText: {
        color: '#34D399',
        fontSize: 12,
        fontWeight: '600',
    },
});
