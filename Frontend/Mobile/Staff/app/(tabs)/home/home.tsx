import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
import { fetchOrders, Order } from "@/lib/orders";
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

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  // --- HELPER: GET COUNT ---
  const getCount = (statusToCheck: string, type: 'delivery' | 'order') => {
    return orders.filter((o) => {
        if (type === 'delivery') {
            const dStatus = o.deliveryStatus || '';
            if (statusToCheck === "For Delivery") {
                return dStatus === "For Delivery" || dStatus === "Rider Booked For Delivery" || dStatus === "Outgoing Rider Booked";
            }
            if (statusToCheck === "To Pick-up") {
                return dStatus === "To Pick-up" || dStatus === "Rider Booked To Pick-up" || dStatus === "Rider Booked";
            }
            return dStatus === statusToCheck;
        }
        return o.laundryStatus === statusToCheck;
    }).length;
  };

  // --- HELPER: NAVIGATION ---
  const handlePress = (status: string, label: string, type: 'delivery' | 'order') => {
    router.push({
      pathname: "/home/status",
      params: { status, title: label, type }
    });
  };

  // 🟢 NEW: Navigation to Order Detail
  const handleOrderClick = (orderId: string) => {
    router.push({
        pathname: "/home/orderDetail",
        params: { orderId }
    });
  };

  // 🟢 NEW: Filter for "Pending" List
  // We define "Pending" as orders that are 'To Weigh' or 'Pending' (New)
  const pendingList = orders.filter(o => 
      o.laundryStatus === 'To Weigh' || 
      o.laundryStatus === 'Pending' || 
      o.deliveryStatus === 'To Pick-up'
  ).slice(0, 5); // Limit to top 5 for dashboard view

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
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        
        <View style={styles.statusGrid}>
          {/* (Status Cards remain unchanged) */}
          <StatusCardLink
            icon="bicycle-outline" 
            label="To Pick-up"
            count={getCount("To Pick-up", "delivery")}
            colors={["#FF7043", "#E64A19"]}
            onPress={() => handlePress("To Pick-up", "To Pick-up", "delivery")}
          />
          <StatusCardLink
            icon="scale-outline" 
            label="To Weigh"
            count={getCount("To Weigh", "order")}
            colors={["#5C6BC0", "#3949AB"]}
            onPress={() => handlePress("To Weigh", "To Weigh", "order")}
          />
          <StatusCardLink
            icon="sync-circle-outline"
            label="Processing"
            count={getCount("Processing", "order")}
            colors={["#42A5F5", "#1976D2"]}
            onPress={() => handlePress("Processing", "Processing", "order")}
          />
          <StatusCardLink
            icon="car-outline"
            label="For Delivery"
            count={getCount("For Delivery", "delivery")}
            colors={["#FFCA28", "#FFA000"]}
            onPress={() => handlePress("For Delivery", "For Delivery", "delivery")}
          />
          <StatusCardLink
            icon="checkmark-circle-outline"
            label="Completed"
            count={getCount("Completed", "order")}
            colors={["#66BB6A", "#388E3C"]}
            onPress={() => handlePress("Completed", "Completed", "order")}
          />
          <StatusCardLink
            icon="close-circle-outline"
            label="Cancelled"
            count={getCount("Cancelled", "order")}
            colors={["#EF5350", "#C62828"]}
            onPress={() => handlePress("Cancelled", "Cancelled", "order")}
          />
        </View>

        {/* 🟢 NEW SECTION: Pending Orders List */}
        <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Recent Pending Orders</Text>
            
            {pendingList.length > 0 ? (
                pendingList.map((item) => (
                    <TouchableOpacity 
                        key={item.orderId} 
                        style={styles.orderCard}
                        onPress={() => handleOrderClick(item.orderId)}
                    >
                        <View style={styles.orderRow}>
                            <Text style={styles.orderId}>#{item.orderId}</Text>
                            <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.orderRow}>
                            <Text style={styles.customerName}>{item.customerName}</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>
                                    {item.laundryStatus === 'Pending' ? 'New' : item.laundryStatus}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            ) : (
                <Text style={styles.emptyText}>No new pending orders.</Text>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// (StatusCardLink Component remains unchanged)
const StatusCardLink = ({ icon, label, count, colors, onPress }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef4f9" },
  logoutButton: { padding: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  scrollContainer: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1c3d63", marginTop: 18, marginBottom: 14, letterSpacing: 0.3 },
  
  // Grid Styles
  statusGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8 },
  statusCardWrapper: { width: "50%", padding: 8 },
  statusCard: { borderRadius: 18, padding: 18, justifyContent: "space-between", minHeight: 130, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 8 },
  statusCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%" },
  statusCardLabel: { fontSize: 16, color: "rgba(255,255,255,0.92)", fontWeight: "600" },
  statusCardCount: { fontSize: 38, fontWeight: "900", color: "#fff" },

  // 🟢 NEW LIST STYLES
  listSection: { marginTop: 20 },
  orderCard: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
      borderLeftWidth: 4,
      borderLeftColor: '#3498db'
  },
  orderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
  },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  orderDate: { fontSize: 12, color: '#888' },
  customerName: { fontSize: 14, color: '#555' },
  statusBadge: {
      backgroundColor: '#eaf5ff',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12
  },
  statusText: { color: '#004aad', fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontStyle: 'italic' }
});