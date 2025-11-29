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
import { getCurrentUser } from "@/lib/auth"; 

// 🟢 Import from Staff's orders library
import { fetchOrders, Order } from "@/lib/orders"; 

// Helper to safely parse amounts
const parseAmount = (value: string | number | undefined): number => {
  const numericValue = parseFloat(String(value));
  return !isNaN(numericValue) ? numericValue : 0;
};

export default function LaundryPaymentScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 

  const user = getCurrentUser();
  const shopId = user?.ShopID;

  const loadData = useCallback(async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const allOrders = await fetchOrders(String(shopId)); 
      
      // Filter only orders where the SERVICE payment is 'To Confirm'
      // (This excludes orders that are just unpaid or already paid)
      const pending = allOrders.filter(o => o.invoiceStatus === 'To Confirm');
      
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

  // 🟢 Navigate to Details and pass the Proof Image
  const handleViewDetails = (item: Order) => {
    router.push({
        pathname: "/payment/laundry_payment_details",
        params: { 
            orderId: item.orderId,
            customerName: item.customerName,
            totalAmount: item.totalAmount?.toString(),
            paymentStatus: item.invoiceStatus,
            proofImage: item.invoiceProofImage, 
            paymentMethodName: item.invoicePaymentMethod
        }
    });
  };

  const renderItem = ({ item }: { item: Order }) => {
    const displayAmount = parseAmount(item.totalAmount);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.customer}>{item.customerName}</Text>
          <Text style={styles.amount}>₱{displayAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={[styles.actionButton, styles.viewDetailsButton]}
                onPress={() => handleViewDetails(item)} 
            >
                <Text style={[styles.buttonText, { color: '#004aad' }]}>Review & Confirm</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Laundry Payments" showBack={true} />
      
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3498db" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending service payments.</Text>
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  customer: { fontSize: 15, color: '#555' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  viewDetailsButton: {
    backgroundColor: '#eaf5ff',
    borderColor: '#004aad',
    borderWidth: 1,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 }
});