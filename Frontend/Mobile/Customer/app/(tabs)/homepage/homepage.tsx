// homepage.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router"; 
import * as Location from 'expo-location';
import React, { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from "react-native";

import { fetchNearbyShops, Shop } from "@/lib/shops"; 
// 🔑 IMPORT the UserDetails type from your authentication utilities
import { UserDetails } from "@/lib/auth"; 


export default function Homepage() {
  const router = useRouter();
  // 🎯 Use the imported UserDetails type
  const [user, setUser] = useState<UserDetails | null>(null); 
  const [shops, setShops] = useState<Shop[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  const loadShops = async (shouldRequestPermission = true) => {
    if (isLoading) return; 

    setIsLoading(true);
    try {
      let status: Location.PermissionStatus = Location.PermissionStatus.UNDETERMINED;
      
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

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      // Assuming fetchNearbyShops is defined correctly in "@/lib/shops"
      const fetchedShops = await fetchNearbyShops(latitude, longitude);

      if (fetchedShops.length > 0) {
        setShops(fetchedShops);
      } else {
        Alert.alert('Info', 'No shops were found near your location.');
        setShops([]);
      }

    } catch (error) {
      console.error("❌ Failed to fetch shops:", error);
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
        ...item, 
        image: item.image_url 
      } 
    });
  }

  const navigateToSearch = () => {
    router.push("./search_laundry");
  };


  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
            const parsedUser: UserDetails = JSON.parse(storedUser);
            // 🎯 Ensure the User object is correctly stored in state.
            setUser(parsedUser);
        }

        let { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
            setLocationPermission(true);
            loadShops(false); 
        } else {
            setLocationPermission(false);
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
              <Text style={{ color: "#2d2d2dff", marginLeft: 5, fontSize: 20, fontWeight: "600" }}>Home</Text>
              <Ionicons name="caret-down-outline" size={14} color="#2d2d2dff" style={{ marginLeft: 2, top: 1 }} />
            </View>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push("/(tabs)/homepage/profile" as any)}>
              {/* Check if user exists AND if the picture property exists */}
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
        <Pressable style={styles.searchBar} onPress={navigateToSearch}>
          <Ionicons name="search" size={20} color="#888" style={styles.icon} />
          <Text style={styles.placeholder}>Search laundry shops</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Laundry Shops Nearby</Text>

        {isLoading ? (
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
            renderItem={({ item }) => (
              <Pressable 
                style={styles.shopCard}
                onPress={() => navigateToShopDetails(item)}
              >
                <Image source={{ uri: item.image_url }} style={styles.shopImage} />
                <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.shopDetails}>{item.distance.toFixed(1)} km{' '}
                    <Ionicons name="star" size={12} color="#fadb14" />{' '}
                    {parseFloat(item.rating || '0').toFixed(1)}
                </Text>
                <View style={[ styles.badge, { backgroundColor: item.availability === "Available" ? "#4CAF50" : "#FF5252" } ]}>
                  <Text style={styles.badgeText}>{item.availability || 'Unknown'}</Text>
                </View>
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {locationPermission 
                    ? "No shops found nearby. Try again or check your location settings."
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
  shopDetails: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 4,
    alignSelf: 'center', 
    textAlign: 'center' 
  },
  badge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2 },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#888',
    fontSize: 16,
  },
  findButton: {
    flexDirection: 'row',
    backgroundColor: '#004aad',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
  },
  findButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  }
});