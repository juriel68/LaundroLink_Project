// Customer/app/(tabs)/homepage/avail_services.tsx
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

import { Service, AddOn, DeliveryOption, FabricType } from "@/lib/shops"; 

// --- Helper Function to safely parse JSON arrays ---
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
  
  // State holds the single selected Service ID (number), or null.
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null); 
  
  const shopId = params.shopId as string;
  const shopName = params.shopName as string || "Selected Shop";
  const shopImage = params.shopImage as string || "";
  const distance = params.distance as string;

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


  const toggleService = (serviceId: number) => { 
    setSelectedServiceId((prevId) => {
      if (prevId === serviceId) {
        return null;
      } else {
        return serviceId;
      }
    });
  };
  
const proceedToDetails = () => {
      if (selectedServiceId === null) {
          Alert.alert("Selection Required", "Please select exactly one primary service to proceed.");
          return;
      }
      
      router.push({
          pathname: "/(tabs)/homepage/laundry_details",
          params: { 
              shopId: shopId,
              shopName: shopName,
              shopImage: shopImage,
              SvcID: selectedServiceId.toString(),
              distance: distance,
              availableServices: JSON.stringify(availableServices),
              availableAddOns: JSON.stringify(availableAddOns),
              availableDeliveryOptions: JSON.stringify(availableDeliveryOptions),
              availableFabricTypes: JSON.stringify(availableFabricTypes),
          },
      } as any);
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

      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.shopSection}>
            <Image
                source={shopImage ? { uri: shopImage.replace('http://', 'https://') } : require("@/assets/images/washndry.png")}
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
                key={service.id} 
                style={[
                  styles.serviceOption,
                  selectedServiceId === service.id &&
                    styles.serviceOptionSelected,
                ]}
                onPress={() => toggleService(service.id)} 
                activeOpacity={0.7}
              >
                <Ionicons
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
                >
                    {/* 🔑 UPDATED DISPLAY: Added "/kg" */}
                    {service.name} (₱{parseFloat(String(service.price)).toFixed(2)}/kg)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (selectedServiceId === null) && styles.nextButtonDisabled, 
          ]}
          disabled={selectedServiceId === null}
          onPress={proceedToDetails} 
        >
          <Text style={styles.nextText}>
            {selectedServiceId === null ? "Select a service" : "Next"}
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