// app/payment/invoice.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchOrderDetails, CustomerOrderDetails } from "@/lib/orders"; 

export default function InvoiceScreen() {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004aad" />
        <Text style={{ marginTop: 10, color: "#555" }}>Generating Invoice...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }}>Order not found.</Text>
      </View>
    );
  }

  // 🔑 PREPARE VALUES DIRECTLY FROM BACKEND DATA
  const serviceFee = parseFloat(order.servicePrice.toString()) || 0;
  const deliveryFee = parseFloat(order.deliveryFee.toString()) || 0;
  const totalAmount = parseFloat(order.totalAmount.toString()) || 0;
  
  // Calculate Add-ons sum just for the breakdown display
  const addonsFee = order.addons.reduce((sum, item) => sum + parseFloat(item.price.toString()), 0);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
            title: "Review Invoice", 
            headerShown: true,
            headerStyle: { backgroundColor: "#87CEFA" }, 
            headerTintColor: "#000",
            headerTitleStyle: { fontWeight: "bold" },
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0, padding: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
            ),
            headerShadowVisible: false, 
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- HEADER CARD --- */}
        <View style={styles.headerCard}>
          <View style={styles.shopIcon}>
            <Ionicons name="storefront" size={32} color="#fff" />
          </View>
          <Text style={styles.shopName}>{order.shopName}</Text>
          <Text style={styles.orderId}>Order ID: #{order.orderId}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.headerRow}>
             <Text style={styles.headerLabel}>Customer:</Text>
             <Text style={styles.headerValue}>{order.customerName}</Text>
          </View>
          <View style={styles.headerRow}>
             <Text style={styles.headerLabel}>Created At:</Text>
             <Text style={styles.headerValue}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
        </View>

        {/* --- ORDER DETAILS SECTION --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            
            <DetailRow label="Laundry Weight" value={`${order.weight} kg`} />
            <DetailRow label="Service Name" value={order.serviceName} />
            <DetailRow label="Delivery Type" value={order.deliveryType} />
            
            <View style={styles.row}>
                <Text style={styles.label}>Add-Ons</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    {order.addons.length > 0 ? (
                        order.addons.map((addon, index) => (
                            <Text key={index} style={styles.valueSmall}>• {addon.name}</Text>
                        ))
                    ) : (
                        <Text style={styles.value}>None</Text>
                    )}
                </View>
            </View>
            
            <View style={[styles.row, { alignItems: 'flex-start' }]}>
                <Text style={styles.label}>Special Instructions</Text>
                <Text style={[styles.value, { maxWidth: '60%', textAlign: 'right' }]}>
                    {order.instructions || "None"}
                </Text>
            </View>
        </View>

        {/* --- PAYMENT DETAILS SECTION --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <PriceRow label="Service Fee" amount={serviceFee} />
            <PriceRow label="Add-Ons Fee" amount={addonsFee} />
            <PriceRow label="Delivery Fee" amount={deliveryFee} />
            
            <View style={styles.dividerLine} />
            
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₱{totalAmount.toFixed(2)}</Text>
            </View>
        </View>

      </ScrollView>

      {/* --- FOOTER BUTTON --- */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.payButton}
            onPress={() => {
                router.push({
                    pathname: "/(tabs)/payment/pay",
                    params: { 
                        orderId: order.orderId,
                        shopName: order.shopName,
                        totalAmount: totalAmount.toFixed(2) // 🔑 Use Backend Total
                    }
                });
            }}
        >
            <Text style={styles.payButtonText}>Proceed to Payment</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Helper Components ---
const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const PriceRow = ({ label, amount }: { label: string, amount: number }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.price}>₱{amount.toFixed(2)}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  // Header Card
  headerCard: {
    backgroundColor: "#004aad",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shopIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 50,
    marginBottom: 10,
  },
  shopName: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  orderId: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: '600' },
  divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5 },
  headerLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  headerValue: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Sections
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#004aad", marginBottom: 15, textTransform: "uppercase", letterSpacing: 0.5 },
  
  // Rows
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 14, color: "#222", fontWeight: "600" },
  valueSmall: { fontSize: 13, color: "#444", marginBottom: 2, textAlign: 'right' },
  price: { fontSize: 14, color: "#222", fontWeight: "600" },
  
  // Totals
  dividerLine: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  totalRow: { flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#222" },
  totalValue: { fontSize: 20, fontWeight: "bold", color: "#27ae60" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  payButton: {
    backgroundColor: "#004aad",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});