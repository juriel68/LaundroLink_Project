// Customer/app/(tabs)/homepage/order_summary.tsx 

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
  Alert,
  ActivityIndicator,
  // Modal removed
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🛠️ USING RELATIVE PATHS
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

const getFeeDisplay = (deliveryOptionName: string, fee: number) => {
    if (deliveryOptionName && deliveryOptionName.toLowerCase().includes("drop-off")) {
        return "₱ 0.00 (Free)";
    }
    return `₱ ${fee.toFixed(2)}`;
};

const getFabricNames = (selectedIds: string[], availableTypes: FabricType[]) => {
    return selectedIds.map(idString => {
        const id = parseInt(idString, 10); // Parse to number
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
  const { 
    shopId, shopName, deliveryId, deliveryOptionName, SvcID, deliveryFee,
    isOwnService,
  } = params;
  
  const fabrics: string[] = safeParseParams<string>(params.fabrics);
  const addons: string[] = safeParseParams<string>(params.addons);
  const instructions = params.instructions as string || ''; 
  
  const finalDeliveryFee = parseFloat(deliveryFee as string || '0');
  const shopIDNum = parseInt(shopId as string, 10);

  const availableServices: Service[] = safeParseParams<Service>(params.availableServices);
  const availableAddOns: AddOn[] = safeParseParams<AddOn>(params.availableAddOns);
  const availableFabricTypes: FabricType[] = safeParseParams<FabricType>(params.availableFabricTypes);
  
  const selectedServiceIdNum = parseInt(SvcID as string, 10);
  const selectedServiceDetail = useMemo(() => availableServices.find(svc => svc.id === selectedServiceIdNum), [availableServices, selectedServiceIdNum]);
  
  // --- DERIVED FLOW LOGIC ---
  
  // Flow where NO immediate payment is required (Drop-off OR For Delivery)
  const isPostWeighPaymentFlow = useMemo(() => {
    const name = (deliveryOptionName as string || '').toLowerCase();
    return name.includes("drop-off") || name.includes("for delivery");
  }, [deliveryOptionName]);
  
  // Flow where immediate DELIVERY FEE payment is required (Pick-up Only OR Pick-up & Delivery)
  const isDeliveryFeeUpfrontFlow = useMemo(() => {
    const name = (deliveryOptionName as string || '').toLowerCase();
    return name.includes("pick-up"); 
  }, [deliveryOptionName]);
  
  const isPickupFlow = useMemo(() => {
    const name = (deliveryOptionName as string || '').toLowerCase();
    return name.includes("pick-up");
  }, [deliveryOptionName]);
  
  const initialWeight = 0; 

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

  const summary = useMemo(() => {
    let basePrice = selectedServiceDetail ? parseFloat(String(selectedServiceDetail.price)) * parseFloat(String(selectedServiceDetail.minWeight)) : 0; 
    let addonTotal = 0;

    addonTotal = availableAddOns
      .filter(addon => addons.map(String).includes(addon.id.toString()))
      .reduce((sum, addon) => sum + parseFloat(String(addon.price)), 0);

    const subtotal = basePrice + addonTotal;
    const deliveryFeeForTotal = isDeliveryFeeUpfrontFlow ? finalDeliveryFee : 0;
    const grandTotal = subtotal + deliveryFeeForTotal;

    return { basePrice, addonTotal, subtotal, finalDeliveryFee: finalDeliveryFee, grandTotal }; 
  }, [SvcID, addons, availableAddOns, selectedServiceDetail, finalDeliveryFee, isDeliveryFeeUpfrontFlow]);


  // --- CORE API SUBMISSION FUNCTION ---
  const submitOrderToBackend = async () => {
    setIsLoading(true); 

    try {
        const payload: CreateOrderPayload = {
            CustID: customerId as string,
            ShopID: shopIDNum,
            SvcID: selectedServiceIdNum,
            deliveryId: parseInt(deliveryId as string, 10),
            weight: initialWeight, 
            instructions: instructions,
            fabrics: fabrics.map(id => parseInt(id, 10)),
            addons: addons.map(id => parseInt(id, 10)),
            finalDeliveryFee: finalDeliveryFee,
            deliveryOptionName: deliveryOptionName as string,
        };

        const response = await createNewOrder(payload);

        if (response.success && response.orderId) {
            setFinalOrderId(response.orderId);
            // setSubmitSuccess(true); // Removed to prevent UI changes before redirect
            setIsLoading(false); 
            
            // --- CONDITIONAL REDIRECTION ---
            if (isDeliveryFeeUpfrontFlow) {
                // 🔑 MODIFIED: Navigate IMMEDIATELY. No Modal, No Delay.
                router.replace({
                    pathname: '/(tabs)/payment/pay', 
                    params: { 
                        orderId: response.orderId, 
                        deliveryFee: finalDeliveryFee.toFixed(2),
                        isFirstPayment: 'true',
                    } 
                });

            } else if (isPostWeighPaymentFlow) {
                // For Drop-off/For Delivery, we still show success state + alert
                setSubmitSuccess(true);
                
                const name = deliveryOptionName ? String(deliveryOptionName) : '';
                
                Alert.alert(
                    "✅ Order Confirmed!",
                    `Your Order ID is ${response.orderId}. Your order is pending ${name.toLowerCase().includes("drop-off") ? 'drop-off' : 'collection'}. Please wait for staff to weigh your laundry. Payment will be processed after weighing.`,
                    [
                        { 
                            text: "Track Your Order", 
                            onPress: () => router.replace({
                                pathname: '/(tabs)/activity/track_order',
                                params: { orderId: response.orderId }
                            })
                        },
                    ]
                );
            }

        } else {
            Alert.alert("Submission Failed", response.message || "An unknown error occurred on the server.");
            setIsLoading(false);
        }
    } catch (error) {
            console.error("API Submission Error:", error);
            const errorMessage = (error instanceof Error) ? error.message : "Could not connect to the server.";
            Alert.alert("Network Error", errorMessage);
            setIsLoading(false);
        }
  };


  // --- CONFIRMATION WRAPPER ---
  const handleFinalSubmission = () => {
    if (submitSuccess) return;
    if (isLoading || !customerId) return;

    if (!customerId) {
      Alert.alert("Error", "User not logged in. Please log in to submit the order.");
      return;
    }
    
    const confirmationMessage = isPostWeighPaymentFlow 
      ? `You are about to place your ${deliveryOptionName} order with ${shopName}.\n\nDo you wish to confirm?`
      : `You are about to place your order with ${shopName}.\n\nTotal Due Now: ₱${summary.grandTotal.toFixed(2)}\n\nDo you wish to confirm?`;

    Alert.alert(
        "Confirm Order Submission",
        confirmationMessage,
        [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", style: "default", onPress: submitOrderToBackend }
        ]
    );
  };

  
  const formattedDate = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const selectedServiceName = selectedServiceDetail ? selectedServiceDetail.name : 'No service selected';
  const selectedAddonNames = availableAddOns.filter(addon => addons.map(String).includes(addon.id.toString())).map(addon => addon.name);
  const selectedFabricNames = getFabricNames(fabrics, availableFabricTypes); 
  const isButtonDisabled = isLoading || !customerId;

  const getInfoMessage = () => {
    if (isPostWeighPaymentFlow) {
      return "⚠️ Payment for the laundry service and delivery fee will be processed in one transaction after staff weighs your items.";
    } else if (isDeliveryFeeUpfrontFlow && summary.finalDeliveryFee > 0) {
      const deliveryType = isOwnService === 'true' ? "Shop Own Service" : "3rd Party App (e.g., Lalamove)";
      const action = isPickupFlow ? (isOwnService === 'true' ? "Staff will weigh the laundry upon pick-up." : "Rider will pick up the laundry for weigh-in at the shop.") : "Rider will pick up the laundry.";
      return `⚠️ **Action Required:** You must pay the delivery fee of ₱${summary.finalDeliveryFee.toFixed(2)} first. ${action} The service fee will be required after weighing.`;
    }
    return "";
  };
  
  const getButtonText = () => {
    if (submitSuccess) return 'Order Confirmed';
    if (isPostWeighPaymentFlow) return `Place Order Now`;
    if (isDeliveryFeeUpfrontFlow && summary.finalDeliveryFee > 0) return `Pay Delivery Fee: ₱${summary.finalDeliveryFee.toFixed(2)}`;
    return `Place Final Order (₱${summary.grandTotal.toFixed(2)})`;
  }

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

      {/* MODAL REMOVED: Direct navigation logic used instead */}

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.shopName}>{shopName || 'Shop Name'}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.orderId}>{finalOrderId || "Draft Order"}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>
        
        {getInfoMessage() ? (
          <View style={[styles.card, { backgroundColor: '#FFFBEA', borderColor: '#FFD700' }]}>
            <Text style={{ fontSize: 13, color: '#8A6D3B' }}>{getInfoMessage()}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧺 Selected Service</Text>
          <View style={styles.listGroup}>
            <Text style={[styles.listItem, { fontWeight: 'bold' }]}>• {selectedServiceName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧾 Laundry Details</Text>
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

          <Text style={styles.subTitle}>Add-ons</Text>
          <View style={styles.listGroup}>
            {selectedAddonNames.length > 0 ? (
              selectedAddonNames.map((addon: string, index: number) => (
                <Text key={index} style={styles.listItem}>• {addon}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>• None</Text>
            )}
          </View>

          <Text style={styles.subTitle}>Special Instructions</Text>
          <View style={styles.listGroup}>
            <Text style={styles.listItem}>{instructions ? `• ${instructions}` : `• None`}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚛 Delivery Option</Text>
          <View style={styles.listGroup}>
            <Text style={[styles.listItem, styles.deliveryOption]}>• {deliveryOptionName || "Not selected"}</Text>
            <Text style={styles.subTitle}>Delivery Fee</Text>
            <Text style={[styles.listItem, styles.feeText]}>{getFeeDisplay(deliveryOptionName as string, finalDeliveryFee)}</Text>
          </View>
        </View>
        
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>💰 Estimated Total</Text>
            <View style={styles.listGroup}>
                <View style={styles.rowBetween}>
                    <Text style={styles.summaryItem}>Base Service Fee</Text>
                    <Text style={styles.summaryValue}>₱ {summary.basePrice.toFixed(2)}</Text>
                </View>
                <View style={styles.rowBetween}>
                    <Text style={styles.summaryItem}>Selected Add-Ons</Text>
                    <Text style={styles.summaryValue}>₱ {summary.addonTotal.toFixed(2)}</Text> 
                </View>
                <View style={styles.rowBetween}>
                    <Text style={styles.summaryItem}>Delivery Fee {isPostWeighPaymentFlow ? "(Paid Later)" : "(Paid Now)"}</Text>
                    <Text style={styles.summaryValue}>₱ {summary.finalDeliveryFee.toFixed(2)}</Text>
                </View>
                
                <View style={[styles.rowBetween, styles.totalRow]}>
                    <Text style={styles.totalText}>ESTIMATED TOTAL DUE NOW</Text>
                    <Text style={styles.totalValue}>₱ {summary.grandTotal.toFixed(2)}</Text>
                </View>
            </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.paymentButton, isButtonDisabled && styles.disabledButton, submitSuccess && styles.successButton]}
          activeOpacity={0.9}
          onPress={handleFinalSubmission} 
          disabled={isButtonDisabled || submitSuccess}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentText}>{getButtonText()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f9fc" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 30 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 16, marginBottom: 18, borderWidth: 1, borderColor: "#eee", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  highlightCard: { borderColor: "#004aad", borderWidth: 1.5, backgroundColor: "#eaf2ff" },
  orderId: { fontSize: 18, fontWeight: "700", color: "#004aad" },
  shopName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 5 },
  date: { fontSize: 14, color: "#666", fontWeight: "500" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10, color: "#004aad" },
  subTitle: { fontSize: 15, fontWeight: "600", marginTop: 12, marginBottom: 6, color: "#333" },
  listGroup: { marginLeft: 10 },
  listItem: { fontSize: 14, marginBottom: 6, color: "#444", lineHeight: 20 },
  emptyText: { fontSize: 14, color: "#999", marginBottom: 6, fontStyle: "italic" },
  deliveryOption: { fontWeight: "600", color: "#004aad" },
  headerTitle: { color: "#000000ff", fontSize: 20, fontWeight: "700", marginLeft: 20 },
  summaryItem: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, color: '#555', fontWeight: '500' },
  totalRow: { marginTop: 10, paddingVertical: 8, borderTopWidth: 1, borderColor: '#ddd' },
  totalText: { fontSize: 16, fontWeight: '700', color: '#004aad' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#D32F2F' },
  feeText: { fontWeight: '600', color: '#D32F2F' },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee" },
  paymentButton: { backgroundColor: "#004aad", paddingVertical: 16, borderRadius: 30, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  successButton: { backgroundColor: '#4CAF50' },
  disabledButton: { backgroundColor: '#ccc' },
  paymentText: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },
});