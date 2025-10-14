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

  // THIS IS THE MODIFIED FUNCTION
  const handleAcceptOrder = async (order: Order) => {
    // First, check if the invoice status is 'Paid'.
    if (order.invoiceStatus !== 'Paid') {
      // If not paid, show a simple alert with only an "Okay" button and then stop.
      Alert.alert("Unpaid Order", "This order has not been paid yet.");
      return; // This stops the function from proceeding.
    }

    // If the code reaches this point, the order is paid. Proceed directly.
    // Optimistically remove the order from the UI for a fast response.
    setOrders((currentOrders) =>
      currentOrders.filter((o) => o.orderId !== order.orderId)
    );
    
    const success = await updateOrderStatus(order.orderId, "Processing");

    if (!success) {
      // If the API call fails, show an error and reload the original data.
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

  const freshOrders = orders.filter((o) => o.status === "Pending");

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
            colors={["#5DADE2", "#3498DB"]}
            onPress={() =>
              router.push({ pathname: "/home/processing", params: { shopId } })
            }
          />
          <StatusCardLink
            icon="rocket-outline"
            label="For Delivery"
            count={getOrderStatusCount("For Delivery")}
            colors={["#AF7AC5", "#9B59B6"]}
            onPress={() =>
              router.push({ pathname: "/home/forDelivery", params: { shopId } })
            }
          />
          <StatusCardLink
            icon="checkmark-circle-outline"
            label="Completed"
            count={getOrderStatusCount("Completed")}
            colors={["#58D68D", "#2ECC71"]}
            onPress={() =>
              router.push({ pathname: "/home/completed", params: { shopId } })
            }
          />
          <StatusCardLink
            icon="close-circle-outline"
            label="Rejected"
            count={getOrderStatusCount("Rejected")}
            colors={["#EC7063", "#E74C3C"]}
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

// --- Helper Components (StatusCardLink and OrderCard) ---

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
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  logoutButton: { padding: 8 },
  scrollContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 32 
  },
  statusGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginHorizontal: -8
  },
  statusCardWrapper: { 
    width: "50%", 
    padding: 8 
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  statusCardLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  statusCardCount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noOrdersContainer: {
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  noOrdersText: {
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 18,
    fontWeight: "600",
  },
  noOrdersSubText: {
    textAlign: "center",
    color: "#95a5a6",
    marginTop: 8,
    fontSize: 14,
  },
  orderId: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    letterSpacing: 0.5,
  },
  orderText: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
    marginBottom: 20,
  },
  viewDetails: { fontSize: 14, color: "#3498db", fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    flexDirection: "row",
  },
  acceptBtn: { backgroundColor: "#2ECC71" },
  rejectBtn: { backgroundColor: "#E74C3C" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 14, marginLeft: 8 },
});