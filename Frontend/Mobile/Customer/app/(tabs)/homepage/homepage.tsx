import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

// --- Import API_URL from your new lib/api.ts file ---
import { API_URL } from "@/lib/api"; // Assuming your lib folder is correctly aliased by Expo Router/tsconfig

// --- Define Interface for Fetched Data ---
interface Shop {
    // These keys must match the aliases used in your SQL query in shop.js (e.g., LS.ShopID as id)
    id: string; // ShopID
    name: string; // ShopName
    distance: string; // ShopDistance
    rating: number; // Calculated averageRating (from SQL)
    description: string; // ShopDescrp and addDescription
    address: string; // ShopAddress
    contact: string; // ShopPhone
    hours: string; // ShopOpeningHours
    availability: string; // ShopStatus
}

// Interface for local storage user data
interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    picture: string | null;
    address: string | null;
}

// --- Mock Image Mapping (since image isn't in DB, map ShopID to local asset) ---
const SHOP_IMAGE_MAP: { [key: string]: any } = {
    // Map your ShopIDs to your local assets
    "SH01": require("@/assets/images/washndry.png"),   // Wash n’ Dry - Lahug
    "SH02": require("@/assets/images/sparklean.jpg"),  // Sparklean - Apas
    "SH03": require("@/assets/images/laundry.avif"),   // Laundry Cleaning - Cebu
    "SH04": require("@/assets/images/washnwait.jpg"),  // Wash n’ Wait - Lahug
    
    // Add a general placeholder image for safety
    "DEFAULT": require("@/assets/images/24hour.jpg"), 
};

export default function Homepage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [shops, setShops] = useState<Shop[]>([]); // State to hold fetched shops
    const [isLoading, setIsLoading] = useState(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state

    // Function to load user data from AsyncStorage
    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to load user from storage", error);
        }
    };

    // Function to fetch shop data from the Express backend
    const fetchShops = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // --- CONSTRUCTING THE API URL ---
            // API_URL is "http://192.168.0.181:8080/api"
            // The endpoint is /shops/ (handled by app.use('/api/shops', shopRouter))
            const shopListUrl = `${API_URL}/shops`; 
            
            const response = await fetch(shopListUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Map the fetched data to ensure the 'rating' is correctly formatted
            const formattedShops: Shop[] = data.shops.map((shop: any) => ({
                ...shop,
                // Ensure rating is rounded and converted to a string for display if needed later
                rating: parseFloat(shop.rating || '0').toFixed(1),
                availability: shop.availability || 'Unknown', 
                // We are reusing 'description' for 'addDescription' since it's not a separate DB field
                addDescription: shop.description, 
            }));

            setShops(formattedShops);

        } catch (e) {
            const err = e as Error;
            console.error("Network or API error:", err.message);
            setError(`Could not fetch shops: ${err.message}`);
            setShops([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Combined hook to load both user and shop data on focus
    useFocusEffect(
        useCallback(() => {
            loadUser();
            fetchShops();
        }, [])
    );

    // --- Loading/Error State UI ---
    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#89CFF0" />
                <Text style={{ marginTop: 10 }}>Loading nearby shops...</Text>
            </View>
        );
    }
    
    if (error) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'red', textAlign: 'center' }}>
                    Error connecting to server: {error}.{'\n'}Please check your backend status and IP address in lib/api.ts.
                </Text>
            </View>
        );
    }

    // --- Main Render Component ---
    return (
        <>
            <Stack.Screen
                options={{
                    // ... existing header options (omitted for brevity)
                    headerShown: true,
                    headerStyle: { backgroundColor: "#89CFF0" },
                    headerTitleStyle: { color: "#2d2d2dff", fontWeight: "600", fontSize: 20 },
                    headerTintColor: "#2d2d2dff",
                    headerShadowVisible: false,
                    headerLeft: () => null,
                    headerTitle: () => (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="location-outline" size={20} color="#2d2d2dff" />
                            <Text style={{ color: "#2d2d2dff", marginLeft: 5, fontSize: 20, fontWeight: "600" }}>
                                Home ▼
                            </Text>
                        </View>
                    ),
                    headerRight: () => (
                        <Pressable onPress={() => router.push("/(tabs)/homepage/profile" as any)}>
                            {user && user.picture ? (
                                <Image source={{ uri: user.picture }} style={styles.headerAvatar} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={32} color="#2d2d2dff" style={{ marginRight: 10 }} />
                            )}
                        </Pressable>
                    ),
                }}
            />

            <View style={styles.container}>
                <Link href="./search_laundry" asChild>
                    <Pressable style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#888" style={styles.icon} />
                        <Text style={styles.placeholder}>Search laundry shops</Text>
                    </Pressable>
                </Link>

                <Text style={styles.sectionTitle}>Laundry Shops Nearby</Text>
                
                {shops.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#888', marginTop: 30 }}>
                        No shops found nearby.
                    </Text>
                ) : (
                    <FlatList
                        data={shops}
                        numColumns={2}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.shopList}
                        renderItem={({ item }) => {
                            const shopImage = SHOP_IMAGE_MAP[item.id] || SHOP_IMAGE_MAP.DEFAULT;
                            const badgeColor = item.availability === "Available" ? "#4CAF50" : "#FF5252";

                            return (
                                <Link
                                    href={{
                                        pathname: "./about_laundry",
                                        // Pass all required data via params
                                        params: {
                                            id: item.id,
                                            name: item.name,
                                            distance: item.distance,
                                            rating: item.rating,
                                            description: item.description,
                                            addDescription: item.description, 
                                            address: item.address,
                                            contact: item.contact,
                                            hours: item.hours,
                                            availability: item.availability,
                                        },
                                    }}
                                    asChild
                                >
                                    <Pressable style={styles.shopCard}>
                                        <Image source={shopImage} style={styles.shopImage} />
                                        <Text style={styles.shopName}>{item.name}</Text>
                                        <Text style={styles.shopDetails}>
                                            {item.distance} • ⭐ {item.rating}
                                        </Text>
                                        <View
                                            style={[
                                                styles.badge,
                                                { backgroundColor: badgeColor },
                                            ]}
                                        >
                                            <Text style={styles.badgeText}>{item.availability}</Text>
                                        </View>
                                    </Pressable>
                                </Link>
                            );
                        }}
                    />
                )}
            </View>
        </>
    );
}

// ... existing styles remain the same
const styles = StyleSheet.create({
    headerAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#5EC1EF'
    },
    container: {
        flex: 1,
        backgroundColor: "#f8f9fb",
        paddingTop: 30,
        paddingHorizontal: 16,
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
        marginBottom: 22,
    },
    icon: {
        marginRight: 8,
    },
    placeholder: {
        fontSize: 16,
        color: "#777",
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 16,
        color: "#2d2d2d",
    },
    shopList: {
        paddingBottom: 20,
    },
    shopCard: {
        flex: 1,
        backgroundColor: "#fff",
        margin: 8,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 3,
    },
    shopImage: {
        width: 110,
        height: 110,
        borderRadius: 12,
        marginBottom: 10,
    },
    shopName: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
        color: "#333",
    },
    shopDetails: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    badge: {
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
});