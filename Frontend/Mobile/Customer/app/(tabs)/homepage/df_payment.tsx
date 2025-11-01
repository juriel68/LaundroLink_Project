// df_payment.tsx (UPDATED: Corrected chain data re-passing logic)

import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from "react-native";

// 🔑 Import DeliveryOption directly from shops.ts
import { DeliveryOption } from "@/lib/shops";


// Helper to determine the dynamic fee display based on option name
const getFeeDisplay = (option: DeliveryOption) => {
    // Only Drop-off is confirmed Free based on the business process
    if (option.name.toLowerCase().includes("drop-off")) {
        return "FREE (₱ 0.00)";
    }
    // All other options require later calculation by the shop/rider booking
    return "Fee to be confirmed";
};

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


export default function DeliveryPayment() {
  const router = useRouter();
  
  // 1. RECEIVE ALL NECESSARY PARAMS (Store all lookup arrays as RAW strings)
  const { 
        shopId, shopName, SvcID, 
        fabrics, addons, instructions, // Collected Details from laundry_details (strings)
        
        // 🔑 CRITICAL FIX 1: Store all lookup lists as raw string parameters
        availableServices: availableServicesChain, 
        availableAddOns: availableAddOnsChain, 
        availableFabricTypes: availableFabricTypesChain, 
        availableDeliveryOptions: deliveryOptionsChain, 
    } = useLocalSearchParams(); 

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. PARSE DYNAMIC DELIVERY OPTIONS (For on-screen use)
  const availableDeliveryOptions: DeliveryOption[] = useMemo(() => {
    return safeParseParams<DeliveryOption>(deliveryOptionsChain);
  }, [deliveryOptionsChain]);
  
  useEffect(() => {
    if (shopId) { // Check for core ID
      setLoading(false);
    }
  }, [shopId, availableDeliveryOptions]);

  const selectedDetails = availableDeliveryOptions.find((opt) => opt.id === selectedDeliveryId);
  
  // Assemble debugData (check against the raw chains for true/false status)
  const debugData = useMemo(() => ({
        Shop_ID: shopId,
        Svc_ID: SvcID,
        Dlvry_ID: selectedDeliveryId,
        Fabrics_IDs: fabrics,
        Addons_IDs: addons,
        Instructions: instructions,
        Lists_Status: `Svc:${!!availableServicesChain}, AddOns:${!!availableAddOnsChain}, Fabrics:${!!availableFabricTypesChain}`,
    }), [shopId, SvcID, selectedDeliveryId, fabrics, addons, instructions, availableServicesChain, availableAddOnsChain, availableFabricTypesChain]);


  const handleOrder = () => {
    if (!selectedDetails) {
        Alert.alert("Selection Required", "Please select a delivery option to proceed.");
        return;
    }
    
    // 3. PASS ALL COLLECTED DATA TO THE FINAL CONFIRMATION SCREEN
    router.push({
      pathname: "/homepage/order_summary",
      params: {
        // 🔑 CRITICAL FIX 2: Pass ALL lookup lists using their raw incoming STRING chain data
        availableServices: availableServicesChain, 
        availableAddOns: availableAddOnsChain,
        availableFabricTypes: availableFabricTypesChain, 

        // Collected Payload Data (CRITICAL for order_summary calculation and display)
        shopId: shopId,
        shopName: shopName,
        SvcID: SvcID, 
        fabrics: fabrics,
        addons: addons,
        instructions: instructions,
        
        // New Collected Data 
        deliveryId: selectedDeliveryId, 
        deliveryOptionName: selectedDetails.name, 
      },
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004aad" />
        <Text style={{ marginTop: 10, color: '#555' }}>Loading delivery options...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#89CFF0" },
          headerShadowVisible: false,
          headerTintColor: "#2d2d2dff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>Delivery Option</Text>
          ),
        }}
      />

      {/* Content */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.instruction}>Select how you want to use the service. Delivery fees will be **estimated and added to your invoice by the shop**.
        </Text>

        {availableDeliveryOptions.length > 0 ? (
          availableDeliveryOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.card,
                selectedDeliveryId === option.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedDeliveryId(option.id)}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                {/* Icon Logic based on name/type */}
                {option.name.includes("Drop-off") ? <Ionicons name="storefront" size={36} color="#004aad" /> : 
                 option.name.includes("Delivery") ? <Ionicons name="bicycle" size={36} color="#004aad" /> :
                 option.name.includes("Pick-up") ? <FontAwesome5 name="truck" size={36} color="#004aad" /> :
                 <Ionicons name="options-outline" size={36} color="#004aad" />
                }
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      selectedDeliveryId === option.id && { color: "#004aad" },
                    ]}
                  >{option.name}
                  </Text>
                  <Text style={styles.cardDesc}>{option.description}</Text>
                </View>

                {/* Checkmark if selected */}
                {selectedDeliveryId === option.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#004aad" />
                )}
              </View>
              <Text
                style={[
                  styles.feeText,
                  selectedDeliveryId === option.id && { color: "#004aad" },
                ]}
              >{getFeeDisplay(option)}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
            <Text style={styles.noDataText}>No delivery options available for this shop.</Text>
        )}
      </ScrollView>
        
        {/* 🔑 DEBUG DISPLAY */}
        <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>DEBUG DATA (Handover Payload)</Text>
            <Text style={styles.debugText}>
                {JSON.stringify(debugData, null, 2)}
            </Text>
            <Text style={styles.debugNote}>
                Note: Lists are passed as raw strings (Chain) to prevent corruption.
            </Text>
        </View>

      {/* Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            !selectedDeliveryId && { backgroundColor: "#ccc" },
          ]}
          onPress={handleOrder}
          disabled={!selectedDeliveryId}
        >
          <Text style={styles.paymentText}>
            {selectedDetails
              ? `Confirm ${selectedDetails.name}`
              : "Select an option"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    color: "#2d2d2dff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },
  instruction: {
    textAlign: "center",
    marginVertical: 15,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#004aad",
    borderWidth: 2,
    backgroundColor: "#E3F2FD", 
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#000" },
  cardDesc: { fontSize: 13, color: "#555", marginTop: 2 },
  feeText: { fontSize: 14, fontWeight: "600", color: "#004aad" },
  noDataText: { fontSize: 14, color: '#888', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  paymentButton: {
    backgroundColor: "#004aad",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  paymentText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
// 🔑 NEW DEBUG STYLES
    debugContainer: {
        marginTop: 20,
        marginBottom: 100,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444'
    },
    debugText: {
        fontSize: 12,
        color: '#222',
        fontFamily: 'monospace',
    },
    debugNote: {
        fontSize: 10,
        marginTop: 5,
        color: '#888'
    }
});