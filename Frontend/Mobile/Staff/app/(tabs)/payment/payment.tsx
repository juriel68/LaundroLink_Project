import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@/components/Header";
import { fetchOrders, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth"; // 🔑 Import Auth

export default function PaymentScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔑 Get Current Shop ID from Session
  const user = getCurrentUser();
  const shopId = user?.ShopID;

  const loadData = useCallback(async () => {
    if (!shopId) return; // Guard clause if not logged in

    setLoading(true);
    try {
      const allOrders = await fetchOrders(shopId); // 🔑 Use dynamic ID
      setOrders(allOrders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const pendingLaundryCount = orders.filter(o => o.invoiceStatus === 'To Confirm').length;
  const pendingDeliveryCount = orders.filter(o => o.deliveryPaymentStatus === 'To Confirm').length;

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Payments" 
        showBack={false} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <Text style={styles.sectionTitle}>Pending Confirmations</Text>

        {/* Laundry Payment Card */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push("/payment/laundry_payment")}
        >
          <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.card}>
            <View>
              <Ionicons name="shirt-outline" size={32} color="#fff" />
              <Text style={styles.cardTitle}>Laundry Payments</Text>
              <Text style={styles.cardSubtitle}>Service fees to confirm</Text>
            </View>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>{pendingLaundryCount}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Delivery Payment Card */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push("/payment/delivery_payment")}
        >
          <LinearGradient colors={["#a18cd1", "#fbc2eb"]} style={styles.card}>
            <View>
              <Ionicons name="bicycle-outline" size={32} color="#fff" />
              <Text style={styles.cardTitle}>Delivery Payments</Text>
              <Text style={styles.cardSubtitle}>Rider/Shipping fees</Text>
            </View>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>{pendingDeliveryCount}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    marginLeft: 5,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    height: 140,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  countContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  countText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  }
});