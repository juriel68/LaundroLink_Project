// app/(tabs)/payment/pay.tsx

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  FlatList
} from "react-native";
import { confirmPayment, fetchOrderDetails } from "@/lib/orders"; 
import { fetchShopDetails, PaymentMethod } from "@/lib/shops"; // 🔑 Import shop fetcher

export default function Payment() {
  const router = useRouter();
  const navigation = useNavigation();
  
  // Get params passed from Invoice page
  const { orderId, totalAmount } = useLocalSearchParams<{ orderId: string, totalAmount: string }>();
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const amountValue = parseFloat(totalAmount || "0");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#87CEFA" },
      headerTintColor: "#000",
      headerTitle: "Select Payment",
    });
  }, [navigation]);

  // 🔑 NEW: Fetch Shop Payment Methods on Load
  useEffect(() => {
    const loadPaymentMethods = async () => {
        try {
            // 1. Get Order Details to find the Shop ID
            const orderData = await fetchOrderDetails(orderId);
            
            if (orderData) {
                // 2. Fetch Shop Details (including payment methods)
                // Ideally, fetchOrderDetails should return shopId. 
                // Assuming your CustomerOrderDetails interface (orders.ts) has shopId?
                // If not, we might need to update orders.ts or rely on the shop fetcher logic.
                
                // WORKAROUND: If orderData doesn't have shopId explicitly in frontend type, 
                // check if your backend returns it.
                // Based on your previous orders.js, GET /:orderId returns 'shopId'.
                // So we can cast it:
                const shopId = (orderData as any).shopId; 

                if (shopId) {
                    const shopData = await fetchShopDetails(shopId);
                    if (shopData && shopData.paymentMethods) {
                        setPaymentMethods(shopData.paymentMethods);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load payment methods", error);
            Alert.alert("Error", "Could not load payment options.");
        } finally {
            setInitializing(false);
        }
    };
    loadPaymentMethods();
  }, [orderId]);

  const handlePaymentSelection = async (methodName: string, methodId: string) => {
    setLoading(true);
    try {
        const success = await confirmPayment(orderId, methodId, amountValue);
        if (success) {
            router.push({
                pathname: "/payment/receipt",
                params: { 
                    orderId: orderId, 
                    amount: totalAmount, 
                    method: methodName 
                }
            });
        } else {
            Alert.alert("Error", "Payment submission failed. Please try again.");
        }
    } catch (error) {
        Alert.alert("Error", "Network error occurred.");
    } finally {
        setLoading(false);
    }
  };

  // Helper to get icon based on method name
  const getPaymentIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cash')) return <Ionicons name="cash-outline" size={28} color="#2ecc71" style={styles.icon} />;
    if (lowerName.includes('paypal')) return <Image source={{ uri: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" }} style={styles.logo} />;
    if (lowerName.includes('gcash')) return <Image source={{ uri: "https://seeklogo.com/images/G/gcash-logo-E9313395F1-seeklogo.com.png" }} style={styles.logo} />; // Example GCash logo
    // Default icon
    return <Ionicons name="card-outline" size={28} color="#004aad" style={styles.icon} />;
  };

  if (initializing) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color="#004aad" />
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.amountTitle}>Total Amount Due</Text>
        <Text style={styles.amount}>₱{amountValue.toFixed(2)}</Text>

        <Text style={styles.subtitle}>Choose your payment method:</Text>

        {/* 🔑 DYNAMIC LIST OF PAYMENT METHODS */}
        {paymentMethods.length > 0 ? (
            <FlatList 
                data={paymentMethods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.optionCard, loading && { opacity: 0.5 }]}
                        onPress={() => handlePaymentSelection(item.name, item.id)}
                        disabled={loading}
                    >
                        {getPaymentIcon(item.name)}
                        <Text style={styles.optionText}>{item.name}</Text>
                        {loading && <ActivityIndicator style={{ marginLeft: 'auto' }} color="#004aad" />}
                    </TouchableOpacity>
                )}
            />
        ) : (
            <Text style={styles.emptyText}>No payment methods available.</Text>
        )}
      
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, flex: 1 },
  amountTitle: { fontSize: 16, color: "#555", marginBottom: 5, textAlign: 'center' },
  amount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#004aad",
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 15, color: '#333' },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee'
  },
  optionText: { fontSize: 18, fontWeight: "600", marginLeft: 15, color: "#333" },
  logo: { width: 40, height: 40, resizeMode: "contain" },
  icon: { marginRight: 5 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 }
});