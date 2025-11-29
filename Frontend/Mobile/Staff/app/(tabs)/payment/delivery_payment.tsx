import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Header from "@/components/Header";
import { fetchOrders, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth"; 

const parseAmount = (value: string | number | undefined): number => {
  const numericValue = parseFloat(String(value));
  return !isNaN(numericValue) ? numericValue : 0;
};

export default function DeliveryPaymentScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const user = getCurrentUser();
  const shopId = user?.ShopID;

  const loadData = useCallback(async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const allOrders = await fetchOrders(shopId);
      const pending = allOrders.filter(o => o.deliveryPaymentStatus === 'To Confirm');
      setOrders(pending);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Navigate to new details screen instead of opening modal
  const handleReviewPress = (order: Order) => {
    router.push({
      pathname: "/payment/delivery_payment_details",
      params: {
        orderId: order.orderId,
        customerName: order.customerName,
        deliveryAmount: order.deliveryAmount,
        deliveryPaymentMethod: order.deliveryPaymentMethod || "",
        deliveryPaymentDate: order.deliveryPaymentDate || "",
        deliveryPaymentProofImage: order.deliveryPaymentProofImage || ""
      }
    });
  };

  const renderItem = ({ item }: { item: Order }) => {
    const displayAmount = parseAmount(item.deliveryAmount);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View>
              <Text style={styles.customer}>{item.customerName}</Text>
              <Text style={styles.statusLabel}>Rider Fee</Text>
          </View>
          <Text style={styles.amount}>₱{displayAmount.toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={() => handleReviewPress(item)}
        >
          <Text style={styles.buttonText}>Review & Confirm</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Delivery Payments" showBack={true} />
      
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#9b59b6" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending delivery payments.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  date: { color: '#888', fontSize: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  customer: { fontSize: 15, color: '#555' },
  statusLabel: { fontSize: 12, color: '#9b59b6', marginTop: 2, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#9b59b6' },
  confirmButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 }
});