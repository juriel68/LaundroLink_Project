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
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 30 }, // ✅ extra space at bottom
  section: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  customer: { fontSize: 18, fontWeight: "600" },
  subText: { fontSize: 15, color: "#555" },
  normalText: { fontSize: 15, color: "#222", marginBottom: 4 },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#000", marginTop: 5 },
});
