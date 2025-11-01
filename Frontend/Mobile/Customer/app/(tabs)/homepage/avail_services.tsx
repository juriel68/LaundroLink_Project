// avail_services.tsx (FINALIZED with robust data chain re-passing)
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router"; 
import React, { useState, useMemo } from "react"; 
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert, 
} from "react-native";

// 🔑 Import all necessary types
import { Service, AddOn, DeliveryOption, FabricType } from "@/lib/shops"; 

// --- Helper Function to safely parse JSON arrays ---
// (This is essential for robust parameter reception)
function safeParseParams<T>(param: string | string[] | undefined): T[] {
    if (typeof param === 'string') {
        try {
            return JSON.parse(param) as T[];
        } catch (e) {
            console.error("Failed to parse navigation param:", e);
            return [];
        }
    }
    return [];
}


export default function AvailableServices() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  // State holds the single selected Service ID, or null.
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null); 
  
  // 1. Process passed shop data
  const shopId = params.shopId as string;
  const shopName = params.shopName as string || "Selected Shop";
  const shopImage = params.shopImage as string || "";

  // 2. 🔑 Safely parse all JSON arrays passed from about_laundry.tsx
  const availableServices: Service[] = useMemo(() => {
    return safeParseParams<Service>(params.availableServices);
  }, [params.availableServices]);
  
  const availableAddOns: AddOn[] = useMemo(() => {
    return safeParseParams<AddOn>(params.availableAddOns);
  }, [params.availableAddOns]);
  
  const availableDeliveryOptions: DeliveryOption[] = useMemo(() => {
    return safeParseParams<DeliveryOption>(params.availableDeliveryOptions);
  }, [params.availableDeliveryOptions]);
  
  const availableFabricTypes: FabricType[] = useMemo(() => {
    return safeParseParams<FabricType>(params.availableFabricTypes);
  }, [params.availableFabricTypes]);


  // 🛑 CORE LOGIC: Enforce Single Selection (Radio button behavior)
  const toggleService = (serviceId: string) => { 
    setSelectedServiceId((prevId) => {
      // If the currently selected ID is clicked again, deselect (set to null).
      if (prevId === serviceId) {
        return null;
      } else {
        // Otherwise, select the new ID.
        return serviceId;
      }
    });
  };
  
  // 3. 🔑 CRITICAL FIX: Function to prepare and pass data for the next screen
  const proceedToDetails = () => {
      // Validation checks if a single ID is selected (not null)
      if (!selectedServiceId) {
          Alert.alert("Selection Required", "Please select exactly one primary service to proceed.");
          return;
      }
      
      // Pass all necessary shop and collected data to laundry_details.tsx
      // CRITICAL: Re-stringify and pass all full lookup arrays (Services, Addons, etc.)
      router.push({
          pathname: "/(tabs)/homepage/laundry_details",
          params: { 
              // Selected Data
              shopId: shopId,
              shopName: shopName,
              shopImage: shopImage,
              SvcID: selectedServiceId, 
              
              // Re-passed Look-up Lists (ENSURING data integrity)
              availableServices: JSON.stringify(availableServices), // ⬅️ THIS IS THE FIX
              availableAddOns: JSON.stringify(availableAddOns),
              availableDeliveryOptions: JSON.stringify(availableDeliveryOptions),
              availableFabricTypes: JSON.stringify(availableFabricTypes),
          },
      });
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#89CFF0",
          },
          headerShadowVisible: false,
          headerTintColor: "#2d2d2dff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons
                name="arrow-back"
                size={24}
                color="#000"
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>Available Services</Text>
          ),
        }}
      />

      {/* Content */}
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.shopSection}>
            <Image
                source={shopImage ? { uri: shopImage } : require("@/assets/images/washndry.png")}
                style={styles.shopImage}
            />
            <Text style={styles.shopName}>{shopName}</Text> 
          </View>

          <Text style={styles.instruction}>Please select **one** primary service for your order:
          </Text>

          <View style={styles.servicesList}>
            {availableServices.length === 0 && (
                <Text style={styles.noServiceText}>No services available for this shop.</Text>
            )}
            {availableServices.map((service) => (
              <TouchableOpacity
                key={service.id} // Use ID as key
                style={[
                  styles.serviceOption,
                  selectedServiceId === service.id &&
                    styles.serviceOptionSelected,
                ]}
                onPress={() => toggleService(service.id)} // Toggle by ID
                activeOpacity={0.7}
              >
                <Ionicons
                  // Use radio button icon logic
                  name={
                    selectedServiceId === service.id
                      ? "radio-button-on" 
                      : "radio-button-off" 
                  }
                  size={22}
                  color={selectedServiceId === service.id ? "#004aad" : "#444"}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={[
                    styles.serviceText,
                    selectedServiceId === service.id && styles.serviceTextSelected,
                  ]}
                >{service.name} (₱{parseFloat(String(service.price)).toFixed(2)})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedServiceId && styles.nextButtonDisabled, // Check for null
          ]}
          disabled={!selectedServiceId}
          onPress={proceedToDetails} 
        >
          <Text style={styles.nextText}>
            {!selectedServiceId ? "Select a service" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  container: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 120,
  },
  wrapper: {
    flex: 1,
  },
  headerTitle: {
    color: "#2d2d2dff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 20,
  },
  shopSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  shopImage: {
    width: 130,
    height: 130,
    resizeMode: "cover", 
    borderRadius: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginTop: 10,
  },
  instruction: {
    textAlign: "center",
    marginVertical: 15,
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
  },
  noServiceText: {
    textAlign: "center",
    color: '#888',
    fontStyle: 'italic',
    marginTop: 20,
  },
  servicesList: {
    marginTop: 10,
    width: "100%",
  },
  serviceOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceOptionSelected: {
    borderColor: "#004aad",
    backgroundColor: "#E6F0FF",
  },
  serviceText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  serviceTextSelected: {
    color: "#004aad",
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "#f6f6f6",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  nextButton: {
    backgroundColor: "#004aad",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: "#aaa",
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});