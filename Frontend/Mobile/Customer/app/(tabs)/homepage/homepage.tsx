import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router"; 
import * as Location from 'expo-location';
import React, { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from "react-native";

import { fetchNearbyShops, Shop } from "@/lib/shops"; 
import { UserDetails } from "@/lib/auth"; 

export default function Homepage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null); 
  const [shops, setShops] = useState<Shop[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lon: number; name: string; } | null>(null);

  const loadShops = async (shouldRequestPermission = true) => {
    if (isLoading) return; 

    setIsLoading(true);
    try {
      let status: Location.PermissionStatus = Location.PermissionStatus.UNDETERMINED;
      let lat = 0;
      let lon = 0;
      let locationName = 'Unknown Location';
      
      if (shouldRequestPermission) {
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        status = permissionResult.status;
      } else {
        const permissionResult = await Location.getForegroundPermissionsAsync();
        status = permissionResult.status;
      }

      if (status !== 'granted') {
        if (shouldRequestPermission) {
          Alert.alert('Permission Denied', 'Please enable location services in your settings to find nearby shops.');
        }
        setLocationPermission(false);
        setShops([]);
        return;
      }
      setLocationPermission(true);

      // 1. Get Location
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = location.coords.latitude;
      lon = location.coords.longitude;
      
      try {
          let geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          
          // 🔑 FIX: Add explicit null/undefined check and fallback to ensure locationName is a string
          locationName = geo.length > 0 
              ? geo[0].city || geo[0].street || 'Current Location'
              : 'Current Location';

          // Ensure locationName is treated as a string
          if (typeof locationName !== 'string') {
              locationName = 'Current Location';
          }
      } catch (e) {
          locationName = 'Current Location';
      }

      // 🔑 UPDATE STATE & CACHE: Store the coordinates and name
      setCustomerCoords({ lat, lon, name: locationName });
      await AsyncStorage.setItem('customerLocation', JSON.stringify({ latitude: lat, longitude: lon, locationName }));
      console.log("📍 Location cached:", lat, lon);

      // 2. Fetch Shops
      const fetchedShops = await fetchNearbyShops(lat, lon);
      
      const validShops = fetchedShops.filter(shop => shop && shop.id !== undefined && shop.id !== null); 
      
      if (validShops.length > 0) {
        setShops(validShops);
      } else {
        if (shouldRequestPermission) Alert.alert('Info', 'No shops were found near your location.');
        setShops([]);
      }

    } catch (error) {
      Alert.alert('Error', 'Could not load shops. Check your network connection.');
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToShopDetails = (item: Shop) => {
    router.push({ 
      pathname: "/homepage/about_laundry", 
      params: { 
        shopId: item.id.toString(), 
        name: item.name,
        image: item.image_url,
        rating: item.rating,
        distance: item.distance.toString(),
        address: item.address
      } 
    } as any);
  }

  // UPDATED: Pass cached coordinates and name to the search screen
  const navigateToSearch = () => {
    if (customerCoords) {
        router.push({
            pathname: "/homepage/search_laundry",
            params: {
                lat: customerCoords.lat.toString(),
                lon: customerCoords.lon.toString(),
                locationName: customerCoords.name,
            }
        });
    } else {
        Alert.alert("Location Required", "Please wait for location to load or refresh the page.");
        loadShops(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (storedUser) {
              const parsedUser: UserDetails = JSON.parse(storedUser);
              setUser(parsedUser);
            }
    
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
              setLocationPermission(true);
              // Try loading from cache first to get initial coords/name
              const cachedLoc = await AsyncStorage.getItem('customerLocation');
              if (cachedLoc) {
                  const { latitude, longitude, locationName } = JSON.parse(cachedLoc);
                  setCustomerCoords({ lat: latitude, lon: longitude, name: locationName });
              }
              loadShops(false); // Load shops silently
            } else {
              setLocationPermission(false);
            }
        } catch (e) {
          console.error("Error loading homepage data:", e);
        }
      };
      
      loadData();
    }, [])
  );
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#89CFF0" },
          headerTintColor: "#2d2d2dff",
          headerLeft: () => null,
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-outline" size={20} color="#2d2d2dff" />
              <Text style={{ color: "#2d2d2dff", marginLeft: 5, fontSize: 20, fontWeight: "600" }}>
                {customerCoords?.name || "Locating..."}
              </Text>
              <Ionicons name="caret-down-outline" size={14} color="#2d2d2dff" style={{ marginLeft: 2, top: 1 }} />
            </View>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push("/homepage/profile" as any)}>
              {user && user.picture ? (
                <Image 
                    source={{ uri: user.picture.replace('http://', 'https://') }} 
                    style={styles.headerAvatar} 
                />
              ) : (
                <Ionicons name="person-circle-outline" size={32} color="#2d2d2dff" style={{ marginRight: 10 }} />
              )}
            </Pressable>
          ),
        }}
      />

      <View style={styles.container}>
        <Pressable style={styles.searchBar} onPress={navigateToSearch} disabled={isLoading && !customerCoords}>
          <Ionicons name="search" size={20} color="#888" style={styles.icon} />
          <Text style={styles.placeholder}>Search laundry shops</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Laundry Shops Nearby</Text>

        {isLoading && shops.length === 0 ? (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#004aad" />
              <Text style={{ marginTop: 10, color: '#004aad' }}>Finding nearby shops...</Text>
          </View>
        ) : shops.length > 0 ? (
          <FlatList
            data={shops}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.shopList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
                const imageUrl = item.image_url;
                const isOpen = item.availability === "Available";

                return (
                    <Pressable 
                        style={styles.shopCard}
                        onPress={() => navigateToShopDetails(item)}
                    >
                        <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.shopImage} 
                            resizeMode="cover"
                        />
                        <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.shopDetails}>
                            {Number(item.distance).toFixed(1)} km{' '}
                            <Ionicons name="star" size={12} color="#fadb14" />{' '}
                            {parseFloat(item.rating || '0').toFixed(1)}
                        </Text>
                        <View style={[ styles.badge, { backgroundColor: isOpen ? "#4CAF50" : "#FF5252" } ]}>
                          <Text style={styles.badgeText}>{item.availability || 'Unknown'}</Text>
                        </View>
                    </Pressable>
                );
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {locationPermission 
                    ? "No shops found nearby. Try refreshing or checking your location settings."
                    : "Press the button to allow location access and find shops near you."
                }
            </Text>
            <TouchableOpacity 
                style={styles.findButton} 
                onPress={() => loadShops(true)} 
            >
              <Ionicons name="navigate-outline" size={20} color="#fff" />
              <Text style={styles.findButtonText}>Find Shops Near Me</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
    headerAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, borderWidth: 1, borderColor: '#5EC1EF' },
    container: { flex: 1, backgroundColor: "#f8f9fb", paddingTop: 30, paddingHorizontal: 16 },
    searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", width: "100%", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 25, elevation: 2, marginBottom: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
    icon: { marginRight: 8 },
    placeholder: { fontSize: 16, color: "#777", fontWeight: "500" },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#2d2d2d" },
    shopList: { paddingBottom: 20, justifyContent: 'space-between' },
    shopCard: { flex: 1, backgroundColor: "#fff", margin: 8, borderRadius: 16, padding: 14, alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
    shopImage: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 10, backgroundColor: '#eee' },
    shopName: { fontSize: 14, fontWeight: "600", textAlign: "center", color: "#333" },
    shopDetails: { fontSize: 12, color: "#666", marginTop: 4, alignSelf: 'center', textAlign: 'center' },
    badge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 },
    badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { textAlign: 'center', marginBottom: 20, color: '#888', fontSize: 16 },
    findButton: { flexDirection: 'row', backgroundColor: '#004aad', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', elevation: 3 },
    findButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 150 }
});