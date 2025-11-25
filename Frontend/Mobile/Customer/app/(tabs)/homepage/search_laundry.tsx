import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect, useCallback } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { fetchNearbyShops, Shop } from "@/lib/shops";
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150?text=Shop+Image";
const suggestions = ["Wash & Dry", "Sparklean", "Full Service"];

export default function SearchLaundryScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    // 🔑 NEW: Accept latitude, longitude, and location name from homepage params
    const params = useLocalSearchParams<{ lat: string, lon: string, locationName: string }>();

    // --- STATE ---
    // 🔑 Use the passed location name, defaulting to fetching state
    const [currentLocation, setCurrentLocation] = useState(params.locationName || 'Fetching Location...');
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    
    // --- Geolocation/Data Fetching ---
    // 🔑 UPDATED: fetchLocationAndShops now uses the passed coordinates
    const fetchShops = useCallback(async (initialLat: number, initialLon: number, initialName: string) => {
        setLoading(true);
        setCurrentLocation(initialName);

        try {
            // 1. Fetch Shops using passed coordinates
            const fetchedShops = await fetchNearbyShops(initialLat, initialLon);
            setShops(fetchedShops);

        } catch (error) {
            console.error("Error fetching shops:", error);
            Alert.alert("Error", "Failed to load shop data.");
            setShops([]);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Initial data load effect
    useFocusEffect(
        useCallback(() => {
            const initialLat = parseFloat(params.lat || '0');
            const initialLon = parseFloat(params.lon || '0');
            const initialName = params.locationName || 'Nearby Shops';

            if (initialLat !== 0 && initialLon !== 0) {
                fetchShops(initialLat, initialLon, initialName);
            } else {
                // Should only happen if homepage failed to load location
                setLoading(false);
                Alert.alert("Error", "Location data is missing. Please refresh the home screen.");
            }
        }, [params.lat, params.lon, params.locationName, fetchShops])
    );

    // Update Header when location changes
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: { backgroundColor: "#89CFF0" },
            headerTintColor: "#000000ff",
            headerShadowVisible: false,
            headerTitle: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="location-outline" size={18} color="#000000ff" />
                    <Text
                        style={{
                            color: "#2d2d2dff",
                            marginLeft: 6,
                            fontSize: 16,
                            fontWeight: "600",
                        }}
                    >
                        {currentLocation}
                    </Text>
                    {/* Simplified header, removing the modal/location selection logic */}
                    <Ionicons
                        name="chevron-down"
                        size={16}
                        color="#2d2d2dff"
                        style={{ marginLeft: 4 }}
                    />
                </View>
            ),
        });
    }, [navigation, currentLocation, loading]);

    // 🔎 Filter shops based on query (only filters loaded shops)
    const filteredShops = shops.filter((shop) =>
        shop.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <View style={styles.outerContainer}>
            {/* Removed Modal Logic (Location selection will be done on the homepage) */}
            
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                {/* ✅ Search bar with TextInput */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#888" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search laundry shops"
                        placeholderTextColor="#888"
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>

                {/* Suggested keywords */}
                {query === "" && (
                    <>
                        <Text style={styles.sectionTitle}>You may want to search</Text>
                        <View style={styles.suggestionContainer}>
                            {suggestions.map((s, index) => (
                                <Pressable
                                    key={index}
                                    style={styles.suggestionChip}
                                    onPress={() => setQuery(s)}
                                >
                                    <Text style={styles.suggestionText}>{s}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}

                {/* Recommended / Filtered shops */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                    {query === "" ? "Recommended Shops" : `Search Results (${filteredShops.length})`}
                </Text>
                
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#004aad" /></View>
                ) : (
                    <FlatList
                        data={filteredShops}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        contentContainerStyle={styles.shopList}
                        renderItem={({ item }) => {
                            // Ensure image is a valid URI
                            const imageUrl = item.image_url ? item.image_url.replace('http://', 'https://') : PLACEHOLDER_IMAGE;

                            return (
                                <Link
                                    href={{
                                        pathname: "./about_laundry",
                                        params: {
                                            // 🔑 Pass required shop details
                                            shopId: item.id.toString(),
                                            shopName: item.name,
                                            distance: item.distance.toFixed(1),
                                            rating: item.rating,
                                            image_url: item.image_url,
                                            address: item.address,
                                            // Add other required parameters here if needed by about_laundry
                                        },
                                    }}
                                    asChild
                                >
                                    <Pressable style={styles.shopRow}>
                                        <Image 
                                            source={{ uri: imageUrl }} 
                                            style={styles.shopRowImage} 
                                            onError={() => console.log(`Failed to load image for ${item.name}`)}
                                        />
                                        <View style={styles.shopRowDetails}>
                                            <Text style={styles.shopRowName}>{item.name}</Text>
                                            <Text style={styles.shopRowInfo}>
                                                {item.distance.toFixed(1)} km • ⭐ {item.rating}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusIndicator, item.availability === 'Available' ? styles.statusAvailable : styles.statusUnavailable]} />
                                    </Pressable>
                                </Link>
                            );
                        }}
                        ListEmptyComponent={() => (
                            <Text style={styles.emptyText}>
                                No shops found near {currentLocation}.
                            </Text>
                        )}
                    />
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: "#f7f9fc",
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 0,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        width: "100%",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 20,
    },
    icon: { marginRight: 8 },
    input: { flex: 1, fontSize: 16, color: "#222" },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
        color: "#333",
    },
    suggestionContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 10,
    },
    suggestionChip: {
        backgroundColor: "#eaf6ff",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#cce9ff",
    },
    suggestionText: { fontSize: 14, color: "#2a6ebd", fontWeight: "500" },
    shopList: { paddingBottom: 20 },
    shopRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginVertical: 6,
        padding: 12,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
    },
    shopRowImage: { width: 70, height: 70, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0' },
    shopRowDetails: { flex: 1 },
    shopRowName: { fontSize: 16, fontWeight: "600", marginBottom: 3, color: "#222" },
    shopRowInfo: { fontSize: 13, color: "#666" },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        position: 'absolute',
        top: 10,
        right: 10,
        borderWidth: 1,
        borderColor: '#fff',
    },
    statusAvailable: {
        backgroundColor: '#2ecc71', // Green
    },
    statusUnavailable: {
        backgroundColor: '#e74c3c', // Red
    },
    emptyText: {
        textAlign: "center", 
        marginTop: 20, 
        color: "#777", 
        fontSize: 15 
    },
});