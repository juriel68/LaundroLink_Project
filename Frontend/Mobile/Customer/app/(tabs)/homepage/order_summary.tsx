// order_summary.tsx 

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useMemo, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert, // Added Alert
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// CRITICAL IMPORTS
import { UserDetails } from "@/lib/auth"; 
import { CreateOrderPayload, createNewOrder } from "@/lib/orders"; 
import { Service, AddOn, FabricType } from "@/lib/shops";


// --- Helper Functions ---
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

const getFeeDisplay = (deliveryOptionName: string) => {
    if (deliveryOptionName && deliveryOptionName.toLowerCase().includes("drop-off")) {
        return "₱ 0.00 (Free)";
    }
    return "Fee to be confirmed";
};

const getFabricNames = (selectedIds: string[], availableTypes: FabricType[]) => {
    return selectedIds.map(id => {
        const type = availableTypes.find(ft => ft.id === id);
        return type ? type.name : `ID: ${id}`;
    });
};


export default function OrderSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);

  // --- DATA PARSING ---
  const { shopId, shopName, deliveryId, deliveryOptionName, SvcID } = params;
  const fabrics: string[] = safeParseParams<string>(params.fabrics);
  const addons: string[] = safeParseParams<string>(params.addons);
  const instructions = params.instructions as string || ''; 

  const availableServices: Service[] = safeParseParams<Service>(params.availableServices);
  const availableAddOns: AddOn[] = safeParseParams<AddOn>(params.availableAddOns);
  const availableFabricTypes: FabricType[] = safeParseParams<FabricType>(params.availableFabricTypes);
  
  const selectedServiceDetail = useMemo(() => availableServices.find(svc => svc.id === SvcID), [availableServices, SvcID]);
  
  // --- FETCH CUSTOMER ID HOOK ---
  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user: UserDetails = JSON.parse(userJson);
          setCustomerId(user.UserID); 
        }
      };
      fetchUser();
    }, [])
  );

  const initialWeight = 0;


  const summary = useMemo(() => {
    // 🔑 2. Base Price is the fixed Service Price (not multiplied by estimated weight)
    let basePrice = selectedServiceDetail ? parseFloat(String(selectedServiceDetail.price)) : 0; 
    let addonTotal = 0;

    addonTotal = availableAddOns
      .filter(addon => addons.includes(addon.id))
      .reduce((sum, addon) => sum + parseFloat(String(addon.price)), 0);

    const finalDeliveryFee = 0.00; 
    const subtotal = basePrice + addonTotal;
    const grandTotal = subtotal + finalDeliveryFee;

    return { basePrice, addonTotal, subtotal, finalDeliveryFee, grandTotal };
  }, [SvcID, addons, availableAddOns, selectedServiceDetail]);


  // --- CORE API SUBMISSION FUNCTION ---
  const submitOrderToBackend = async () => {
    setIsLoading(true); 

    try {
        const payload: CreateOrderPayload = {
            CustID: customerId as string,
            ShopID: shopId as string,
            SvcID: SvcID as string,
            deliveryId: deliveryId as string,
            weight: initialWeight, // Send estimated weight for BE booking purposes
            instructions: instructions,
            fabrics: fabrics,
            addons: addons
        };

        const response = await createNewOrder(payload);

        if (response.success && response.orderId) {
            setFinalOrderId(response.orderId);
            setSubmitSuccess(true);
            setIsLoading(false); // Clear loading on success
            
            // Success Pop-up: Show confirmation and navigation options
            Alert.alert(
                "✅ Order Confirmed!",
                `Your Order ID is ${response.orderId}.\nIt is now pending shop confirmation.`,
                [
                    { 
                        text: "View Orders", 
                        onPress: () => router.replace('/(tabs)/homepage/homepage') 
                    },
                    { 
                        text: "Back to Home", 
                        onPress: () => router.dismissAll(),
                        style: 'cancel'
                    },
                ]
            );

        } else {
            Alert.alert("Submission Failed", response.message || "An unknown error occurred on the server.");
            setIsLoading(false);
        }
    } catch (error: any) {
        console.error("API Submission Error:", error);
        Alert.alert("Network Error", error.message || "Could not connect to the server.");
        setIsLoading(false);
    }
  };


  // --- CONFIRMATION WRAPPER (Triggers the Pop-up) ---
  const handleFinalSubmission = () => {
    if (submitSuccess) {
        router.dismissAll();
        return;
    }
    if (isLoading || !customerId) return;

    // Initial Validation Check
    if (!customerId) {
      Alert.alert("Error", "User not logged in. Please log in to submit the order.");
      return;
    }
    if (!shopId || !deliveryId || !SvcID || fabrics.length === 0) {
      Alert.alert("Error", "Critical order details are missing. Please go back.");
      return;
    }

    const confirmationMessage = `You are about to place your order with ${shopName}.\n\nEstimated Total: ₱${summary.grandTotal.toFixed(2)}\n\nDo you wish to confirm?`;

    // Show confirmation prompt before submitting
    Alert.alert(
        "Confirm Order Submission",
        confirmationMessage,
        [
            // Cancel Button
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => console.log('Order submission cancelled.')
            },
            // Confirm Button (This triggers the API call)
            {
                text: "Confirm",
                style: "default",
                onPress: submitOrderToBackend 
            }
        ]
    );
  };

  
  const formattedDate = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  
  const selectedServiceName = selectedServiceDetail ? selectedServiceDetail.name : 'No service selected';
  const selectedAddonNames = availableAddOns.filter(addon => addons.includes(addon.id)).map(addon => addon.name);
  const selectedFabricNames = getFabricNames(fabrics, availableFabricTypes); 
  
  const isButtonDisabled = isLoading || !customerId;


  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: submitSuccess ? "Order Confirmed" : "Order Summary",
          headerStyle: { backgroundColor: "#89CFF0" },
          headerShadowVisible: false,
          headerTintColor: "#2d2d2dff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} disabled={submitSuccess || isLoading}>
              <Ionicons name="arrow-back" size={24} color={submitSuccess || isLoading ? "#999" : "#000000ff"} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>{submitSuccess ? "Order Confirmed" : "Order Summary"}</Text>
          ),
        }}
      />

      {/* Scrollable content */}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
        
        {/* Shop and Order Info */}
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.shopName}>{shopName || 'Shop Name'}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.orderId}>{finalOrderId}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Selected Services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧺 Selected Service</Text>
          <View style={styles.listGroup}>
            <Text style={[styles.listItem, { fontWeight: 'bold' }]}>• {selectedServiceName}
            </Text>
          </View>
        </View>

        {/* Laundry Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧾 Laundry Details</Text>

          {/* Fabrics */}
          <Text style={styles.subTitle}>Fabric Type(s)</Text>
          <View style={styles.listGroup}>
            {selectedFabricNames.length > 0 ? (
              selectedFabricNames.map((fabricName: string, index: number) => ( 
                <Text key={index} style={styles.listItem}>• {fabricName}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>• None</Text>
            )}
          </View>

          {/* Add-ons */}
          <Text style={styles.subTitle}>Add-ons</Text>
          <View style={styles.listGroup}>
            {selectedAddonNames.length > 0 ? (
              selectedAddonNames.map((addon: string, index: number) => (
                <Text key={index} style={styles.listItem}>• {addon}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyText}>• None</Text>
            )}
          </View>

          {/* Special Instructions */}
          <Text style={styles.subTitle}>Special Instructions</Text>
          <View style={styles.listGroup}>
            {instructions ? (
              <Text style={styles.listItem}>• {instructions}</Text>
            ) : (
              <Text style={styles.emptyText}>• None</Text>
            )}
          </View>
        </View>

        {/* Delivery Option */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚛 Delivery Option</Text>
          <View style={styles.listGroup}>
            <Text style={[styles.listItem, styles.deliveryOption]}>• {deliveryOptionName || "Not selected"}</Text>
            <Text style={styles.subTitle}>Delivery Fee</Text>
            <Text style={[styles.listItem, styles.feeText]}>{getFeeDisplay(deliveryOptionName as string)}</Text>
          </View>
        </View>
        
        {/* Cost Summary */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>💰 Estimated Pre-Delivery Total</Text>
            <View style={styles.listGroup}>
                <View style={styles.rowBetween}>
                    {/* 🔑 MODIFIED DISPLAY: Base Service Price */}
                    <Text style={styles.summaryItem}>Base Service Fee</Text>
                    <Text style={styles.summaryValue}>₱ {summary.basePrice.toFixed(2)}</Text>
                </View>
                <View style={styles.rowBetween}>
                    <Text style={styles.summaryItem}>Selected Add-Ons</Text>
                    <Text style={styles.summaryValue}>₱ {summary.addonTotal.toFixed(2)}</Text> 
                </View>
                
                {/* Dynamic Delivery Fee Cost Line (0.00 in calculation, text for display) */}
                <View style={styles.rowBetween}>
                    <Text style={styles.summaryItem}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>₱ {summary.finalDeliveryFee.toFixed(2)}</Text>
                </View>

                <View style={[styles.rowBetween, styles.totalRow]}>
                    <Text style={styles.totalText}>ESTIMATED TOTAL</Text>
                    <Text style={styles.totalValue}>₱ {summary.grandTotal.toFixed(2)}</Text>
                </View>
            </View>
        </View>

      </ScrollView>

      {/* Order Button (Submission Wrapper) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
                styles.paymentButton,
                isButtonDisabled && styles.disabledButton,
                submitSuccess && styles.successButton 
            ]}
          activeOpacity={0.9}
          onPress={handleFinalSubmission} // Calls the confirmation wrapper
          disabled={isButtonDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentText}>
              {submitSuccess 
                  ? `Order Confirmed` 
                  : `Place Final Order (₱${summary.grandTotal.toFixed(2)})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f9fc" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 30 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightCard: {
    borderColor: "#004aad",
    borderWidth: 1.5,
    backgroundColor: "#eaf2ff",
  },
  orderId: { fontSize: 18, fontWeight: "700", color: "#004aad" },
  shopName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 5 },
  date: { fontSize: 14, color: "#666", fontWeight: "500" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    color: "#004aad",
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: "#333",
  },
  listGroup: { marginLeft: 10 },
  listItem: {
    fontSize: 14,
    marginBottom: 6,
    color: "#444",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 6,
    fontStyle: "italic",
  },
  deliveryOption: { fontWeight: "600", color: "#004aad" },

  headerTitle: {
    color: "#000000ff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 20,
  },
  // Cost Summary Styles
  summaryItem: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, color: '#555', fontWeight: '500' },
  totalRow: { marginTop: 10, paddingVertical: 8, borderTopWidth: 1, borderColor: '#ddd' },
  totalText: { fontSize: 16, fontWeight: '700', color: '#004aad' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#D32F2F' },
  feeText: { fontWeight: '600', color: '#D32F2F' },

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
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paymentText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});