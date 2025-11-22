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

  // 🔑 PREPARE VALUES
  const serviceFee = parseFloat(order.servicePrice.toString()) || 0;
  const deliveryFee = parseFloat(order.deliveryFee.toString()) || 0;
  const totalAmount = parseFloat(order.totalAmount.toString()) || 0;
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

        {/* --- ORDER DETAILS SECTION (STACKED LAYOUT) --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            
            {/* 1. Basic Info */}
            <StackedRow label="Laundry Weight" value={`${order.weight} kg`} icon="scale-outline" />
            <StackedRow label="Service Name" value={order.serviceName} icon="basket-outline" />
            <StackedRow label="Delivery Type" value={order.deliveryType} icon="bicycle-outline" />
            
            {/* 2. Stacked Fabrics (NEW) */}
            <View style={styles.stackedItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="shirt-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.label}>Fabrics / Clothes</Text>
                </View>
                <View style={styles.addOnBox}>
                    {order.fabrics && order.fabrics.length > 0 ? (
                        order.fabrics.map((fabric, index) => (
                            <View key={index} style={styles.addOnRow}>
                                <Ionicons name="pricetag-outline" size={14} color="#004aad" style={{ marginRight: 8 }} />
                                <Text style={styles.addOnText}>{fabric}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.valueStacked}>Regular Clothes</Text>
                    )}
                </View>
            </View>

            {/* 3. Stacked Add-Ons */}
            <View style={styles.stackedItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="layers-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.label}>Add-Ons</Text>
                </View>
                <View style={styles.addOnBox}>
                    {order.addons.length > 0 ? (
                        order.addons.map((addon, index) => (
                            <View key={index} style={styles.addOnRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#27ae60" style={{ marginRight: 6 }} />
                                <Text style={styles.addOnText}>{addon.name}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.valueStacked}>None</Text>
                    )}
                </View>
            </View>
            
            {/* 4. Stacked Instructions */}
            <View style={styles.stackedItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="create-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.label}>Special Instructions</Text>
                </View>
                <View style={[styles.addOnBox, { backgroundColor: '#fff3cd', borderColor: '#ffeeba' }]}>
                    <Text style={[styles.valueStacked, { color: '#856404', fontStyle: 'italic' }]}>
                        {order.instructions || "None"}
                    </Text>
                </View>
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
                        totalAmount: totalAmount.toFixed(2) 
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

const StackedRow = ({ label, value, icon }: { label: string, value: string, icon: any }) => (
    <View style={styles.stackedItem}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name={icon} size={16} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.valueStacked}>{value}</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#004aad", marginBottom: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  
  // Stacked Layout Styles
  stackedItem: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  label: { fontSize: 13, color: "#666", fontWeight: '500' },
  valueStacked: { fontSize: 16, color: "#222", fontWeight: "700", marginTop: 2, marginLeft: 22 },
  
  // Box Styles (For Addons, Fabrics, Instructions)
  addOnBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginLeft: 22,
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addOnText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Payment Rows (Classic Layout)
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 12 },
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