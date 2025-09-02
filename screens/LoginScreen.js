import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, Image, Linking, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes } from '../constants/AppConfig'; // Nous utilisons directement le thème ici
import Ionicons from '@expo/vector-icons/Ionicons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    // Le thème est toujours sombre pour l'écran de connexion pour un look premium
    const tTheme = themes.dark;

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        const { error } = await signIn({ email, password });
        if (error) Alert.alert('Login Error', error.message);
        setLoading(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.content}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.title, { color: tTheme.text }]}>Bienvenue</Text>
                <Text style={[styles.slogan, { color: tTheme.textSecondary }]}>Connectez-vous à votre espace commercial</Text>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { backgroundColor: tTheme.card }]}>
                        <Ionicons name="mail-outline" size={20} color={tTheme.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: tTheme.text }]}
                            placeholder="Email"
                            placeholderTextColor={tTheme.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={[styles.inputContainer, { backgroundColor: tTheme.card }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={tTheme.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: tTheme.text }]}
                            placeholder="Mot de passe"
                            placeholderTextColor={tTheme.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                    <TouchableOpacity style={[styles.button, { backgroundColor: tTheme.primary }]} onPress={handleLogin} disabled={loading}>
                        <Text style={[styles.buttonText, { color: tTheme.buttonText }]}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logo: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    slogan: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 16,
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});