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

// Using @ aliases to match your project structure
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

  /**
   * 🔑 FIXED: Non-destructive Counting Logic
   * We check the status against a list of valid aliases instead of modifying the object.
   */
  const getCount = (statusToCheck: string, type: 'delivery' | 'order') => {
    return orders.filter((o) => {
        if (type === 'delivery') {
            const dStatus = o.deliveryStatus || '';

            // Grouping Logic for "For Delivery"
            if (statusToCheck === "For Delivery") {
                return dStatus === "For Delivery" || 
                       dStatus === "Rider Booked For Delivery" || 
                       dStatus === "Outgoing Rider Booked";
            }

            // Grouping Logic for "To Pick-up"
            if (statusToCheck === "To Pick-up") {
                return dStatus === "To Pick-up" || 
                       dStatus === "Rider Booked To Pick-up" || 
                       dStatus === "Rider Booked"; // Generic booked status usually implies incoming
            }

            return dStatus === statusToCheck;
        }
        return o.laundryStatus === statusToCheck;
    }).length;
  };

  /**
   * 🔑 UPDATED: Efficient Navigation Helper
   * Directs to the single StatusScreen with parameters
   */
  const handlePress = (status: string, label: string, type: 'delivery' | 'order') => {
    router.push({
      pathname: "/home/status",
      params: { 
        status: status, 
        title: label, 
        type: type 
      }
    });
  };


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
        {/* Title */}
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        
        <View style={styles.statusGrid}>
          
          {/* 1. TO PICK-UP (Delivery Logic) */}
          <StatusCardLink
            icon="bicycle-outline" 
            label="To Pick-up"
            count={getCount("To Pick-up", "delivery")}
            colors={["#FF7043", "#E64A19"]} // Deep Orange
            onPress={() => handlePress("To Pick-up", "To Pick-up", "delivery")}
          />

          {/* 2. TO WEIGH (Laundry Logic) */}
          <StatusCardLink
            icon="scale-outline" 
            label="To Weigh"
            count={getCount("To Weigh", "order")}
            colors={["#5C6BC0", "#3949AB"]} // Indigo
            onPress={() => handlePress("To Weigh", "To Weigh", "order")}
          />

          {/* 3. PROCESSING (Laundry Logic) */}
          <StatusCardLink
            icon="sync-circle-outline"
            label="Processing"
            count={getCount("Processing", "order")}
            colors={["#42A5F5", "#1976D2"]} // Blue
            onPress={() => handlePress("Processing", "Processing", "order")}
          />

          {/* 4. FOR DELIVERY (Delivery Logic) */}
          <StatusCardLink
            icon="car-outline"
            label="For Delivery"
            count={getCount("For Delivery", "delivery")}
            colors={["#FFCA28", "#FFA000"]} // Amber
            onPress={() => handlePress("For Delivery", "For Delivery", "delivery")}
          />

          {/* 5. COMPLETED (Laundry Logic) */}
          <StatusCardLink
            icon="checkmark-circle-outline"
            label="Completed"
            count={getCount("Completed", "order")}
            colors={["#66BB6A", "#388E3C"]} // Green
            onPress={() => handlePress("Completed", "Completed", "order")}
          />

          {/* 6. CANCELLED (Laundry Logic) */}
          <StatusCardLink
            icon="close-circle-outline"
            label="Cancelled"
            count={getCount("Cancelled", "order")}
            colors={["#EF5350", "#C62828"]} // Red
            onPress={() => handlePress("Cancelled", "Cancelled", "order")}
          />
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatusCardLink = ({
  icon,
  label,
  count,
  colors,
  onPress,
}: {
  icon: any; 
  label: string;
  count: number;
  colors: [string, string];
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = icon; 

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
            <Ionicons name={iconName} size={32} color="#fff" />
            <Text style={styles.statusCardCount}>{count}</Text>
          </View>
          <Text style={styles.statusCardLabel}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// --- ORIGINAL STYLES PRESERVED ---
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
});