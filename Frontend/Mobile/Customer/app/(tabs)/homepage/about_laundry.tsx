// about_laundry.tsx (FINALIZED CODE with CRITICAL FIX for data passing)

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

// Importing types and API function from shops.ts
import { 
  fetchShopDetails, 
  Shop, 
  Service, 
  AddOn,
  DeliveryOption,
  FabricType 
} from "@/lib/shops"; 

// --- Helper Functions ---
function formatServiceItem(service: Service): string {
  let loadText = '';
  if (service.minLoad === 0 && service.maxLoad > 0) {
    loadText = `(Up to ${service.maxLoad}kg)`;
  } else if (service.minLoad > 0 && service.maxLoad > 0) {
    loadText = `(${service.minLoad}kg - ${service.maxLoad}kg)`;
  } else if (service.minLoad > 0) {
    loadText = `(${service.minLoad}kg min.)`;
  }
  
  // Safely parse the price and format to two decimal places
  const numericPrice = parseFloat(String(service.price)); 
  const price = !isNaN(numericPrice) ? numericPrice.toFixed(2) : 'N/A';
  
  return `${service.name} - ₱${price} ${loadText}`;
}


// --- Main Component ---
export default function AboutLaundry() {
  const router = useRouter(); 
  const params = useLocalSearchParams();
  
  // Safely extract initial params passed from homepage.tsx
  const shopId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const initialName = Array.isArray(params.name) ? params.name[0] : (params.name as string);
  const initialDistance = Array.isArray(params.distance) ? params.distance[0] : (params.distance as string);
  const initialRating = Array.isArray(params.rating) ? params.rating[0] : (params.rating as string);
  const initialImage = Array.isArray(params.image) ? params.image[0] : (params.image as string);

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

    if (!shopId) {
      setError("Shop ID is missing.");
      setLoading(false);
      return;
    }

    try {
      const fullDetails = await fetchShopDetails(shopId);

      if (fullDetails) {
        // Use the fetched shop details, but prioritize the distance 
        setShop({
          ...fullDetails.shop,
          distance: parseFloat(initialDistance) || fullDetails.shop.distance,
          image_url: fullDetails.shop.image_url || initialImage,
        });
        setServices(fullDetails.services);
        setAddOns(fullDetails.addOns);
        setDeliveryOptions(fullDetails.deliveryOptions); 
        setFabricTypes(fullDetails.fabricTypes); 
        
      } else {
        setError("Failed to fetch full shop details.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not connect to the server or an unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [shopId, initialDistance, initialImage]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // Fallback shop details using data passed via navigation params.
  const currentShop: Shop = shop ? {
    ...shop,
    name: shop.name || initialName,
    rating: shop.rating || initialRating,
    distance: typeof shop.distance === 'number' ? shop.distance : parseFloat(initialDistance || '0'),
    id: shopId,
  } : { 
    id: shopId, 
    name: initialName, 
    distance: parseFloat(initialDistance || '0'), 
    rating: initialRating, 
    image_url: initialImage,
    description: "No description available.",
    address: "N/A",
    contact: "N/A",
    hours: "N/A",
    availability: "Unavailable",
  };
  
  const imageUrl = currentShop.image_url || initialImage;


  // 🔑 CRITICAL FIX: Function to handle navigation and parameter passing
  const handleConfirm = () => {
    // Ensure we have services to offer before proceeding
    if (services.length === 0) {
        Alert.alert("Cannot Proceed", "This shop currently has no services listed.");
        return;
    }
    
    router.push({
        pathname: "/(tabs)/homepage/avail_services",
        params: {
            shopId: currentShop.id,
            shopName: currentShop.name,
            shopImage: imageUrl,
            
            // 🚨 IMPORTANT: Serialize the complex array data to a JSON string
            // This is required to pass data correctly via URL/Navigation params.
            availableServices: JSON.stringify(services), 
            availableAddOns: JSON.stringify(addOns),
            availableDeliveryOptions: JSON.stringify(deliveryOptions),
            availableFabricTypes: JSON.stringify(fabricTypes),
        },
    });
  };

  if (loading) {
    return (
      <View style={[styles.wrapper, styles.centered]}>
        <ActivityIndicator size="large" color="#0D47A1" />
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
          title: currentShop.name ? String(currentShop.name) : "Laundry Shop",
          headerStyle: { backgroundColor: "#89CFF0" },
          headerTintColor: "#000",
        }}
      />

      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* Shop Image */}
          {imageUrl ? (
              <Image 
                source={{ uri: imageUrl.replace('http://', 'https://') }} 
                style={styles.image} 
                onError={(e) => console.error("Image load error:", e.nativeEvent.error)}
              />
            ) : (
              <View style={[styles.image, styles.noImage]}>
                <Ionicons name="image-outline" size={50} color="#ccc" />
                <Text style={{ color: '#ccc', marginTop: 5 }}>No Image</Text>
              </View>
            )}

          {/* Name + Rating */}
          <Text style={styles.title}>{currentShop.name}</Text>
          <Text style={styles.info}>
            {currentShop.distance.toFixed(1)}km • <Ionicons name="star" size={14} color="#fadb14" /> {currentShop.rating}
          </Text>

          {/* Availability */}
          <Text style={[
            styles.availability, 
            currentShop.availability === "Available" ? styles.available : styles.unavailable
          ]}>{currentShop.availability}</Text>

          {/* --- Services Button and Content (First Row) --- */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={styles.toggleRowButton}
              onPress={() => toggleSection('services')}
            >
              <Text style={styles.rowTitle}>Services({services.length})
              </Text>
              <Ionicons 
                name={expandedSection === 'services' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#0D47A1" 
              />
            </TouchableOpacity>
            
            {expandedSection === 'services' && (
              <View style={styles.contentBox}>
                {services.length > 0 ? services.map((svc: Service, i: number) => (
                  <Text key={i} style={styles.descriptionListItem}>• {formatServiceItem(svc)}</Text>
                )) : <Text style={styles.noDataText}>No main services available.</Text>}
              </View>
            )}
          </View>

          {/* --- Add-Ons Button and Content (Second Row) --- */}
          <View style={styles.sectionWrapper}>
            <TouchableOpacity 
              style={styles.toggleRowButton}
              onPress={() => toggleSection('addOns')}
            >
              <Text style={styles.rowTitle}>Add-Ons ({addOns.length})
              </Text>
              <Ionicons 
                name={expandedSection === 'addOns' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#0D47A1" 
              />
            </TouchableOpacity>
            
            {expandedSection === 'addOns' && (
              <View style={styles.contentBox}>
                {addOns.length > 0 ? addOns.map((add: AddOn, i: number) => {
                    // Safely parse and render add-on price
                    const numericAddOnPrice = parseFloat(String(add.price));
                    const addOnPrice = !isNaN(numericAddOnPrice) ? numericAddOnPrice.toFixed(2) : 'N/A';

                    return (
                      <Text key={i} style={styles.descriptionListItem}>• {add.name} - ₱{addOnPrice}</Text>
                    );
                }) : <Text style={styles.noDataText}>No add-ons available.</Text>}
              </View>
            )}
          </View>

          {/* --- About Section --- */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{currentShop.description}</Text>

          {/* --- Contact Info --- */}
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.infoText}>📍 {currentShop.address}</Text>
          <Text style={styles.infoText}>📞 {currentShop.contact}</Text>
          <Text style={styles.infoText}>⏰ {currentShop.hours}</Text>
        </ScrollView>

        {/* Confirm Button */}
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
  centered: { justifyContent: "center", alignItems: "center" },
  container: { alignItems: "center", padding: 20, paddingBottom: 100 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 15, resizeMode: 'cover' },
  noImage: { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: '#1c3d63' },
  info: { fontSize: 16, color: "#555", marginTop: 5 },
  availability: { fontSize: 16, marginTop: 8, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  available: { color: "white", backgroundColor: '#4CAF50' },
  unavailable: { color: "white", backgroundColor: '#F44336' },
  
  // Styles for the separate toggle rows
  sectionWrapper: {
    width: '100%',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  toggleRowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    backgroundColor: '#E3F2FD', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1', 
  },
  contentBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionListItem: { 
    fontSize: 14, 
    color: "#444", 
    lineHeight: 22, 
    marginLeft: 5,
  },
  noDataText: {
    width: '100%',
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    paddingVertical: 5,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 5, alignSelf: "flex-start", color: '#1c3d63' },
  description: { fontSize: 14, color: "#444", lineHeight: 20, marginBottom: 5, textAlign: "justify" },
  infoText: { fontSize: 14, color: "#333", marginBottom: 4, alignSelf: "flex-start" },
  
  // Footer and Button Styles
  footer: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: "#f6f6f6",
    padding: 20, 
    borderTopWidth: 1, 
    borderColor: "#eee",
  },
  confirmButton: { 
    backgroundColor: "#0D47A1", 
    paddingVertical: 14, 
    borderRadius: 20, 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOpacity: 0.2, 
    shadowRadius: 4, 
    elevation: 4 
  },
  disabledButton: {
    backgroundColor: '#ccc', // Gray out when disabled
  },
  confirmText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  errorText: { color: 'red', fontSize: 16, marginBottom: 15, textAlign: 'center' },
  retryButton: { backgroundColor: '#89CFF0', padding: 10, borderRadius: 5 },
  retryText: { color: '#fff', fontWeight: 'bold' }
});