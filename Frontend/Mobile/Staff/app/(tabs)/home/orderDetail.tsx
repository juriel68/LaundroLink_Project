// orderdetail.tsx 

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "expo-router";
// 🔑 IMPORT AddOnDetail for type safety
import { fetchOrderDetails, OrderDetail, AddOnDetail } from "@/lib/orders"; 
import Header from "@/components/Header";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        setLoading(true);
        setOrder(null); 
        const foundOrder = await fetchOrderDetails(orderId);
        setOrder(foundOrder);
        setLoading(false);
        
        if (!foundOrder) {
             Alert.alert("Error", "Could not load order details.");
        }
      }
    };
    loadOrder();
  }, [orderId]);

  // --- Calculation Logic (FIXED FOR UNDEFINED PROPERTIES) ---
  const calculatedSummary = order ? (() => {
    const servicePrice = parseFloat(order.servicePrice?.toString() || '') || 0.00;
    const deliveryFee = parseFloat(order.deliveryFee?.toString() || '') || 0.00;

    // Calculate total add-on cost (since addons are now objects, sum their price property)
    const addOnsTotal = order.addons.reduce((sum, addon) => sum + (parseFloat(addon.price?.toString() || '') || 0.00), 0.00);

    // Assuming the intent is Fixed Service Price + Addons + Delivery Fee
    const serviceCost = servicePrice + addOnsTotal; 

    // Final Total
    const subtotal = serviceCost; 
    const total = subtotal + deliveryFee;

    return {
        // Values exposed to JSX
        servicePriceDisplay: servicePrice.toFixed(2), 
        serviceCost: serviceCost.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
    };
  })() : null;

  // --- Loading and Error Display ---
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f9fcff" }}>
        <Header title="Loading Order" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#004aad" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f9fcff" }}>
        <Header title="Order Details" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: '#c82333', fontSize: 16 }}>Order not found or an error occurred.</Text>
        </View>
      </View>
    );
  }

  // --- Rendered Component ---
  return (
    <View style={styles.container}>
      <Header title={`Order #${order.orderId}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.customer}>{order.customerName}</Text>
          <Text style={styles.subText}>📞 {order.customerPhone}</Text>
          <Text style={styles.subText}>📍 {order.customerAddress || 'Address not provided'}</Text>
        </View>
        
        {/* Rejection Details (Only visible if rejected) */}
        {order.status === "Rejected" && (
          <View style={[styles.section, { borderLeftColor: '#c82333', borderLeftWidth: 4 }]}>
            <Text style={[styles.sectionTitle, { color: "#c82333" }]}>⚠️ Order Rejected</Text>
            <Text style={styles.normalText}>
              <Text style={{ fontWeight: "bold" }}>Reason: </Text>
              {order.reason || 'N/A'}
            </Text>
            {order.note && (
              <Text style={styles.normalText}>
                <Text style={{ fontWeight: "bold" }}>Note: </Text>
                {order.note}
              </Text>
            )}
          </View>
        )}

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order & Service</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Service:</Text> {order.serviceName}
          </Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Placed:</Text> {new Date(order.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Current Status:</Text> <Text style={styles.statusText}>{order.status}</Text>
          </Text>
        </View>

        {/* Laundry Weight & Edit Button */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Laundry Weight</Text>
            {order.status === "Pending" && ( 
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/home/editWeight", // Assuming correct path to staff components
                    params: { orderId: order.orderId, prevWeight: order.weight?.toString() }, // 🔑 FIX: Ensure weight is passed as string, handle potential undefined
                  })
                }
                style={styles.editIconContainer}
              >
                <Ionicons name="pencil" size={20} color="#004aad" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.normalText}>Measured Weight: <Text style={{ fontWeight: "bold" }}>{order.weight} kg</Text>
          </Text>
          {/* Instructions */}
          {(order as any).instructions && (
             <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Instructions:</Text> {(order as any).instructions}
             </Text>
          )}
        </View>

        {/* Fabrics and Add-Ons (FIXED SECTION) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items & Details</Text>
          
          {/* Display Fabrics */}
          <Text style={styles.subTextDetail}>Fabrics</Text>
          {order.fabrics.length > 0 ? (
            order.fabrics.map((fabric, index) => (
                <Text key={`fab-${index}`} style={styles.listItem}>• {fabric}</Text>
            ))
          ) : (
            <Text style={styles.listItem}>No fabrics specified.</Text>
          )}

          {/* FIX: Display Add-Ons by accessing the 'name' property */}
          <Text style={styles.subTextDetail}>Add-Ons</Text>
          {order.addons.length > 0 ? (
            // Cast addon to AddOnDetail interface which guarantees the 'name' property
            order.addons.map((addon: AddOnDetail, index) => (
                <Text key={`addon-${index}`} style={styles.listItem}>• {addon.name}</Text>
            ))
          ) : (
            <Text style={styles.listItem}>No add-ons selected.</Text>
          )}
        </View>
        
        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Service Price (per kg):</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.servicePriceDisplay}</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Total Service Cost:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.serviceCost}</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Delivery Fee:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }]}>
             <Text style={styles.totalText}>FINAL ORDER TOTAL</Text>
             <Text style={[styles.totalText, { color: '#c82333' }]}>₱{calculatedSummary?.total}</Text>
          </View>
        </View>
        
        {/* Delivery Information */}
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
  container: { 
    flex: 1, 
    backgroundColor: "#f9fcff",
  },
  scrollContent: { 
    paddingBottom: 40, 
    paddingHorizontal: 16, 
    paddingTop: 15,
  },
  section: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 10, 
    color: "#004aad",
    letterSpacing: 0.3,
  },
  customer: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#1b263b", 
  },
  subText: { 
    fontSize: 14, 
    color: "#555", 
    marginTop: 2,
  },
  // 🔑 NEW STYLE: For sub-headers within the detail section
  subTextDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 4,
  },
  normalText: { 
    fontSize: 15, 
    color: "#222", 
    marginBottom: 6, 
    lineHeight: 22,
  },
  listItem: {
    fontSize: 14, 
    color: "#444", 
    marginLeft: 10,
    marginBottom: 2,
  },
  statusText: {
    fontWeight: "bold",
    color: '#0077b6'
  },
  totalText: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#0077b6", 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#333'
  },
  editIconContainer: {
    backgroundColor: "#eaf5ff",
    padding: 6,
    borderRadius: 8,
  }
});