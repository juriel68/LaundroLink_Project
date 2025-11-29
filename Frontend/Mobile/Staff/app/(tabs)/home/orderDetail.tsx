// orderDetail.tsx

import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, ActivityIndicator, ScrollView 
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { 
  fetchOrderDetails, 
  OrderDetail, 
  AddOnDetail 
} from "@/lib/orders"; 
import Header from "@/components/Header";

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (orderId) {
          const foundOrder = await fetchOrderDetails(orderId);
          setOrder(foundOrder);
        }
      } catch (e) {
         console.error("Load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  // Logic to calculate totals for display
  const calculatedSummary = order ? (() => {
    const servicePrice = parseFloat(order.servicePrice?.toString() || '') || 0.00;
    const deliveryFee = parseFloat(order.deliveryFee?.toString() || '') || 0.00;
    const addOnsTotal = order.addons.reduce((sum, addon) => sum + (parseFloat(addon.price?.toString() || '') || 0.00), 0.00);
    const total = servicePrice + addOnsTotal + deliveryFee;

    return {
        servicePrice: servicePrice.toFixed(2),
        addOnsTotal: addOnsTotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
    };
  })() : null;

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#004aad"/></View>;
  if (!order) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Order not found</Text></View>;

  return (
    <View style={styles.container}>
      <Header title={`Order #${order.orderId}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.customer}>{order.customerName}</Text>
          <Text style={styles.subText}>📞 {order.customerPhone}</Text>
          <Text style={styles.subText}>📍 {order.customerAddress || 'Address not provided'}</Text>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order & Service</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Service:</Text> {order.serviceName}</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Placed:</Text> {new Date(order.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Current Status:</Text> <Text style={styles.statusText}>{order.orderStatus}</Text></Text>
        </View>

        {/* Weight Section (Read Only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Laundry Weight</Text>
          <Text style={styles.normalText}>Measured Weight: <Text style={{ fontWeight: "bold" }}>{order.weight} kg</Text></Text>
          {(order as any).instructions && (
             <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Instructions:</Text> {(order as any).instructions}</Text>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items & Details</Text>
          <Text style={styles.subTextDetail}>Fabrics</Text>
          {order.fabrics.length > 0 ? ( order.fabrics.map((fabric, index) => ( <Text key={`fab-${index}`} style={styles.listItem}>• {fabric}</Text> ))
          ) : ( <Text style={styles.listItem}>No fabrics specified.</Text> )}

          <Text style={styles.subTextDetail}>Add-Ons</Text>
          {order.addons.length > 0 ? ( order.addons.map((addon: AddOnDetail, index) => ( <Text key={`addon-${index}`} style={styles.listItem}>• {addon.name}</Text> ))
          ) : ( <Text style={styles.listItem}>No add-ons selected.</Text> )}
        </View>
        
        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Service Price:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.servicePrice}</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Total AddOns Cost:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.addOnsTotal}</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Delivery Fee:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }]}>
             <Text style={styles.totalText}>ORDER TOTAL</Text>
             <Text style={[styles.totalText, { color: '#c82333' }]}>₱{calculatedSummary?.total}</Text>
          </View>
        </View>
        
        {/* Delivery Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <Text style={styles.normalText}>Type: {order.deliveryType}</Text>
          <Text style={styles.normalText}>Address: {order.customerAddress}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fcff", },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 15, },
  section: { backgroundColor: "#ffffff", padding: 18, borderRadius: 14, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: "#004aad", letterSpacing: 0.3, },
  customer: { fontSize: 20, fontWeight: "700", color: "#1b263b", },
  subText: { fontSize: 14, color: "#555", marginTop: 2, },
  subTextDetail: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 4, },
  normalText: { fontSize: 15, color: "#222", marginBottom: 6, lineHeight: 22, },
  listItem: { fontSize: 14, color: "#444", marginLeft: 10, marginBottom: 2, },
  statusText: { fontWeight: "bold", color: '#0077b6' },
  totalText: { fontSize: 17, fontWeight: "700", color: "#0077b6", },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, },
  summaryValue: { fontWeight: 'bold', color: '#333' },
});