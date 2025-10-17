import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { API_URL } from "@/lib/api"; // ✅ Using your existing API configuration

// ✅ Generate a random Order ID like #LAU123456 (for display only - real ID comes from backend)
function generateOrderId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `#LAU${randomNum}`;
}

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { 
    services, 
    fabrics, 
    addons, 
    instructions, 
    deliveryOption
  } = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(false);

  // Parse arrays safely (if passed as JSON strings)
  const parsedServices = services ? JSON.parse(services as string) : [];
  const parsedFabrics = fabrics ? JSON.parse(fabrics as string) : [];
  const parsedAddons = addons ? JSON.parse(addons as string) : [];
  
  // Instructions is passed as a plain string
  const finalInstructions = instructions ? (instructions as string) : "None";

  // Generate orderId once (for display - real ID will come from backend)
  const [displayOrderId] = React.useState(generateOrderId());

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ✅ MOCK DATA - Using the sample from your image
  const mockOrderData = {
    // Required fields for backend
    CustID: "C8", // Mock customer ID
    ShopID: "SH01", // Mock shop ID
    SvcID: "SV01", // Mock service ID
    deliveryId: "DV03", // Mock delivery ID for "Pickup & Delivery"
    weight: 5.0, // Mock weight in kg
    
    // From the actual screen data or fallback to mock data
    instructions: finalInstructions !== "None" ? finalInstructions : "Midgylgid",
    fabrics: "FT01",
    addons: "AO01",
    
    // Optional field
    StaffID: null
  };

  // Different notes based on delivery option
  const deliveryNotes: Record<string, string> = {
    "Drop-off at Shop":
      "✅ You will bring your laundry directly to the shop. No pickup or delivery fees.",
    "Pickup Only":
      "🚚 A rider will be booked by the shop to pick up your laundry. You'll return to the shop to collect it.",
    "Pickup & Delivery":
      "🚴 A rider will be booked by the shop to pick up your laundry and deliver it back to your doorstep.\n\n💵 Delivery fee will be confirmed and sent to you.",
  };

  // ✅ FIXED: Ensure displayDelivery is always a string
  const displayServices = parsedServices.length > 0 ? parsedServices : ["Wash, Dry, and Fold"];
  const displayFabrics = parsedFabrics.length > 0 ? parsedFabrics : ["Regular Clothes"];
  const displayAddons = parsedAddons.length > 0 ? parsedAddons : ["Satin Remover/Satin treatment"];
  const displayInstructions = finalInstructions !== "None" ? finalInstructions : "Midgylgid";
  
  // ✅ FIX: Ensure displayDelivery is always a string, not an array
  const displayDelivery = typeof deliveryOption === 'string' ? deliveryOption : "Pickup & Delivery";
  const displayWeight = mockOrderData.weight;

  // ✅ FIXED: Get delivery note safely
  const getDeliveryNote = (delivery: string): string => {
    return deliveryNotes[delivery] || "";
  };

  // ✅ MODIFIED FUNCTION: Submit mock order to backend
  const confirmOrder = async () => {
    setIsLoading(true);

    try {
      console.log("Submitting order to:", `${API_URL}/orders`);
      console.log("Mock order data:", mockOrderData);

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockOrderData),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          "Order Confirmed! 🎉",
          `Your order has been successfully created with ID: ${result.orderId}`,
          [
            {
              text: "OK",
              onPress: () => {
                // ✅ FIXED: Navigate directly to homepage without waiting for user to click "OK"
                router.replace("/(tabs)/homepage/homepage");
              }
            }
          ]
        );
        
        // ✅ ADDED: Auto-navigate after 2 seconds even if user doesn't click OK
        setTimeout(() => {
          router.replace("/(tabs)/homepage/homepage");
        }, 2000);
        
      } else {
        Alert.alert("Order Failed", result.message || "Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error("Order submission error:", error);
      Alert.alert(
        "Network Error", 
        "Failed to connect to server. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              <Ionicons
                name="arrow-back"
                size={24}
                color="#000"
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>Order Confirmation</Text>
          ),
        }}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Order Info */}
        <View style={[styles.card, styles.highlightCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.orderId}>Order ID: {displayOrderId}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <Text style={styles.note}>
            ⓘ This is a preview ID. Your actual order ID will be assigned after confirmation.
          </Text>
        </View>

        {/* Selected Services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧺 Selected Services</Text>
          {displayServices.map((s: string, i: number) => (
            <Text key={i} style={styles.listItem}>
              • {s}
            </Text>
          ))}
        </View>

        {/* Laundry Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧾 Laundry Details</Text>

          {/* Fabrics */}
          <Text style={styles.subTitle}>Fabric Type(s)</Text>
          {displayFabrics.map((f: string, i: number) => (
            <Text key={i} style={styles.listItem}>
              • {f}
            </Text>
          ))}

          {/* Add-ons */}
          <Text style={styles.subTitle}>Add-ons</Text>
          {displayAddons.map((a: string, i: number) => (
            <Text key={i} style={styles.listItem}>
              • {a}
            </Text>
          ))}

          {/* Instructions */}
          <Text style={styles.subTitle}>Special Instructions</Text>
          <Text style={styles.listItem}>
            • {displayInstructions}
          </Text>

          {/* Weight */}
          <Text style={styles.subTitle}>Weight</Text>
          <Text style={styles.listItem}>
            • {displayWeight} kg
          </Text>
        </View>

        {/* Delivery Option */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚛 Delivery Option</Text>
          <Text style={styles.listItem}>
            • {displayDelivery}
          </Text>
          <Text style={styles.note}>
            {/* ✅ FIXED: Use the helper function to get delivery note */}
            {getDeliveryNote(displayDelivery)}
          </Text>
        </View>

        {/* Mock Data Info */}
        <View style={[styles.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>ℹ️ Using Mock Data</Text>
          <Text style={styles.infoText}>
            This order is using sample data for demonstration. The order will be created with mock customer, shop, and service information.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={confirmOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLoading ? "Creating Order..." : "Confirm Order"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: {
    color: "#2d2d2dff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightCard: {
    borderWidth: 1.5,
    borderColor: "#004aad",
    backgroundColor: "#eef7ff",
  },
  infoCard: {
    borderWidth: 1.5,
    borderColor: "#00a8ff",
    backgroundColor: "#e1f5fe",
  },
  orderId: { fontSize: 16, fontWeight: "600", color: "#004aad" },
  date: { fontSize: 14, color: "#666" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#000",
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 6,
    color: "#004aad",
  },
  listItem: { fontSize: 14, marginBottom: 4, color: "#333" },
  note: { fontSize: 13, color: "#444", marginTop: 6, lineHeight: 18 },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00a8ff",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    backgroundColor: "#004aad",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#7a9cc6",
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
});