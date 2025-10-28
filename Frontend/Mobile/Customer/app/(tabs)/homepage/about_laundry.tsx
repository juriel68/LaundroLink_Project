import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router"; // <-- Added useRouter
import { useEffect, useState, useCallback } from "react";
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
import { API_URL } from "@/lib/api";

// --- Type Definitions for API Data ---
interface Service {
  name: string;
  price: number | string; 
  minLoad: number;
  maxLoad: number;
}

interface AddOn {
  name: string;
  price: number | string;
}

interface ShopDetails {
  id: string;
  name: string;
  distance: string;
  rating: string;
  image: string;
  description: string;
  address: string;
  contact: string;
  hours: string;
  availability: string;
}

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
  
  // FIX: Safely parse the price, handling string/number types from the backend
  const numericPrice = parseFloat(String(service.price)); 
  
  // Check if the conversion resulted in a valid number
  const price = !isNaN(numericPrice) 
      ? numericPrice.toFixed(2) 
      : 'N/A';
  
  return `${service.name} - ₱${price} ${loadText}`;
}


// --- Main Component ---
export default function AboutLaundry() {
  const router = useRouter(); // <-- Initialize router for navigation
  const params = useLocalSearchParams();
  const shopId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const initialName = Array.isArray(params.name) ? params.name[0] : (params.name as string);
  const initialDistance = Array.isArray(params.distance) ? params.distance[0] : (params.distance as string);
  const initialRating = Array.isArray(params.rating) ? params.rating[0] : (params.rating as string);
  const initialImage = Array.isArray(params.image) ? params.image[0] : (params.image as string);

  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'services' | 'addOns' | null>(null); 

  const toggleSection = useCallback((section: 'services' | 'addOns') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const fetchShopData = useCallback(async () => {
    if (!shopId) {
      setError("Shop ID is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/shops/${shopId}/full-details`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setShop({
            id: data.shop.id,
            name: data.shop.name,
            distance: initialDistance || "N/A",
            rating: data.shop.rating,
            image: data.shop.image,
            description: data.shop.description,
            address: data.shop.address,
            contact: data.shop.contact,
            hours: data.shop.hours,
            availability: data.shop.availability,
        });
        setServices(data.services);
        setAddOns(data.addOns);
      } else {
        setError(data.error || "Failed to fetch shop details from API.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not connect to the server or an unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [shopId, initialDistance]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // Function to handle navigation and parameter passing
  const handleConfirm = () => {
    // Use the fetched shop data, falling back to initial params if needed
    const shopToPass = shop || currentShop;

    if (!shopToPass || services.length === 0) {
        Alert.alert("Loading", "Please wait for shop details to load.");
        return;
    }
    
    // Pass complex data (services and addOns arrays) as JSON strings
    router.push({
        pathname: "/(tabs)/homepage/avail_services",
        params: {
            shopId: shopToPass.id,
            shopName: shopToPass.name,
            shopImage: shopToPass.image || initialImage,
            availableServices: JSON.stringify(services),
            availableAddOns: JSON.stringify(addOns),
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

  const currentShop = shop || { 
    name: initialName, 
    distance: initialDistance, 
    rating: initialRating, 
    image: initialImage,
    description: "No description available.",
    address: "N/A",
    contact: "N/A",
    hours: "N/A",
    availability: "Unavailable",
    id: shopId, // Ensure ID is present for fallback
  };
  const imageUrl = currentShop.image || initialImage;

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
                source={{ uri: imageUrl }} 
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
          <Text style={styles.info}>{currentShop.distance} • ⭐ {currentShop.rating}</Text>

          {/* Availability */}
          <Text style={[
            styles.availability, 
            currentShop.availability === "Available" ? styles.available : styles.unavailable
          ]}>
            {currentShop.availability}
          </Text>

          {/* --- Services Button and Content (First Row) --- */}
          {services.length > 0 ? (
            <View style={styles.sectionWrapper}>
              <TouchableOpacity 
                style={styles.toggleRowButton}
                onPress={() => toggleSection('services')}
              >
                <Text style={styles.rowTitle}>
                  Services ({services.length})
                </Text>
                <Ionicons 
                  name={expandedSection === 'services' ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#0D47A1" 
                />
              </TouchableOpacity>
              
              {expandedSection === 'services' && (
                <View style={styles.contentBox}>
                  {services.map((svc: Service, i: number) => (
                    <Text key={i} style={styles.descriptionListItem}>
                      • {formatServiceItem(svc)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
             <Text style={styles.noDataText}>No main services available.</Text>
          )}

          {/* --- Add-Ons Button and Content (Second Row) --- */}
          {addOns.length > 0 ? (
            <View style={styles.sectionWrapper}>
              <TouchableOpacity 
                style={styles.toggleRowButton}
                onPress={() => toggleSection('addOns')}
              >
                <Text style={styles.rowTitle}>
                  Add-Ons ({addOns.length})
                </Text>
                <Ionicons 
                  name={expandedSection === 'addOns' ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#0D47A1" 
                />
              </TouchableOpacity>
              
              {expandedSection === 'addOns' && (
                <View style={styles.contentBox}>
                  {addOns.map((add: AddOn, i: number) => {
                      // FIX: Safely parse and render add-on price
                      const numericAddOnPrice = parseFloat(String(add.price));
                      const addOnPrice = !isNaN(numericAddOnPrice) ? numericAddOnPrice.toFixed(2) : 'N/A';

                      return (
                        <Text key={i} style={styles.descriptionListItem}>
                          • {add.name} - ₱{addOnPrice}
                        </Text>
                      );
                  })}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>No add-ons available.</Text>
          )}

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
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
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
  image: { width: 200, height: 200, borderRadius: 12, marginBottom: 15 },
  noImage: { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  info: { fontSize: 16, color: "#555", marginTop: 5 },
  availability: { fontSize: 16, marginTop: 8, fontWeight: "600" },
  available: { color: "green" },
  unavailable: { color: "red" },
  
  // Styles for the separate toggle rows
  sectionWrapper: {
    width: '100%',
    marginBottom: 10,
    marginTop: 10,
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
  contentHeader: { // Style definition kept even though it is not used in the render
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 5, alignSelf: "flex-start" },
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
    paddingBottom: 20, 
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
  confirmText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  errorText: { color: 'red', fontSize: 16, marginBottom: 15, textAlign: 'center' },
  retryButton: { backgroundColor: '#89CFF0', padding: 10, borderRadius: 5 },
  retryText: { color: '#fff', fontWeight: 'bold' }
});