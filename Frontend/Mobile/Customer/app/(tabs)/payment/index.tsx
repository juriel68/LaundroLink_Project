import { router, useNavigation, useFocusEffect } from "expo-router";
import { useLayoutEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, ActivityIndicator } from "react-native";
import { fetchCustomerOrders, CustomerOrderPreview } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";

export default function Payment() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<CustomerOrderPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { 
        backgroundColor: "#89CFF0",
        borderBottomWidth: 1.5,       
        borderBottomColor: "#5EC1EF", 
      },
      headerTintColor: "#5EC1EF",
      headerShadowVisible: false, 
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "#2d2d2dff", marginLeft: 5, fontSize: 20, fontWeight: "700" }}>
            Payment
          </Text>
        </View>
      ),
    });
  }, [navigation]);

  const loadData = useCallback(async () => {
     if (user?.UserID) {
         setLoading(true);
         try {
             const data = await fetchCustomerOrders(user.UserID);
             setOrders(data);
         } catch (e) {
             console.error(e);
         } finally {
             setLoading(false);
         }
     }
  }, [user?.UserID]);

  useFocusEffect(
      useCallback(() => {
          loadData();
      }, [loadData])
  );

  // Filter Pending Payments
  const laundryPending = orders.filter(o => o.invoiceStatus === 'To Pay');
  const deliveryPending = orders.filter(o => o.deliveryPaymentStatus === 'Pending');
  
  // Filter History (Paid or Completed items)
  // You might want to refine this logic based on what exactly constitutes "history" for you
  const historyData = orders.filter(o => o.invoiceStatus === 'Paid' || o.status === 'Cancelled' || o.invoiceStatus === 'Voided');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid": return { backgroundColor: "#d4edda", color: "#2e7d32" };
      case "Cancelled": return { backgroundColor: "#f8d7da", color: "#c62828" };
      case "Refunded": return { backgroundColor: "#fff3cd", color: "#ff8f00" };
      default: return { backgroundColor: "#e0e0e0", color: "#555" };
    }
  };

  if (loading && orders.length === 0) {
      return <View style={styles.center}><ActivityIndicator size="large" color="#004aad" /></View>;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      
      {/* --- PENDING LAUNDRY PAYMENTS --- */}
      {laundryPending.length > 0 && (
        <View>
            <Text style={styles.sectionTitle}>Pending Laundry Payments</Text>
            {laundryPending.map((item) => (
                <View key={item.id} style={styles.recentCard}>
                    <View style={styles.recentRow}>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.amount}>₱ {item.totalAmount ? Number(item.totalAmount).toFixed(2) : '0.00'}</Text>
                    </View>
                    <View style={styles.recentRow}>
                    <Text style={styles.invoice}>Order #{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: "#fff3cd" }]}>
                        <Text style={[styles.statusText, { color: "#ff8f00" }]}>To Pay</Text>
                    </View>
                    </View>
                    <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={() =>
                        router.push({
                        pathname: "/(tabs)/payment/invoice",
                        params: { orderId: item.id, type: 'laundry' },
                        })
                    }
                    >
                    <Text style={styles.buttonText}>Pay Now</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
      )}

      {/* --- PENDING DELIVERY PAYMENTS --- */}
      {deliveryPending.length > 0 && (
        <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Pending Delivery Fees</Text>
            {deliveryPending.map((item) => (
                <View key={item.id} style={styles.recentCard}>
                    <View style={styles.recentRow}>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.amount}>₱ {item.deliveryAmount ? Number(item.deliveryAmount).toFixed(2) : '0.00'}</Text>
                    </View>
                    <View style={styles.recentRow}>
                    <Text style={styles.invoice}>Order #{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: "#fff3cd" }]}>
                        <Text style={[styles.statusText, { color: "#ff8f00" }]}>Pending</Text>
                    </View>
                    </View>
                    <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#9b59b6' }]}
                    activeOpacity={0.7}
                    onPress={() =>
                        router.push({
                        pathname: "/(tabs)/payment/invoice",
                        params: { orderId: item.id, type: 'delivery' },
                        })
                    }
                    >
                    <Text style={styles.buttonText}>Pay Delivery</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
      )}

      {/* --- HISTORY --- */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment History</Text>
      {historyData.length > 0 ? (
          historyData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/payment/invoice",
                  params: { orderId: item.id, type: 'history' },
                })
              }
            >
              <View style={styles.historyRow}>
                <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>

                {/* Right side grouped */}
                <View style={styles.rightContainer}>
                  <Text style={styles.historyAmount}>₱ {item.totalAmount ? Number(item.totalAmount).toFixed(2) : '0.00'}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusStyle(item.invoiceStatus || item.status || 'Paid').backgroundColor }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusStyle(item.invoiceStatus || item.status || 'Paid').color }
                    ]}>
                      {item.invoiceStatus || item.status}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.historyInvoice}>Order #{item.id}</Text>
            </TouchableOpacity>
          ))
      ) : (
          <Text style={styles.emptyText}>No payment history yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#000",
  },
  recentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  date: { fontSize: 16, fontWeight: "500" },
  amount: { fontSize: 16, fontWeight: "700", color: "#004aad" },
  invoice: { fontSize: 14, color: "#555" },

  // Button
  button: {
    backgroundColor: "#004aad",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  // History
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8, 
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", 
  },

  historyDate: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    flex: 1, 
  },

  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 140,
  },

  historyAmount: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    color: "#174EA6",
    letterSpacing: 0.3,
    marginRight: 8,
  },

  historyInvoice: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    fontStyle: "italic",   
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "center",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#333",
  },
  emptyText: {
      color: '#999',
      textAlign: 'center',
      marginTop: 20,
      fontSize: 14
  }
});