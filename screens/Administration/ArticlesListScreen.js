import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
});