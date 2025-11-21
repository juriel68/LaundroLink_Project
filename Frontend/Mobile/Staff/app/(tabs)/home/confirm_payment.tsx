// app/home/confirm_payment.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchOrderDetails, approvePayment, OrderDetail, AddOnDetail } from "@/lib/orders";
import Header from "@/components/Header"; // 🔑 Import Header Component

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user_session');
        if (userStr) setCurrentUser(JSON.parse(userStr));

        if (orderId) {
          const data = await fetchOrderDetails(orderId);
          setOrder(data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  const handleConfirm = async () => {
    if (!currentUser) {
        Alert.alert("Error", "Session lost. Please re-login.");
        return;
    }

    setIsProcessing(true);
    try {
        const success = await approvePayment(
            orderId!, 
            currentUser.UserID, 
            currentUser.UserRole
        );
        
        if (success) {
            Alert.alert("Success", "Payment confirmed. Order is now Processing.");
            router.dismissAll(); 
            router.replace("/home/home");
        } else {
            Alert.alert("Error", "Failed to confirm payment.");
        }
    } catch (error) {
        Alert.alert("Error", "Network error.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#004aad" /></View>;
  if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

  // Parse numeric values for summary
  const serviceFee = parseFloat(order.servicePrice?.toString() || '0');
  const deliveryFee = parseFloat(order.deliveryFee?.toString() || '0');
  const addonsFee = order.addons.reduce((sum, item) => sum + parseFloat(item.price.toString()), 0);
  const total = parseFloat(order.totalAmount?.toString() || '0');

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔑 Header Component Used Here */}
      <Header 
        title="Verify Payment" 
        showBack={true} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. RECEIPT METADATA --- */}
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Ionicons name="receipt-outline" size={24} color="#004aad" />
                <Text style={styles.title}>Payment Receipt</Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.label}>Invoice ID</Text>
                <Text style={styles.value}>#{order.invoiceId}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Order ID</Text>
                <Text style={styles.value}>#{order.orderId}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>{order.customerName}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.methodBadge}>
                    <Text style={styles.methodText}>{order.paymentMethodName || "Cash"}</Text>
                </View>
            </View>
        </View>

        {/* --- 2. ORDER DETAILS (Items) --- */}
        <View style={styles.card}>
            <Text style={styles.sectionHeader}>Order Details</Text>
            
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{order.serviceName}</Text>
            </View>
            
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{order.weight} kg</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Add-Ons</Text>
                <View style={{flex:1, alignItems:'flex-end'}}>
                    {order.addons.length > 0 ? (
                        order.addons.map((addon, idx) => (
                            <Text key={idx} style={styles.detailValueSmall}>• {addon.name}</Text>
                        ))
                    ) : (
                        <Text style={styles.detailValue}>None</Text>
                    )}
                </View>
            </View>
        </View>

        {/* --- 3. PAYMENT SUMMARY (Breakdown) --- */}
        <View style={styles.card}>
            <Text style={styles.sectionHeader}>Payment Breakdown</Text>
            
            <View style={styles.row}>
                <Text style={styles.label}>Service Fee</Text>
                <Text style={styles.price}>₱{serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Add-Ons Fee</Text>
                <Text style={styles.price}>₱{addonsFee.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Delivery Fee</Text>
                <Text style={styles.price}>₱{deliveryFee.toFixed(2)}</Text>
            </View>

            <View style={[styles.amountBox, {marginTop: 15}]}>
                <Text style={styles.amountLabel}>TOTAL RECEIVED</Text>
                <Text style={styles.amountValue}>₱{total.toFixed(2)}</Text>
            </View>
        </View>

        {/* --- ACTION BUTTON --- */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={styles.approveBtn} 
                onPress={handleConfirm}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{marginRight: 10}} />
                        <Text style={styles.approveText}>Confirm Payment</Text>
                    </>
                )}
            </TouchableOpacity>
            <Text style={styles.noteText}>
                Order will be moved to <Text style={{fontWeight:'bold'}}>Processing</Text>.
            </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width:0, height:2} },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  title: { fontSize: 18, fontWeight: "bold", color: "#004aad", marginLeft: 10 },
  divider: { height: 1, backgroundColor: "#eee", marginBottom: 15, marginTop: 10 },

  sectionHeader: { fontSize: 14, fontWeight: "700", color: "#888", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  label: { fontSize: 15, color: "#666" },
  value: { fontSize: 15, fontWeight: "600", color: "#333" },
  price: { fontSize: 15, fontWeight: "600", color: "#333" },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' },
  detailLabel: { fontSize: 15, color: "#555" },
  detailValue: { fontSize: 15, fontWeight: "600", color: "#222", flex: 1, textAlign: 'right' },
  detailValueSmall: { fontSize: 14, color: "#444", marginBottom: 2, textAlign: 'right' },

  methodBadge: { backgroundColor: '#eaf5ff', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  methodText: { fontSize: 14, fontWeight: 'bold', color: '#004aad' },

  amountBox: { backgroundColor: '#eafaf1', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d5f5e3' },
  amountLabel: { fontSize: 12, fontWeight: '700', color: '#27ae60', marginBottom: 4, letterSpacing: 1 },
  amountValue: { fontSize: 26, fontWeight: 'bold', color: '#27ae60' },
  
  buttonContainer: { marginTop: 5, marginBottom: 20 },
  approveBtn: { backgroundColor: "#004aad", paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: "#004aad", shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width:0, height:3}, elevation: 5 },
  approveText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  noteText: { textAlign: 'center', color: '#888', fontSize: 12, marginTop: 12 },
});