// app/payment/receipt.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchOrderDetails, CustomerOrderDetails } from "@/lib/orders";

export default function ReceiptScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<CustomerOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (orderId) {
        const data = await fetchOrderDetails(orderId);
        setOrder(data);
      }
      setLoading(false);
    };
    loadData();
  }, [orderId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

  // Calculations
  const serviceFee = parseFloat(order.servicePrice.toString()) || 0;
  const deliveryFee = parseFloat(order.deliveryFee.toString()) || 0;
  const addonsFee = order.addons.reduce((sum, item) => sum + parseFloat(item.price.toString()), 0);
  const total = parseFloat(order.totalAmount.toString()) || (serviceFee + addonsFee + deliveryFee);

  return (
    <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Success Header */}
            <View style={styles.statusContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                </View>
                <Text style={styles.statusTitle}>Payment Successful</Text>
                <Text style={styles.statusSub}>Waiting for staff confirmation</Text>
            </View>

            {/* Receipt Card */}
            <View style={styles.receiptCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.shopInfoContainer}>
                        <Text style={styles.shopNameHeader}>{order.shopName}</Text>
                        <Text style={styles.shopDetailsText}>{order.shopAddress}</Text>
                        <Text style={styles.shopDetailsText}>{order.shopPhone}</Text>
                    </View>

                    <View style={styles.headerDivider} />

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Invoice ID</Text>
                        <Text style={styles.metaValue}>#{order.invoiceId}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Order ID</Text>
                        <Text style={styles.metaValue}>#{order.orderId}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Date Paid</Text>
                        <Text style={styles.metaValue}>{new Date().toLocaleDateString()}</Text>
                    </View>
                    
                    {/* 🔑 ADDED: Payment Method Row */}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Payment Method</Text>
                        <Text style={[styles.metaValue, { color: '#004aad' }]}>
                            {order.paymentMethodName || "Null"}
                        </Text>
                    </View>
                </View>

                {/* Dashed Line */}
                <View style={styles.dashedLineContainer}>
                    <View style={styles.dashedLine} />
                </View>

                {/* Payment Summary */}
                <View style={styles.body}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Service ({order.serviceName})</Text>
                        <Text style={styles.price}>₱{serviceFee.toFixed(2)}</Text>
                    </View>
                    
                    {order.addons.length > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Add-Ons</Text>
                            <Text style={styles.price}>₱{addonsFee.toFixed(2)}</Text>
                        </View>
                    )}
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Delivery</Text>
                        <Text style={styles.price}>₱{deliveryFee.toFixed(2)}</Text>
                    </View>

                    {/* Total Divider */}
                    <View style={styles.solidDivider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
                    </View>
                </View>
                
                {/* Footer Message */}
                <View style={styles.footerMessage}>
                    <Text style={styles.thankYou}>Thank you for using LaundroLink!</Text>
                    <Text style={styles.appreciation}>We appreciate your trust and look forward to serving you again.</Text>
                </View>
            </View>

            {/* Contact Support */}
            <View style={styles.supportContainer}>
                <Text style={styles.helpText}>Need help? Call <Text style={{fontWeight:'bold'}}>{order.shopName}</Text></Text>
                <View style={styles.contactIcons}>
                    <TouchableOpacity 
                        style={styles.contactBtn} 
                        onPress={() => Linking.openURL(`tel:${order.shopPhone}`)} 
                    >
                        <Ionicons name="call" size={20} color="#004aad" />
                        <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.contactBtn}
                        onPress={() => router.dismissAll()} 
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color="#004aad" />
                        <Text style={styles.contactBtnText}>Message</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Home Button */}
            <TouchableOpacity style={styles.homeButton} onPress={() => router.dismissAll()}>
                <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>

        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#004aad" }, 
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  scrollContent: { padding: 20, paddingBottom: 50, alignItems: 'center' },

  // Status Section
  statusContainer: { alignItems: "center", marginBottom: 25, marginTop: 20 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#2ecc71", justifyContent: "center", alignItems: "center", marginBottom: 15, borderWidth: 4, borderColor: "rgba(255,255,255,0.2)" },
  statusTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 5 },
  statusSub: { fontSize: 14, color: "rgba(255,255,255,0.8)" },

  // Receipt Card
  receiptCard: {
    width: '100%',
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    marginBottom: 25
  },
  cardHeader: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  shopInfoContainer: { alignItems: 'center', marginBottom: 15 },
  shopNameHeader: { fontSize: 18, fontWeight: 'bold', color: '#004aad', marginBottom: 4, textAlign: 'center' },
  shopDetailsText: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 2 },
  headerDivider: { height: 1, backgroundColor: '#e0e0e0', width: '100%', marginBottom: 15 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontSize: 14, color: "#888" },
  metaValue: { fontSize: 14, fontWeight: "700", color: "#333" },

  dashedLineContainer: { height: 1, width: '100%', overflow: 'hidden', backgroundColor: '#fff' },
  dashedLine: { borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 1 },

  body: { padding: 25 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#aaa", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 15, color: "#444", flex: 1 },
  price: { fontSize: 15, fontWeight: "600", color: "#222" },

  solidDivider: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
  
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: "#222" },
  totalValue: { fontSize: 22, fontWeight: "bold", color: "#004aad" },

  footerMessage: { 
    backgroundColor: "#f0f8ff", 
    padding: 20, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#e6f0fa' 
  },
  thankYou: { fontSize: 16, fontWeight: "700", color: "#004aad", marginBottom: 4 },
  appreciation: { fontSize: 12, color: "#666", textAlign: "center", fontStyle: 'italic' },

  // Support
  supportContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
  helpText: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 10 },
  contactIcons: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
  contactBtn: { flexDirection: 'row', backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  contactBtnText: { marginLeft: 8, color: "#004aad", fontWeight: "600" },

  // Home Button
  homeButton: { paddingVertical: 15, width: '100%', alignItems: 'center' },
  homeButtonText: { color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: "600", textDecorationLine: 'underline' },
});