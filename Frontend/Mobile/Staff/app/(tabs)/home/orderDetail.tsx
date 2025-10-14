// orderdetail.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { fetchOrderDetails, OrderDetail } from "@/lib/orders";
import Header from "@/components/Header";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        setLoading(true);
        const foundOrder = await fetchOrderDetails(orderId);
        setOrder(foundOrder);
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  if (loading || !order) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={!order ? "Error" : "Order Details"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : (
            <Text>Order not found</Text>
          )}
        </View>
      </View>
    );
  }

  const weightNumber = parseFloat(order.weight);
  const servicePriceNumber = parseFloat(order.servicePrice);
  const deliveryFeeNumber = parseFloat(order.deliveryFee);
  const subtotal = weightNumber * servicePriceNumber;
  const total = subtotal + deliveryFeeNumber;

  return (
    <View style={styles.container}>
      <Header title="Order Details" />

      {/* ✅ ScrollView added here */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.customer}>{order.customerName}</Text>
          <Text style={styles.subText}>{order.customerPhone}</Text>
        </View>

        {order.status === "Rejected" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: "#c82333" }]}>Rejection Details</Text>
            <Text style={styles.normalText}>
              <Text style={{ fontWeight: "bold" }}>Reason: </Text>
              {order.reason}
            </Text>
            {order.note && (
              <Text style={styles.normalText}>
                <Text style={{ fontWeight: "bold" }}>Note: </Text>
                {order.note}
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Text style={styles.normalText}>Order ID: #{order.orderId}</Text>
          <Text style={styles.normalText}>Date: {new Date(order.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.normalText}>Service: {order.serviceName}</Text>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>Laundry Weight</Text>
            {order.status === "Pending" && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/home/editWeight",
                    params: { orderId: order.orderId, prevWeight: order.weight },
                  })
                }
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="pencil" size={20} color="black" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.normalText}>{order.weight} kg</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <Text style={styles.normalText}>Subtotal: ₱{subtotal.toFixed(2)}</Text>
          <Text style={styles.normalText}>Delivery Fee: ₱{deliveryFeeNumber.toFixed(2)}</Text>
          <Text style={styles.totalText}>Total: ₱{total.toFixed(2)}</Text>
        </View>

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
    backgroundColor: "#f9fcff", // softer blueish background
  },
  scrollContent: { 
    paddingBottom: 40, 
    paddingHorizontal: 16, 
    paddingTop: 15,
  },

  /* ==== SECTION CARD STYLE ==== */
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

  /* ==== TITLES ==== */
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 10, 
    color: "#004aad",
    letterSpacing: 0.3,
  },

  /* ==== CUSTOMER NAME ==== */
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

  /* ==== TEXT STYLES ==== */
  normalText: { 
    fontSize: 15, 
    color: "#222", 
    marginBottom: 6, 
    lineHeight: 22,
  },
  totalText: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#0077b6", 
    marginTop: 8,
  },

  /* ==== ADDED VISUAL DETAILS ==== */
  editIcon: {
    marginLeft: 10,
    backgroundColor: "#eaf5ff",
    padding: 6,
    borderRadius: 8,
  },
});

