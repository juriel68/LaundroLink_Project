// Customer/app/(tabs)/homepage/about_laundry.tsx

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router"; 
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import { 
  fetchShopDetails, 
  Shop, 
  Service, 
  AddOn,
  DeliveryOption,
  FabricType 
} from "@/lib/shops"; 

function formatServiceItem(service: Service): string {
  let loadText = '';
  const minWeight = Number(service.minWeight);
  
  if (minWeight > 1) {
    loadText = `(${minWeight}kg min.)`;
  } 
  // If minWeight is 1 or 0, we don't need extra text since "/kg" implies it.
  
  const numericPrice = parseFloat(String(service.price)); 
  const price = !isNaN(numericPrice) ? numericPrice.toFixed(2) : 'N/A';
  
  // 🔑 UPDATED: Added "/kg" to the display string
  return `${service.name} - ₱${price}/kg ${loadText}`;
}

export default function AboutLaundry() {
  const router = useRouter(); 
  const params = useLocalSearchParams();
  
  // Robust ID Extraction (Handle potential array or string)
  const rawId = params.shopId || params.id;
  const targetIdString = Array.isArray(rawId) ? rawId[0] : (rawId as string);
  // Internal logic uses numbers (DB is INT), navigation uses strings
  const targetId = parseInt(targetIdString, 10);

  const initialName = Array.isArray(params.name) ? params.name[0] : (params.name as string);
  const initialDistance = Array.isArray(params.distance) ? params.distance[0] : (params.distance as string);
  const initialRating = Array.isArray(params.rating) ? params.rating[0] : (params.rating as string);
  const initialImage = Array.isArray(params.image) ? params.image[0] : (params.image as string);
  const initialAddress = Array.isArray(params.address) ? params.address[0] : (params.address as string);

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]); 
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'services' | 'addOns' | null>(null); 

  const toggleSection = useCallback((section: 'services' | 'addOns') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const fetchShopData = useCallback(async () => {
    setLoading(true); 
    setError(null); 

    if (!targetId) {
      setError("Shop ID is missing.");
      setLoading(false);
      return;
    }

    try {
      const fullDetails = await fetchShopDetails(targetId);

      if (fullDetails) {
        setShop({
          ...fullDetails.shop,
          distance: fullDetails.shop.distance || parseFloat(initialDistance || '0'),
          image_url: fullDetails.shop.image_url || initialImage,
        });
        setServices(fullDetails.services);
        setAddOns(fullDetails.addOns);
        setDeliveryOptions(fullDetails.deliveryOptions); 
        setFabricTypes(fullDetails.fabricTypes); 
      } else {
        setError("Failed to load shop details.");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [targetId, initialDistance, initialImage]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const currentShop: Shop = shop ? {
    ...shop,
    id: targetId,
  } : { 
    id: targetId || 0, 
    name: initialName || "Loading...", 
    distance: parseFloat(initialDistance || '0'), 
    rating: initialRating || "0.0", 
    image_url: initialImage,
    address: initialAddress || "N/A",
    description: "Fetching details...",
    contact: "N/A",
    hours: "N/A",
    availability: "Unavailable",
  };
  
  const imageUrl = currentShop.image_url || initialImage;

  const handleConfirm = () => {
    if (services.length === 0) {
        Alert.alert("Cannot Proceed", "This shop currently has no services listed.");
        return;
    }
    
    router.push({
        pathname: "/(tabs)/homepage/avail_services",
        params: {
            shopId: currentShop.id.toString(),
            shopName: currentShop.name,
            shopImage: imageUrl,
            distance: currentShop.distance.toString(), 
            availableServices: JSON.stringify(services), 
            availableAddOns: JSON.stringify(addOns),
            availableDeliveryOptions: JSON.stringify(deliveryOptions),
            availableFabricTypes: JSON.stringify(fabricTypes),
        },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.wrapper, styles.centered]}>
        <ActivityIndicator size="large" color="#004aad" />
        <Text style={{ marginTop: 10 }}>Loading shop details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.wrapper, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchShopData} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: currentShop.name || "Laundry Shop",
          headerStyle: { backgroundColor: "#89CFF0" },
          headerTintColor: "#000",
        }}
      />

      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* 🟢 UPDATED: Centered Logo Container */}
          <View style={styles.logoContainer}>
            {imageUrl ? (
                <Image 
                  source={{ uri: imageUrl.replace('http://', 'https://') }} 
                  style={styles.logoImage} // 🟢 New Style Class
                  onError={(e) => console.error("Image load error:", e.nativeEvent.error)}
                />
              ) : (
                <View style={[styles.logoImage, styles.noImage]}>
                  <Ionicons name="image-outline" size={40} color="#ccc" />
                </View>
              )}
          </View>

          <Text style={styles.title}>{currentShop.name}</Text>
          <Text style={styles.info}>
            {currentShop.distance.toFixed(1)}km • <Ionicons name="star" size={14} color="#fadb14" /> {currentShop.rating}
          </Text>

          <Text style={[
            styles.availability, 
            currentShop.availability === "Available" ? styles.available : styles.unavailable
          ]}>{currentShop.availability || "Unknown"}</Text>

          {/* Services Section */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={styles.toggleRowButton}
              onPress={() => toggleSection('services')}
            >
              <Text style={styles.rowTitle}>Services ({services.length})</Text>
              <Ionicons name={expandedSection === 'services' ? "chevron-up" : "chevron-down"} size={20} color="#0D47A1" />
            </TouchableOpacity>
            
            {expandedSection === 'services' && (
              <View style={styles.contentBox}>
                {services.length > 0 ? services.map((svc, i) => (
                  <Text key={i} style={styles.descriptionListItem}>• {formatServiceItem(svc)}</Text>
                )) : <Text style={styles.noDataText}>No services available.</Text>}
              </View>
            )}
          </View>

          {/* Add-Ons Section */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={styles.toggleRowButton}
              onPress={() => toggleSection('addOns')}
            >
              <Text style={styles.rowTitle}>Add-Ons ({addOns.length})</Text>
              <Ionicons name={expandedSection === 'addOns' ? "chevron-up" : "chevron-down"} size={20} color="#0D47A1" />
            </TouchableOpacity>
            
            {expandedSection === 'addOns' && (
              <View style={styles.contentBox}>
                {addOns.length > 0 ? addOns.map((add, i) => {
                    const numericAddOnPrice = parseFloat(String(add.price));
                    const addOnPrice = !isNaN(numericAddOnPrice) ? numericAddOnPrice.toFixed(2) : 'N/A';
                    return (
                      <Text key={i} style={styles.descriptionListItem}>• {add.name} - ₱{addOnPrice}</Text>
                    );
                }) : <Text style={styles.noDataText}>No add-ons available.</Text>}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{currentShop.description || "No description provided."}</Text>

          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.infoText}>📍 {currentShop.address}</Text>
          <Text style={styles.infoText}>📞 {currentShop.contact}</Text>
          <Text style={styles.infoText}>⏰ {currentShop.hours}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.confirmButton, services.length === 0 && styles.disabledButton]} 
            onPress={handleConfirm}
            disabled={services.length === 0}
          >
            <Text style={styles.confirmText}>Proceed to Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f6f6f6" },
  centered: { justifyContent: "center", alignItems: "center", flex: 1, padding: 20 },
  container: { alignItems: "center", padding: 20, paddingBottom: 100 },
  // 🟢 UPDATED IMAGE STYLES
  logoContainer: {
      marginBottom: 15,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 5,
  },
  logoImage: { 
      width: 200, 
      height: 200, 
      borderRadius: 30, // Makes it a circle
      resizeMode: 'cover',
      borderWidth: 3,
      borderColor: '#fff',
  },
  noImage: { 
      backgroundColor: '#e0e0e0', 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: '#1c3d63' },
  info: { fontSize: 16, color: "#555", marginTop: 5 },
  availability: { fontSize: 16, marginTop: 8, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  available: { color: "white", backgroundColor: '#4CAF50' },
  unavailable: { color: "white", backgroundColor: '#F44336' },
  
  sectionWrapper: { width: '100%', marginBottom: 10, marginTop: 10, paddingHorizontal: 5 },
  toggleRowButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 15, backgroundColor: '#E3F2FD', borderRadius: 8, borderWidth: 1, borderColor: '#BBDEFB' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#0D47A1' },
  contentBox: { width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 15, marginTop: 5, borderWidth: 1, borderColor: '#BBDEFB', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  descriptionListItem: { fontSize: 14, color: "#444", lineHeight: 22, marginLeft: 5 },
  noDataText: { width: '100%', textAlign: 'center', color: '#888', fontStyle: 'italic', paddingVertical: 5, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 5, alignSelf: "flex-start", color: '#1c3d63' },
  description: { fontSize: 14, color: "#444", lineHeight: 20, marginBottom: 5, textAlign: "justify", alignSelf: 'stretch' },
  infoText: { fontSize: 14, color: "#333", marginBottom: 4, alignSelf: "flex-start" },
  
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#f6f6f6", padding: 20, borderTopWidth: 1, borderColor: "#eee" },
  confirmButton: { backgroundColor: "#004aad", paddingVertical: 14, borderRadius: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  disabledButton: { backgroundColor: '#ccc' },
  confirmText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  errorText: { color: 'red', fontSize: 16, marginBottom: 15, textAlign: 'center' },
  retryButton: { backgroundColor: '#89CFF0', padding: 10, borderRadius: 5 },
  retryText: { color: '#fff', fontWeight: 'bold' }
});