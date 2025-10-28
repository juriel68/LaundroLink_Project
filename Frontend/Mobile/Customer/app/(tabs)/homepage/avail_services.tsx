import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router"; // <-- Import useLocalSearchParams
import React, { useState, useMemo } from "react"; // <-- Import useMemo
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert, // <-- Added Alert
} from "react-native";

// Define the expected interfaces for the passed data
interface Service {
  name: string;
  price: number | string; 
  minLoad: number;
  maxLoad: number;
}

export default function AvailableServices() {
  const router = useRouter();
  const params = useLocalSearchParams(); // <-- Get URL parameters
  
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>([]);
  
  // 1. Process passed shop data
  const shopName = params.shopName as string || "Selected Shop";
  const shopImage = params.shopImage as string || "";

  // 2. Process passed available services data
  const services: Service[] = useMemo(() => {
    if (params.availableServices && typeof params.availableServices === 'string') {
      try {
        // Parse the JSON string back into a JavaScript array of Service objects
        return JSON.parse(params.availableServices) as Service[];
      } catch (e) {
        console.error("Failed to parse services:", e);
        return [];
      }
    }
    return [];
  }, [params.availableServices]);


  const toggleService = (serviceName: string) => { // <-- Toggle by name since IDs might not be unique across shops (better for display)
    setSelectedServiceNames((prev) =>
      prev.includes(serviceName) ? prev.filter((name) => name !== serviceName) : [...prev, serviceName]
    );
  };
  
  // Function to prepare data for the next screen (including the Add-Ons)
  const proceedToDetails = () => {
      if (selectedServiceNames.length === 0) {
          Alert.alert("Selection Required", "Please select at least one service to proceed.");
          return;
      }
      
      // Pass all necessary shop and selected service data to the next screen
      router.push({
          pathname: "/(tabs)/homepage/laundry_details",
          params: { 
              shopName: shopName,
              selectedServices: JSON.stringify(selectedServiceNames),
              // Pass Add-Ons list for selection on the next screen
              availableAddOns: params.availableAddOns, 
              shopId: params.shopId,
              shopImage: shopImage,
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
                // Use the dynamically passed shop image, fall back to a local asset or placeholder if needed
              source={shopImage ? { uri: shopImage } : require("@/assets/images/washndry.png")}
              style={styles.shopImage}
            />
            <Text style={styles.shopName}>{shopName}</Text> {/* <-- Use dynamic name */}
          </View>

          <Text style={styles.instruction}>
            Please select the service(s) you need:
          </Text>

          <View style={styles.servicesList}>
            {services.length === 0 && (
                <Text style={styles.noServiceText}>No services available for this shop.</Text>
            )}
            {services.map((service) => (
              <TouchableOpacity
                key={service.name} // <-- Use name as key, or shopId + name for ultimate safety
                style={[
                  styles.serviceOption,
                  selectedServiceNames.includes(service.name) &&
                    styles.serviceOptionSelected,
                ]}
                onPress={() => toggleService(service.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    selectedServiceNames.includes(service.name)
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={22}
                  color={selectedServiceNames.includes(service.name) ? "#004aad" : "#444"}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={[
                    styles.serviceText,
                    selectedServiceNames.includes(service.name) && styles.serviceTextSelected,
                  ]}
                >
                  {service.name}
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
            selectedServiceNames.length === 0 && styles.nextButtonDisabled,
          ]}
          disabled={selectedServiceNames.length === 0}
          onPress={proceedToDetails} // <-- Use the new function
        >
          <Text style={styles.nextText}>
            {selectedServiceNames.length === 0 ? "Select a service" : "Next"}
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
    resizeMode: "cover", // Changed from 'contain' for dynamic images
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