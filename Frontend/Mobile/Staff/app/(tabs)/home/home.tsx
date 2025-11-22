// app/home/home.tsx

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Header from "@/components/Header";
import { fetchOrders, updateOrderStatus, Order } from "@/lib/orders";
import { getCurrentUser, logout } from "@/lib/auth";

export default function HomeScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const user = getCurrentUser();
  const shopId = user?.ShopID;
  const shopName = user?.ShopName;

  const loadOrders = useCallback(async () => {
    if (shopId) {
      setLoading(true);
      try {
        const fetchedOrders = await fetchOrders(shopId);
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Failed to load orders:", error);
        Alert.alert("Error", "Could not load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }, [shopId]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleAcceptOrder = async (order: Order) => {
    // 1. Priority Check: If Payment needs confirmation, go to Confirmation Screen
    if (order.invoiceStatus === 'To Confirm') {
        router.push({
            pathname: "/home/confirm_payment",
            params: { orderId: order.orderId }
        });
        return; 
    }

    // 2. Check if Paid (Standard flow)
    if (order.invoiceStatus !== 'Paid') {
      Alert.alert("Unpaid Order", "This order has not been paid yet.");
      return; 
    }

    // 3. Optimistically update UI for standard processing
    setOrders((currentOrders) =>
      currentOrders.filter((o) => o.orderId !== order.orderId)
    );
    
    const success = await updateOrderStatus(order.orderId, "Processing");

    if (!success) {
      Alert.alert("Error", "Failed to update order status. Please try again.");
      loadOrders(); 
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const getOrderStatusCount = (status: string) => {
    return orders.filter((o) => o.status === status).length;
  };

  const freshOrders = orders.filter((o) => 
    o.status === "Pending" || 
    o.status === "To Pick-up" || 
    o.status === "Delivered In Shop"
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={shopName || "Dashboard"}
        showBack={false}
        rightActions={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={26} color="#fff" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOrders} />
        }
      >
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.statusGrid}>
          <StatusCardLink
            icon="sync-circle-outline"
            label="Processing"
            count={getOrderStatusCount("Processing")}
            colors={["#3498DB", "#0D47A1"]}
            onPress={() =>
              router.push({ pathname: "/home/processing", params: { shopId } })
            }
          />
          <StatusCardLink
            icon="car-outline"
            label="For Delivery"
            count={getOrderStatusCount("Out for Delivery")}
            colors={["#F8C471", "#F5B041"]}
            onPress={() =>
              router.push({ pathname: "/home/forDelivery", params: { shopId } })
            }
          />
          <StatusCardLink
            icon="checkmark-circle-outline"
            label="Completed"
            count={getOrderStatusCount("Completed")}
            colors={["#2ECC71", "#35B412"]}
            onPress={() =>
              router.push({ pathname: "/home/completed", params: { shopId } })
            }
          />
          <StatusCardLink
            icon="close-circle-outline"
            label="Rejected"
            count={getOrderStatusCount("Rejected")}
            colors={["#E74C3C", "#A10D0D"]}
            onPress={() =>
              router.push({ pathname: "/home/rejected", params: { shopId } })
            }
          />
        </View>

        <Text style={styles.sectionTitle}>New Laundry Orders</Text>
        {freshOrders.length > 0 ? (
          freshOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onAcceptOrder={handleAcceptOrder}
              shopId={shopId as string}
            />
          ))
        ) : (
          <View style={styles.noOrdersContainer}>
            <Text style={styles.noOrdersText}>🎉 No new orders to review!</Text>
            <Text style={styles.noOrdersSubText}>Pull down to refresh.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Helper Components ---

const StatusCardLink = ({
  icon,
  label,
  count,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  colors: [string, string];
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => (scale.value = withTiming(0.95, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 100 }))}
      onPress={onPress}
      style={styles.statusCardWrapper}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient colors={colors} style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <Ionicons name={icon} size={32} color="#fff" />
            <Text style={styles.statusCardCount}>{count}</Text>
          </View>
          <Text style={styles.statusCardLabel}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

function OrderCard({
  order,
  onAcceptOrder,
  shopId,
}: {
  order: Order;
  onAcceptOrder: (order: Order) => void;
  shopId: string;
}) {
  const router = useRouter();

  // 🔑 Common style for all status messages
  const statusStyle = { color: '#e67e22', fontWeight: 'bold' as 'bold', fontSize: 12 };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <Text style={styles.orderId}>ORDER #{order.orderId}</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/home/orderDetail",
              params: { orderId: order.orderId },
            })
          }
        >
          <Text style={styles.viewDetails}>View Details</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.orderText}>
        Customer <Text style={{ fontWeight: "bold" }}>{order.customerName}</Text>{" "}
        placed an order.
        
        {/* 🔑 UPDATED STATUS DISPLAY with Unified Style */}
        {order.invoiceStatus === 'To Confirm' ? (
             <Text style={statusStyle}>
                {'\n'}(Status: Please Accept to Confirm Payment)
             </Text>
        ) : order.status !== "Pending" && (
             <Text style={statusStyle}>
                {'\n'}(Status: {order.status})
             </Text>
        )}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.acceptBtn]}
          onPress={() => onAcceptOrder(order)}
        >
          <Ionicons name="checkmark-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.rejectBtn]}
          onPress={() =>
            router.push({
              pathname: "/home/rejectMessage",
              params: {
                orderId: order.orderId,
                customer: order.customerName,
                shopId: shopId,
              },
            })
          }
        >
          <Ionicons name="close-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#eef4f9" 
  },
  logoutButton: { 
    padding: 8, 
    backgroundColor: "rgba(255,255,255,0.15)", 
    borderRadius: 8 
  },
  scrollContainer: { 
    paddingHorizontal: 18, 
    paddingTop: 28,   
    paddingBottom: 40 
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1c3d63",
    marginTop: 18,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  statusGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginHorizontal: -8,
  },
  statusCardWrapper: { 
    width: "50%", 
    padding: 8 
  },
  statusCard: {
    borderRadius: 18,
    padding: 18,
    justifyContent: "space-between",
    minHeight: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  statusCardLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  statusCardCount: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    opacity: 0.95,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5d6d7e",
    letterSpacing: 0.6,
  },
  orderText: {
    fontSize: 16,
    color: "#2c3e50",
    lineHeight: 24,
    marginBottom: 18,
  },
  viewDetails: { 
    fontSize: 14, 
    color: "#3498db", 
    fontWeight: "700",
    textDecorationLine: "underline"
  },
  noOrdersContainer: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#fdfdfd",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  noOrdersText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 18,
    fontWeight: "700",
  },
  noOrdersSubText: {
    textAlign: "center",
    color: "#95a5a6",
    marginTop: 6,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptBtn: { 
    backgroundColor: "#35B412",
  },
  rejectBtn: { 
    backgroundColor: "#A10D0D",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 14, 
    marginLeft: 8 
  },
});