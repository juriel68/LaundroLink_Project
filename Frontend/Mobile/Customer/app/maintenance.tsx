import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function MaintenanceScreen() {
    return (
        <LinearGradient
            colors={['#81D4FA', '#4FC3F7']}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="build-outline" size={80} color="#fff" />
                </View>
                <Text style={styles.title}>System Maintenance</Text>
                <Text style={styles.message}>
                    We're currently making some scheduled updates to improve your experience.
                </Text>
                <Text style={styles.subtext}>
                    The app will be back online shortly. Thank you for your patience!
                </Text>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingVertical: 50,
    },
    iconContainer: {
        marginBottom: 20,
        padding: 20,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    message: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 15,
    },
    subtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    }
});