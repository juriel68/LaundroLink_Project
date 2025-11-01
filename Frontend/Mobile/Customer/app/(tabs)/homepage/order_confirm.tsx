// order_confirm.tsx

import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useCallback } from "react";
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

// 🔑 CRITICAL IMPORTS
import { UserDetails } from "@/lib/auth"; 
import { CreateOrderPayload, createNewOrder } from "@/lib/orders"; 


export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);

  // --- PARSE INCOMING PAYLOAD DATA ---
  // 🔑 FIX 1: Removed deliveryFee from destructuring since order_summary stopped passing it.
  const { 
        shopId, shopName, weight, deliveryId, deliveryOptionName, 
        SvcID, fabrics, addons, instructions, grandTotal // GrandTotal is for display
    } = params;

  // Correctly parse stringified arrays/objects
  const parsedFabrics: string[] = fabrics ? JSON.parse(fabrics as string) : [];
  const parsedAddons: string[] = addons ? JSON.parse(addons as string) : [];
  const parsedInstructions: string = instructions as string || '';


  // --- HOOKS ---
  useFocusEffect(
    useCallback(() => {
      // Fetch Customer ID (CustID) from AsyncStorage
      const fetchUser = async () => {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user: UserDetails = JSON.parse(userJson);
          setCustomerId(user.UserID); 
        } else {
          Alert.alert("Authentication Error", "Please log in again.");
          router.replace('/');
        }
      };
      fetchUser();
    }, [])
  );


  // --- FINAL SUBMISSION LOGIC ---
  const handleSubmission = async () => {
    if (isLoading || submitSuccess || !customerId) return;

    // 1. Final Payload Validation
    if (!shopId || !SvcID || !deliveryId || !weight || parsedFabrics.length === 0) {
      Alert.alert("Error", "Missing required order information. Cannot submit.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Assemble the final payload based on the CreateOrderPayload interface
      const payload: CreateOrderPayload = {
        CustID: customerId,
        ShopID: shopId as string,
        SvcID: SvcID as string,
        deliveryId: deliveryId as string,
        weight: parseFloat(weight as string), // The estimated weight
        instructions: parsedInstructions,
        fabrics: parsedFabrics, // Array of FabTypeIDs
        addons: parsedAddons // Array of AddOnIDs
      };

      // 3. Call the API function from lib/orders.ts
      console.log("Submitting Order Payload:", payload);
      const response = await createNewOrder(payload);

      if (response.success && response.orderId) {
        setFinalOrderId(response.orderId);
        setSubmitSuccess(true);
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
  
  // --- DISPLAY COMPONENTS ---
  const displayFabrics = parsedFabrics.join(', ');
  const displayAddons = parsedAddons.join(', ');
  
  const isButtonDisabled = isLoading || submitSuccess || !customerId;

  return (
    // 🔑 Use standard View as container
    <View style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#89CFF0" },
          headerShadowVisible: false,
          headerTintColor: "#2d2d2dff",
          headerTitle: () => (
            <Text style={styles.headerTitle}>{submitSuccess ? "Order Confirmed" : "Final Submission"}</Text>
          ),
          headerLeft: () => (
            // Disable back button after success or during submission
            <TouchableOpacity onPress={() => router.back()} disabled={isButtonDisabled || submitSuccess}>
              <Ionicons name="arrow-back" size={24} color={isButtonDisabled ? "#999" : "#000"} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Submission Status Card */}
        <View style={[styles.card, submitSuccess ? styles.successCard : styles.pendingCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.submissionTitle}>
              {submitSuccess ? 'Order Submitted Successfully!' : 'Review & Submit'}
            </Text>
            {submitSuccess && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
          </View>
          <Text style={styles.submissionDetail}>
            {submitSuccess 
              ? `Your Order ID is ${finalOrderId}. It is now pending shop confirmation.` 
              : `Final check before submitting your order to ${shopName || 'the shop'}.`}
          </Text>
        </View>

        {/* Details Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          
          <Text style={styles.subTitle}>Service & Weight</Text>
          <Text style={styles.listItem}>• Service ID: {SvcID || 'N/A'}</Text>
          <Text style={styles.listItem}>• Estimated Weight: {weight || '1'} kg</Text>

          <Text style={styles.subTitle}>Delivery</Text>
          <Text style={styles.listItem}>• Option: {deliveryOptionName || 'N/A'}</Text>
          <Text style={styles.listItem}>• Fee: ₱ 0.00 (Set by staff later)</Text> 
          
          <Text style={styles.subTitle}>Laundry Details</Text>
          <Text style={styles.listItem}>• Fabrics (IDs): {displayFabrics || 'None'}</Text>
          <Text style={styles.listItem}>• Add-Ons (IDs): {displayAddons || 'None'}</Text>
          <Text style={styles.listItem}>• Instructions: {parsedInstructions || 'None'}</Text>
          <Text style={[styles.listItem, {fontWeight: 'bold', marginTop: 10}]}>• Grand Total: ₱{grandTotal || '0.00'}</Text>


        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.disabledButton, submitSuccess && styles.successButton]}
          onPress={submitSuccess ? () => router.dismissAll() : handleSubmission}
          disabled={isButtonDisabled}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {submitSuccess ? "Back to Home" : `Place Final Order (₱${grandTotal || '0.00'})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  pendingCard: { borderColor: '#BBDEFB', borderWidth: 1 },
  successCard: { borderColor: '#4CAF50', borderWidth: 1, backgroundColor: '#E8F5E9' },
  submissionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  submissionDetail: { fontSize: 14, color: '#555', marginTop: 5 },
  date: { fontSize: 12, color: "#666" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#004aad",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 6,
    color: "#004aad",
  },
  listItem: { fontSize: 14, marginBottom: 4, color: "#333" },
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
  successButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});