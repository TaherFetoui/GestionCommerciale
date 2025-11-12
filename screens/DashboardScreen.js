import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Easing, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themes, translations } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { supabase } from '../lib/supabase';
import { getGlobalStyles } from '../styles/GlobalStyles';

// 3D Rotating Cube Component
const RotatingCube3D = React.memo(({ color = '#3B82F6', size = 100 }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);
    
    const rotateY = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    
    const rotateX = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '30deg'],
    });
    
    return (
        <View style={[localStyles.cube3DContainer, { width: size, height: size }]}>
            <Animated.View
                style={[
                    localStyles.cube3D,
                    {
                        transform: [
                            { perspective: 1000 },
                            { rotateY },
                            { rotateX: rotateX },
                        ],
                    },
                ]}
            >
                {/* Front Face */}
                <LinearGradient
                    colors={[color, color + 'AA']}
                    style={[localStyles.cubeFace, localStyles.cubeFront, { width: size * 0.8, height: size * 0.8 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                {/* Top Face */}
                <LinearGradient
                    colors={[color + 'DD', color + '88']}
                    style={[localStyles.cubeFace, localStyles.cubeTop, { width: size * 0.8, height: size * 0.8 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
                {/* Right Face */}
                <LinearGradient
                    colors={[color + '99', color + '66']}
                    style={[localStyles.cubeFace, localStyles.cubeRight, { width: size * 0.8, height: size * 0.8 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />
            </Animated.View>
        </View>
    );
});

// 3D Floating Sphere Component
const FloatingSphere3D = React.memo(({ color = '#10B981', size = 80 }) => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
        // Float animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
        
        // Rotation animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
        
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);
    
    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });
    
    const rotateZ = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    
    return (
        <Animated.View
            style={[
                localStyles.sphere3D,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    transform: [
                        { translateY },
                        { rotateZ },
                        { scale: pulseAnim },
                    ],
                },
            ]}
        >
            <LinearGradient
                colors={[color, color + '66', color + 'AA']}
                style={[localStyles.sphereGradient, { borderRadius: size / 2 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
});

// 3D Card with Parallax Effect
const Card3D = React.memo(({ children, theme }) => {
    const tTheme = themes[theme];
    const rotateX = useRef(new Animated.Value(0)).current;
    const rotateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.98,
                useNativeDriver: true,
            }),
            Animated.spring(rotateX, {
                toValue: 5,
                useNativeDriver: true,
            }),
        ]).start();
    };
    
    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            }),
            Animated.spring(rotateX, {
                toValue: 0,
                useNativeDriver: true,
            }),
            Animated.spring(rotateY, {
                toValue: 0,
                useNativeDriver: true,
            }),
        ]).start();
    };
    
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    localStyles.card3D,
                    {
                        backgroundColor: tTheme.card,
                        transform: [
                            { perspective: 1000 },
                            { rotateX: rotateX.interpolate({
                                inputRange: [0, 10],
                                outputRange: ['0deg', '10deg'],
                            }) },
                            { rotateY: rotateY.interpolate({
                                inputRange: [0, 10],
                                outputRange: ['0deg', '10deg'],
                            }) },
                            { scale },
                        ],
                    },
                ]}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
});

// Animated Background Particles
const AnimatedParticles = React.memo(({ theme }) => {
    const tTheme = themes[theme];
    const particles = Array.from({ length: 15 }, (_, i) => {
        const anim = useRef(new Animated.Value(0)).current;
        
        useEffect(() => {
            Animated.loop(
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 8000 + Math.random() * 4000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }, []);
        
        const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [Dimensions.get('window').height, -100],
        });
        
        const opacity = anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 0.6, 0.6, 0],
        });
        
        return {
            left: Math.random() * Dimensions.get('window').width,
            size: 4 + Math.random() * 8,
            delay: Math.random() * 5000,
            translateY,
            opacity,
        };
    });
    
    return (
        <View style={localStyles.particlesContainer}>
            {particles.map((particle, index) => (
                <Animated.View
                    key={index}
                    style={[
                        localStyles.particle,
                        {
                            left: particle.left,
                            width: particle.size,
                            height: particle.size,
                            borderRadius: particle.size / 2,
                            backgroundColor: tTheme.primary,
                            transform: [{ translateY: particle.translateY }],
                            opacity: particle.opacity,
                        },
                    ]}
                />
            ))}
        </View>
    );
});

// 3D Donut Chart Component
const DonutChart3D = React.memo(({ data, title, theme, size = 200 }) => {
    const tTheme = themes[theme];
    const rotateAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 20000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);
    
    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    
    if (!data || data.length === 0) {
        return (
            <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
                <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>{title}</Text>
                <View style={localStyles.chartPlaceholder}>
                    <Ionicons name="pie-chart-outline" size={60} color={tTheme.border} />
                    <Text style={{color: tTheme.textSecondary, marginTop: 12}}>Aucune donnée disponible</Text>
                </View>
            </View>
        );
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
            <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>{title}</Text>
            
            <View style={localStyles.donutContainer}>
                <Animated.View
                    style={[
                        localStyles.donut3D,
                        {
                            width: size,
                            height: size,
                            transform: [
                                { perspective: 1000 },
                                { rotateY: rotation },
                                { rotateX: '60deg' },
                            ],
                        },
                    ]}
                >
                    {data.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        const angle = (item.value / total) * 360;
                        const startAngle = currentAngle;
                        currentAngle += angle;
                        
                        return (
                            <View
                                key={index}
                                style={[
                                    localStyles.donutSegment,
                                    {
                                        width: size,
                                        height: size,
                                        borderRadius: size / 2,
                                        transform: [{ rotate: `${startAngle}deg` }],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={[item.color, item.color + 'AA']}
                                    style={[
                                        localStyles.donutSegmentInner,
                                        { borderRadius: size / 2 },
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            </View>
                        );
                    })}
                    
                    {/* Center hole for donut effect */}
                    <View
                        style={[
                            localStyles.donutHole,
                            {
                                width: size * 0.5,
                                height: size * 0.5,
                                borderRadius: (size * 0.5) / 2,
                                backgroundColor: tTheme.card,
                            },
                        ]}
                    />
                </Animated.View>
                
                {/* Legend */}
                <View style={localStyles.donutLegend}>
                    {data.map((item, index) => (
                        <View key={index} style={localStyles.legendItem}>
                            <View style={[localStyles.legendColor, { backgroundColor: item.color }]} />
                            <Text style={[localStyles.legendText, { color: tTheme.text }]}>
                                {item.label}: {((item.value / total) * 100).toFixed(1)}%
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
});

// Composant pour les cartes de statistiques avec animation
const StatCard = React.memo(({ title, value, icon, color, currency = '', trend, onPress }) => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    const { isMobile } = useResponsive();
    const scaleAnim = new Animated.Value(1);
    
    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };
    
    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };
    
    const CardContent = (
        <Animated.View style={[
            getGlobalStyles(theme).card, 
            localStyles.statCard,
            isMobile && localStyles.statCardMobile,
            { transform: [{ scale: scaleAnim }] }
        ]}>
            <LinearGradient
                colors={[color, color + 'DD']}
                style={localStyles.iconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={icon} size={24} color="#fff" />
            </LinearGradient>
            <View style={localStyles.statContent}>
                <Text style={[localStyles.statTitle, { color: tTheme.textSecondary }]} numberOfLines={1}>
                    {title}
                </Text>
                <View style={localStyles.statValueContainer}>
                    <Text style={[localStyles.statValue, { color: tTheme.text }]} numberOfLines={1}>
                        {value} {currency}
                    </Text>
                    {trend !== undefined && (
                        <View style={[localStyles.trendBadge, { backgroundColor: trend >= 0 ? '#10B98120' : '#EF444420' }]}>
                            <Ionicons 
                                name={trend >= 0 ? "trending-up" : "trending-down"} 
                                size={12} 
                                color={trend >= 0 ? '#10B981' : '#EF4444'} 
                            />
                            <Text style={[
                                localStyles.trendText, 
                                { color: trend >= 0 ? '#10B981' : '#EF4444' }
                            ]}>
                                {Math.abs(trend)}%
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
    
    if (onPress) {
        return (
            <TouchableOpacity 
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                {CardContent}
            </TouchableOpacity>
        );
    }
    
    return CardContent;
});

// Composant pour le graphique en barres 3D
const BarChart3D = React.memo(({ data, title, theme }) => {
    const tTheme = themes[theme];
    const [selectedBar, setSelectedBar] = useState(null);
    
    if (!data || data.length === 0) {
        return (
            <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
                <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>{title}</Text>
                <View style={localStyles.chartPlaceholder}>
                    <Ionicons name="bar-chart-outline" size={60} color={tTheme.border} />
                    <Text style={{color: tTheme.textSecondary, marginTop: 12}}>Aucune donnée disponible</Text>
                </View>
            </View>
        );
    }
    
    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 200;
    const barWidth = 40;
    const spacing = 20;
    
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
            <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>{title}</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.chartScroll}>
                <View style={localStyles.barsContainer}>
                    {data.map((item, index) => {
                        const barHeight = (item.value / maxValue) * chartHeight;
                        const isSelected = selectedBar === index;
                        
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedBar(isSelected ? null : index)}
                                style={[localStyles.barWrapper, { width: barWidth + spacing }]}
                                activeOpacity={0.7}
                            >
                                <View style={localStyles.barContainer}>
                                    {isSelected && (
                                        <View style={[localStyles.valueTooltip, { backgroundColor: tTheme.primary }]}>
                                            <Text style={localStyles.tooltipText}>
                                                {item.value.toFixed(0)}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={localStyles.bar3DWrapper}>
                                        <LinearGradient
                                            colors={[item.color || tTheme.primary, item.color ? item.color + 'AA' : tTheme.primary + 'AA']}
                                            style={[
                                                localStyles.bar3D,
                                                { 
                                                    height: barHeight,
                                                    width: barWidth,
                                                    transform: [{ scale: isSelected ? 1.05 : 1 }]
                                                }
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                        <View style={[
                                            localStyles.bar3DTop,
                                            { 
                                                backgroundColor: item.color || tTheme.primary,
                                                width: barWidth 
                                            }
                                        ]} />
                                    </View>
                                </View>
                                <Text style={[
                                    localStyles.barLabel, 
                                    { color: isSelected ? tTheme.primary : tTheme.textSecondary }
                                ]} numberOfLines={2}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
});

// Composant pour le graphique en ligne
const LineChart = React.memo(({ data, title, theme }) => {
    const tTheme = themes[theme];
    
    if (!data || data.length === 0) {
        return (
            <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
                <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>{title}</Text>
                <View style={localStyles.chartPlaceholder}>
                    <Ionicons name="analytics-outline" size={60} color={tTheme.border} />
                    <Text style={{color: tTheme.textSecondary, marginTop: 12}}>Aucune donnée disponible</Text>
                </View>
            </View>
        );
    }
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const chartHeight = 180;
    const chartWidth = Dimensions.get('window').width - 80;
    const pointRadius = 6;
    
    const getYPosition = (value) => {
        return chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    };
    
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
            <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>{title}</Text>
            
            <View style={[localStyles.lineChartContainer, { height: chartHeight + 60 }]}>
                {/* Grid lines */}
                <View style={localStyles.gridLines}>
                    {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
                        <View 
                            key={i} 
                            style={[
                                localStyles.gridLine, 
                                { 
                                    top: chartHeight * fraction,
                                    borderColor: tTheme.border + '40'
                                }
                            ]} 
                        />
                    ))}
                </View>
                
                {/* Line path */}
                <View style={localStyles.linePathContainer}>
                    {data.map((point, index) => {
                        if (index === 0) return null;
                        
                        const prevPoint = data[index - 1];
                        const x1 = ((index - 1) / (data.length - 1)) * chartWidth;
                        const y1 = getYPosition(prevPoint.value);
                        const x2 = (index / (data.length - 1)) * chartWidth;
                        const y2 = getYPosition(point.value);
                        
                        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                        
                        return (
                            <View
                                key={index}
                                style={[
                                    localStyles.lineSegment,
                                    {
                                        width: length,
                                        left: x1,
                                        top: y1,
                                        transform: [{ rotate: `${angle}deg` }],
                                        backgroundColor: tTheme.primary,
                                    }
                                ]}
                            />
                        );
                    })}
                    
                    {/* Data points */}
                    {data.map((point, index) => {
                        const x = (index / (data.length - 1)) * chartWidth;
                        const y = getYPosition(point.value);
                        
                        return (
                            <View
                                key={`point-${index}`}
                                style={[
                                    localStyles.dataPoint,
                                    {
                                        left: x - pointRadius,
                                        top: y - pointRadius,
                                        backgroundColor: tTheme.primary,
                                        borderColor: tTheme.card,
                                    }
                                ]}
                            >
                                <View style={[localStyles.pointInner, { backgroundColor: tTheme.card }]} />
                            </View>
                        );
                    })}
                </View>
                
                {/* Labels */}
                <View style={localStyles.lineLabelsContainer}>
                    {data.map((point, index) => (
                        <Text 
                            key={`label-${index}`}
                            style={[
                                localStyles.lineLabel, 
                                { 
                                    color: tTheme.textSecondary,
                                    left: (index / (data.length - 1)) * chartWidth - 20
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {point.label}
                        </Text>
                    ))}
                </View>
            </View>
        </View>
    );
});

// Composant pour les activités récentes
const RecentActivity = React.memo(({ activities, theme }) => {
    const tTheme = themes[theme];
    
    if (!activities || activities.length === 0) {
        return (
            <View style={[getGlobalStyles(theme).card, localStyles.activityContainer]}>
                <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>Activités récentes</Text>
                <View style={localStyles.emptyActivity}>
                    <Ionicons name="time-outline" size={40} color={tTheme.border} />
                    <Text style={{color: tTheme.textSecondary, marginTop: 8}}>Aucune activité récente</Text>
                </View>
            </View>
        );
    }
    
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.activityContainer]}>
            <View style={localStyles.activityHeader}>
                <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>Activités récentes</Text>
                <Ionicons name="time-outline" size={20} color={tTheme.primary} />
            </View>
            
            {activities.map((activity, index) => (
                <View key={index} style={[localStyles.activityItem, { borderBottomColor: tTheme.border }]}>
                    <View style={[
                        localStyles.activityIcon, 
                        { backgroundColor: activity.color + '20' }
                    ]}>
                        <Ionicons name={activity.icon} size={18} color={activity.color} />
                    </View>
                    <View style={localStyles.activityContent}>
                        <Text style={[localStyles.activityTitle, { color: tTheme.text }]} numberOfLines={1}>
                            {activity.title}
                        </Text>
                        <Text style={[localStyles.activityTime, { color: tTheme.textSecondary }]}>
                            {activity.time}
                        </Text>
                    </View>
                    {activity.amount && (
                        <Text style={[
                            localStyles.activityAmount, 
                            { color: activity.type === 'income' ? '#10B981' : '#EF4444' }
                        ]}>
                            {activity.type === 'income' ? '+' : '-'}{activity.amount} TND
                        </Text>
                    )}
                </View>
            ))}
        </View>
    );
});

// Composant pour le graphique (placeholder)
const PerformanceChart = React.memo(() => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
            <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>Rapport des performances</Text>
            <View style={localStyles.chartPlaceholder}>
                <Ionicons name="analytics-outline" size={80} color={tTheme.border} />
                <Text style={{color: tTheme.textSecondary, marginTop: 16, textAlign: 'center', paddingHorizontal: 16}}>
                    Les graphiques de performance seront affichés ici
                </Text>
            </View>
        </View>
    );
});

export default function DashboardScreen() {
    const { theme, language, user } = useAuth();
    const { getContentPadding, getColumns, isMobile } = useResponsive();
    const styles = getGlobalStyles(theme);
    const t = translations[language];
    const tTheme = themes[theme];

    const [stats, setStats] = useState(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [categoryDistribution, setCategoryDistribution] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Animated welcome banner
    const bannerAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        // Welcome banner animation
        Animated.spring(bannerAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
        }).start();
        
        // Glow effect animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // --- Data Fetching Logic ---
    const fetchDashboardData = useCallback(async () => {
        try {
            console.log('📊 Fetching dashboard data for user:', user.id);
            
            // Fetch all data in parallel
            const [
                salesData,
                purchasesData,
                clientsData,
                suppliersData,
                itemsData
            ] = await Promise.all([
                supabase.from('sales_orders').select('*, items, client_name, created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('purchase_orders').select('*, items, supplier_id, created_at, status, order_number').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('clients').select('id, name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('suppliers').select('id, name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('items').select('id, name, category, sale_price, purchase_price').eq('user_id', user.id)
            ]);

            console.log('✅ Data fetched:', {
                sales: salesData.data?.length,
                purchases: purchasesData.data?.length,
                clients: clientsData.data?.length,
                suppliers: suppliersData.data?.length,
                items: itemsData.data?.length
            });

            // Calculate stats
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            
            // Monthly revenue (from sales)
            const currentMonthSales = salesData.data?.filter(
                sale => new Date(sale.created_at) >= startOfMonth
            ) || [];
            
            const monthlyRevenueCalc = currentMonthSales.reduce((sum, sale) => {
                // Calculate total from items if available
                if (sale.items && Array.isArray(sale.items)) {
                    const saleTotal = sale.items.reduce((itemSum, item) => {
                        return itemSum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.sale_price) || 0));
                    }, 0);
                    return sum + saleTotal;
                }
                return sum;
            }, 0);

            // Last month revenue for trend calculation
            const lastMonthSales = salesData.data?.filter(
                sale => new Date(sale.created_at) >= startOfLastMonth && new Date(sale.created_at) <= endOfLastMonth
            ) || [];
            
            const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => {
                if (sale.items && Array.isArray(sale.items)) {
                    const saleTotal = sale.items.reduce((itemSum, item) => {
                        return itemSum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.sale_price) || 0));
                    }, 0);
                    return sum + saleTotal;
                }
                return sum;
            }, 0);

            // Calculate revenue trend
            const revenueTrend = lastMonthRevenue > 0 
                ? ((monthlyRevenueCalc - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
                : 0;

            // Open orders (pending + confirmed purchases)
            const currentOpenOrders = purchasesData.data?.filter(
                order => order.status === 'pending' || order.status === 'confirmed'
            ).length || 0;
            
            const lastMonthOpenOrders = purchasesData.data?.filter(
                order => (order.status === 'pending' || order.status === 'confirmed') &&
                         new Date(order.created_at) <= endOfLastMonth
            ).length || 0;
            
            const ordersTrend = lastMonthOpenOrders > 0
                ? ((currentOpenOrders - lastMonthOpenOrders) / lastMonthOpenOrders * 100).toFixed(1)
                : 0;

            // New clients this month
            const newClientsThisMonth = clientsData.data?.filter(
                client => new Date(client.created_at) >= startOfMonth
            ).length || 0;
            
            const newClientsLastMonth = clientsData.data?.filter(
                client => new Date(client.created_at) >= startOfLastMonth && new Date(client.created_at) <= endOfLastMonth
            ).length || 0;
            
            const clientsTrend = newClientsLastMonth > 0
                ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth * 100).toFixed(1)
                : newClientsThisMonth > 0 ? 100 : 0;

            // Unpaid/pending invoices (sales with pending/confirmed status)
            const unpaidInvoices = salesData.data?.filter(
                invoice => invoice.status === 'pending' || invoice.status === 'confirmed'
            ).length || 0;
            
            const lastMonthUnpaid = salesData.data?.filter(
                invoice => (invoice.status === 'pending' || invoice.status === 'confirmed') &&
                           new Date(invoice.created_at) <= endOfLastMonth
            ).length || 0;
            
            const invoicesTrend = lastMonthUnpaid > 0
                ? ((unpaidInvoices - lastMonthUnpaid) / lastMonthUnpaid * 100).toFixed(1)
                : 0;

            setStats({
                total_revenue_month: monthlyRevenueCalc,
                open_orders_count: currentOpenOrders,
                new_clients_month: newClientsThisMonth,
                unpaid_invoices_count: unpaidInvoices,
                trends: {
                    revenue: parseFloat(revenueTrend),
                    orders: parseFloat(ordersTrend),
                    clients: parseFloat(clientsTrend),
                    invoices: parseFloat(invoicesTrend)
                }
            });

            // Generate monthly revenue chart data (last 6 months)
            const monthlyData = [];
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                
                const monthSales = salesData.data?.filter(sale => {
                    const saleDate = new Date(sale.created_at);
                    return saleDate >= monthDate && saleDate <= monthEnd;
                }) || [];
                
                const monthRevenue = monthSales.reduce((sum, sale) => {
                    if (sale.items && Array.isArray(sale.items)) {
                        const saleTotal = sale.items.reduce((itemSum, item) => {
                            return itemSum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.sale_price) || 0));
                        }, 0);
                        return sum + saleTotal;
                    }
                    return sum;
                }, 0);
                
                monthlyData.push({
                    label: monthNames[monthDate.getMonth()],
                    value: monthRevenue,
                    color: '#3B82F6'
                });
            }
            
            setMonthlyRevenue(monthlyData);

            // Calculate top products from sales
            const itemSales = {};
            salesData.data?.forEach(sale => {
                if (sale.items && Array.isArray(sale.items)) {
                    sale.items.forEach(item => {
                        const itemId = item.item_id || item.item_name;
                        if (itemId) {
                            if (!itemSales[itemId]) {
                                itemSales[itemId] = {
                                    name: item.item_name || itemId,
                                    quantity: 0,
                                    revenue: 0
                                };
                            }
                            itemSales[itemId].quantity += parseFloat(item.quantity) || 0;
                            itemSales[itemId].revenue += (parseFloat(item.quantity) || 0) * (parseFloat(item.sale_price) || 0);
                        }
                    });
                }
            });
            
            // Sort by revenue and get top 5
            const topProductsArray = Object.values(itemSales)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((item, index) => ({
                    label: item.name,
                    value: item.revenue,
                    color: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index]
                }));
            
            setTopProducts(topProductsArray.length > 0 ? topProductsArray : [
                { label: 'Aucun produit', value: 0, color: '#9CA3AF' }
            ]);
            
            // Generate category distribution from items
            const categoryStats = {};
            let totalCategoryValue = 0;
            
            itemsData.data?.forEach(item => {
                const category = item.category || 'Non catégorisé';
                if (!categoryStats[category]) {
                    categoryStats[category] = 0;
                }
                // Count items or use a value metric
                categoryStats[category] += 1;
                totalCategoryValue += 1;
            });
            
            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F43F5E'];
            const categoryArray = Object.entries(categoryStats)
                .map(([label, value], index) => ({
                    label,
                    value,
                    color: colors[index % colors.length]
                }))
                .sort((a, b) => b.value - a.value);
            
            setCategoryDistribution(categoryArray.length > 0 ? categoryArray : [
                { label: 'Aucune catégorie', value: 1, color: '#9CA3AF' }
            ]);

            // Generate recent activities with real data
            const activities = [];
            
            // Add recent sales
            const recentSales = salesData.data?.slice(0, 3).map(sale => {
                const saleTotal = sale.items && Array.isArray(sale.items)
                    ? sale.items.reduce((sum, item) => {
                        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.sale_price) || 0));
                    }, 0)
                    : 0;
                
                return {
                    icon: 'cart-outline',
                    color: '#10B981',
                    title: `Vente - ${sale.client_name || 'Client'}`,
                    time: formatTimeAgo(sale.created_at),
                    amount: saleTotal.toFixed(3),
                    type: 'income'
                };
            }) || [];

            // Add recent purchases
            const recentPurchases = purchasesData.data?.slice(0, 3).map(purchase => {
                const purchaseTotal = purchase.items && Array.isArray(purchase.items)
                    ? purchase.items.reduce((sum, item) => {
                        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0));
                    }, 0)
                    : 0;
                
                return {
                    icon: 'download-outline',
                    color: '#EF4444',
                    title: `Achat - ${purchase.order_number || 'Commande'}`,
                    time: formatTimeAgo(purchase.created_at),
                    amount: purchaseTotal > 0 ? purchaseTotal.toFixed(3) : null,
                    type: 'expense'
                };
            }) || [];

            // Add new clients
            const recentNewClients = clientsData.data?.slice(0, 2).map(client => ({
                icon: 'person-add-outline',
                color: '#3B82F6',
                title: `Nouveau client - ${client.name}`,
                time: formatTimeAgo(client.created_at),
                type: 'info'
            })) || [];

            // Combine and sort all activities
            activities.push(...recentSales, ...recentPurchases, ...recentNewClients);
            activities.sort((a, b) => {
                // Sort by time (most recent first)
                const timeA = a.time.includes('instant') ? 0 : 
                             a.time.includes('min') ? parseInt(a.time) : 
                             a.time.includes('h') ? parseInt(a.time) * 60 : 
                             a.time.includes('j') ? parseInt(a.time) * 1440 : 9999;
                const timeB = b.time.includes('instant') ? 0 : 
                             b.time.includes('min') ? parseInt(b.time) : 
                             b.time.includes('h') ? parseInt(b.time) * 60 : 
                             b.time.includes('j') ? parseInt(b.time) * 1440 : 9999;
                return timeA - timeB;
            });
            
            setRecentActivities(activities.slice(0, 6));

            console.log('✅ Dashboard data processed successfully');

        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            Alert.alert('Erreur', 'Impossible de charger les données du tableau de bord');
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData().then(() => setRefreshing(false));
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[localStyles.loadingText, { color: tTheme.textSecondary }]}>
                    Chargement du tableau de bord...
                </Text>
            </View>
        );
    }

    const contentPadding = getContentPadding();
    
    const bannerScale = bannerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });
    
    const bannerOpacity = bannerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });
    
    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={{ flex: 1 }}>
            {/* Animated Background Particles */}
            <AnimatedParticles theme={theme} />
            
            <ScrollView 
                style={styles.container}
                contentContainerStyle={{ padding: contentPadding, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Grid */}
                <View style={localStyles.statsGrid}>
                <StatCard 
                    title="Chiffre d'affaires (Mois)" 
                    value={stats?.total_revenue_month?.toFixed(3) || '0.000'} 
                    currency="TND"
                    icon="trending-up-outline" 
                    color="#3B82F6"
                    trend={stats?.trends?.revenue}
                />
                <StatCard 
                    title="Commandes en cours" 
                    value={stats?.open_orders_count || '0'} 
                    icon="cube-outline" 
                    color="#F59E0B"
                    trend={stats?.trends?.orders}
                />
                <StatCard 
                    title="Nouveaux clients (Mois)" 
                    value={stats?.new_clients_month || '0'} 
                    icon="person-add-outline" 
                    color="#10B981"
                    trend={stats?.trends?.clients}
                />
                <StatCard 
                    title="Factures impayées" 
                    value={stats?.unpaid_invoices_count || '0'} 
                    icon="alert-circle-outline" 
                    color="#EF4444"
                    trend={stats?.trends?.invoices}
                />
            </View>

            {/* Charts Row */}
            <View style={localStyles.chartsRow}>
                <View style={[localStyles.chartWrapper, isMobile && localStyles.chartWrapperFull]}>
                    <LineChart 
                        data={monthlyRevenue}
                        title="Évolution du chiffre d'affaires"
                        theme={theme}
                    />
                </View>
                
                <View style={[localStyles.chartWrapper, isMobile && localStyles.chartWrapperFull]}>
                    <BarChart3D 
                        data={topProducts}
                        title="Top 5 Produits"
                        theme={theme}
                    />
                </View>
            </View>
            
            {/* 3D Donut Chart */}
            <DonutChart3D 
                data={categoryDistribution}
                title="Répartition par catégorie"
                theme={theme}
                size={180}
            />

            {/* Recent Activities */}
            <RecentActivity activities={recentActivities} theme={theme} />
        </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    // 3D Components Styles
    particlesContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
    },
    particle: {
        position: 'absolute',
        backgroundColor: '#3B82F6',
    },
    cube3DContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cube3D: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    cubeFace: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cubeFront: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        borderRadius: 8,
    },
    cubeTop: {
        top: -20,
        left: 10,
        opacity: 0.8,
        borderRadius: 8,
    },
    cubeRight: {
        left: 20,
        top: 10,
        opacity: 0.6,
        borderRadius: 8,
    },
    sphere3D: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 12,
    },
    sphereGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card3D: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    welcomeBanner: {
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    bannerGradient: {
        padding: 24,
        minHeight: 140,
        position: 'relative',
        overflow: 'hidden',
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
    },
    bannerText: {
        flex: 1,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    bannerShapes: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    bannerGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FFFFFF',
    },
    donutContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    donut3D: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutSegment: {
        position: 'absolute',
        overflow: 'hidden',
    },
    donutSegmentInner: {
        width: '100%',
        height: '100%',
    },
    donutHole: {
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    donutLegend: {
        marginTop: 30,
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 10,
    },
    legendText: {
        fontSize: 13,
        fontWeight: '500',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
        marginBottom: 12,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 8,
        flex: 1,
        minWidth: 280,
        maxWidth: '100%',
        overflow: 'visible',
    },
    statCardMobile: {
        minWidth: '100%',
        maxWidth: '100%',
        flex: 0,
        flexBasis: 'auto',
    },
    statContent: {
        flex: 1,
        minWidth: 0,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    statTitle: {
        fontSize: 13,
        marginBottom: 6,
        fontWeight: '500',
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
    },
    chartsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
        marginBottom: 12,
    },
    chartWrapper: {
        flex: 1,
        minWidth: 400,
        margin: 6,
        overflow: 'hidden',
    },
    chartWrapperFull: {
        minWidth: '100%',
        flex: 0,
    },
    chartContainer: {
        marginTop: 8,
        minHeight: 320,
        padding: 20,
        overflow: 'hidden',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    chartPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 260,
        paddingVertical: 40,
    },
    chartScroll: {
        marginTop: 10,
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 240,
        paddingHorizontal: 20,
    },
    barWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
        paddingBottom: 40,
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    bar3DWrapper: {
        position: 'relative',
    },
    bar3D: {
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    bar3DTop: {
        height: 8,
        position: 'absolute',
        top: -4,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        transform: [{ perspective: 400 }, { rotateX: '45deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    valueTooltip: {
        position: 'absolute',
        top: -30,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 4,
    },
    tooltipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    barLabel: {
        fontSize: 11,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    lineChartContainer: {
        marginTop: 10,
        position: 'relative',
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        height: 180,
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        borderTopWidth: 1,
        borderStyle: 'dashed',
    },
    linePathContainer: {
        position: 'relative',
        height: 180,
    },
    lineSegment: {
        position: 'absolute',
        height: 3,
        borderRadius: 2,
    },
    dataPoint: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
    },
    pointInner: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    lineLabelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 190,
        position: 'relative',
        height: 30,
    },
    lineLabel: {
        fontSize: 11,
        position: 'absolute',
        width: 40,
        textAlign: 'center',
        fontWeight: '500',
    },
    activityContainer: {
        marginTop: 8,
        padding: 20,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
        minWidth: 0,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
    },
    activityAmount: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    emptyActivity: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
});