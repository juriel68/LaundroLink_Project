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
import { useFocusEffect, useRouter } from 'expo-router'; // 🔑 Import useRouter
import Header from "@/components/Header";
import { fetchOrders, confirmServicePayment, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth"; 

// Helper to safely parse amounts from string/number/null
const parseAmount = (value: string | number | undefined): number => {
  const numericValue = parseFloat(String(value));
  return !isNaN(numericValue) ? numericValue : 0;
};

export default function LaundryPaymentScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 🔑 Initialize router

  // 🔑 Get User Info
  const user = getCurrentUser();
  const shopId = user?.ShopID;
  const userId = user?.UserID || "Staff"; // Use actual ID for logs

  const loadData = useCallback(async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      const allOrders = await fetchOrders(shopId); // 🔑 Use dynamic ID
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

  const handleConfirm = async (orderId: string, amount: number) => {
    Alert.alert(
      "Confirm Payment",
      `Received ₱${amount.toFixed(2)} for Order #${orderId}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            setLoading(true);
            const success = await confirmServicePayment(orderId, userId, "Cashier");
            if (success) {
              Alert.alert("Success", "Payment confirmed!");
              loadData(); 
            } else {
              Alert.alert("Error", "Failed to update payment status.");
              setLoading(false);
            }
          } 
        }
      ]
    );
  };
  
  // 🔑 New handler to navigate to details screen
  const handleViewDetails = (orderId: string) => {
    router.push({
        pathname: "/home/orderDetail",
        params: { orderId: orderId }
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
                onPress={() => handleViewDetails(item.orderId)}
            >
                <Text style={[styles.buttonText, { color: '#004aad' }]}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleConfirm(item.orderId, displayAmount)}
            >
                <Text style={styles.buttonText}>Confirm Receipt</Text>
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
  
  // 🔑 NEW Button Styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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