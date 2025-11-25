// app/payment/invoice.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchOrderDetails, CustomerOrderDetails, submitPayment, submitDeliveryPayment } from "@/lib/orders"; 

// Helper to safely parse amounts
const parseAmount = (value: string | number | undefined): number => {
  const numericValue = parseFloat(String(value));
  return !isNaN(numericValue) ? numericValue : 0;
};

export default function InvoiceScreen() {
  const router = useRouter();
  const { orderId, type } = useLocalSearchParams<{ orderId: string, type: 'laundry' | 'delivery' | 'history' }>();
  
  const [order, setOrder] = useState<CustomerOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (orderId) {
        const data = await fetchOrderDetails(orderId);
        setOrder(data);
      }
      setLoading(false);
    };
    loadData();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004aad" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }}>Order not found.</Text>
      </View>
    );
  }
  
  // 🔑 CORE PAYMENT LOGIC SETUP
  // Check if the current payment action is for the primary laundry service invoice
  const isLaundryPayment = type === 'laundry' && order.invoiceStatus === 'To Pay';
  // Check if the current payment action is for the delivery fee
  const isDeliveryPayment = type === 'delivery' && order.deliveryPaymentStatus === 'Pending';
  // If not a pending payment action, treat it as history view
  const isHistoryView = type === 'history' || (!isLaundryPayment && !isDeliveryPayment); 

  const serviceFee = parseAmount(order.servicePrice) * parseAmount(order.weight);
  const deliveryFee = parseAmount(order.deliveryFee);
  const totalAmount = parseAmount(order.totalAmount);
  const addonsFee = order.addons.reduce((sum, item) => sum + parseAmount(item.price), 0);

  // Determine the amount the customer is currently focused on paying
  const focusedAmount = isDeliveryPayment ? deliveryFee : totalAmount;
  
  // Determine if payment is needed
  const needsPayment = isLaundryPayment || isDeliveryPayment;

  // --- Render Functions ---

  const renderServiceBreakdown = () => {
    // Determine delivery status color/text for the summary line
    const isDeliveryPaid = order.deliveryPaymentStatus === 'Paid' || order.deliveryPaymentStatus === 'To Confirm';
    const deliveryStatusText = isDeliveryPaid ? 'Paid' : (order.deliveryPaymentStatus === 'Pending Later' ? 'Pending (Later)' : 'Pending');
    const deliveryStatusColor = isDeliveryPaid ? '#27ae60' : (order.deliveryPaymentStatus === 'Pending Later' ? '#ff8f00' : '#c0392b');

    return (
      <>
        {/* --- SERVICE BREAKDOWN SECTION --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Breakdown</Text>
            
            <PriceRow label={`${order.serviceName} (${order.weight} kg @ ₱${parseAmount(order.servicePrice).toFixed(2)}/kg)`} amount={serviceFee} />
            <PriceRow label="Add-Ons Fee" amount={addonsFee} />
            
            {/* 🟢 UPDATED: Display Delivery Fee with Status */}
            <View style={styles.row}>
                <Text style={styles.label}>Delivery Fee</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.statusTag, { backgroundColor: deliveryStatusColor, color: '#fff' }]}>{deliveryStatusText}</Text>
                    <Text style={styles.price}>₱{deliveryFee.toFixed(2)}</Text>
                </View>
            </View>
            {/* End Update */}
            
            <View style={styles.dividerLine} />
            
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Laundry Service Invoice</Text>
                <Text style={styles.totalValue}>₱{totalAmount.toFixed(2)}</Text>
            </View>

            {order.weightProofImage && (
              <>
                <View style={[styles.dividerLine, { marginVertical: 20}]} />
                <Text style={styles.sectionTitle}>Proof of Weight</Text>
                <Image 
                  source={{ uri: order.weightProofImage }} 
                  style={styles.proofImage} 
                  resizeMode="contain"
                />
              </>
            )}

        </View>
      </>
    );
  };

  const renderDeliveryBreakdown = () => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Fee</Text>
        <PriceRow label={`Delivery Fee for ${order.deliveryType}`} amount={deliveryFee} />
        <View style={styles.dividerLine} />
        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Due</Text>
            <Text style={[styles.totalValue, { color: '#9b59b6' }]}>₱{deliveryFee.toFixed(2)}</Text>
        </View>
    </View>
  );

  const renderHistoryDetails = () => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Totals</Text>
        <PriceRow label="Final Service Total" amount={totalAmount} />
        <PriceRow label="Status" value={order.invoiceStatus} />
        <PriceRow label="Payment Method" value={order.paymentMethodName || "N/A"} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: needsPayment ? "Payment Due" : "Invoice Details", 
          headerShown: true,
          headerStyle: { backgroundColor: needsPayment ? "#ff9800" : "#87CEFA" },
          headerTintColor: "#000",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0, padding: 10 }}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerShadowVisible: false, 
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- HEADER CARD --- */}
        <View style={styles.headerCard}>
          <View style={styles.shopIcon}>
            <Ionicons name="storefront" size={32} color="#fff" />
          </View>
          <Text style={styles.shopName}>{order.shopName}</Text>
          <Text style={styles.orderId}>Order ID: #{order.orderId}</Text>
        </View>

        {/* --- DYNAMIC CONTENT --- */}
        {isLaundryPayment && renderServiceBreakdown()}
        {isDeliveryPayment && renderDeliveryBreakdown()}
        {isHistoryView && renderHistoryDetails()}
        
      </ScrollView>

      {/* --- FOOTER BUTTON (Action or Back) --- */}
      <View style={styles.footer}>
        {needsPayment ? (
            <TouchableOpacity 
                style={[styles.payButton, isDeliveryPayment && { backgroundColor: '#9b59b6' }]}
                onPress={() => {
                    // Navigate to the specific payment processing screen
                    router.push({
                        pathname: "/(tabs)/payment/pay",
                        params: { 
                            orderId: order.orderId,
                            shopName: order.shopName,
                            amount: focusedAmount.toFixed(2),
                            isDelivery: isDeliveryPayment ? 'true' : 'false'
                        }
                    });
                }}
            >
                <Text style={styles.payButtonText}>
                  {isDeliveryPayment ? `Pay Delivery Fee ₱${focusedAmount.toFixed(2)}` : `Pay Total ₱${focusedAmount.toFixed(2)}`}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
        ) : (
            <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: '#555' }]}
                onPress={() => router.back()}
            >
                <Text style={styles.payButtonText}>Back to Payments</Text>
            </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// --- Helper Components ---

const PriceRow = ({ label, amount, value }: { label: string, amount?: number, value?: string }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {value ? (
            <Text style={styles.price}>{value}</Text>
        ) : (
            <Text style={styles.price}>₱{amount ? amount.toFixed(2) : '0.00'}</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  // Header Card
  headerCard: {
    backgroundColor: "#004aad",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shopIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 50,
    marginBottom: 10,
  },
  shopName: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  orderId: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: '600' },
  statusBadge: { 
    marginTop: 10,
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5 },
  headerLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  headerValue: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Sections
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#004aad", marginBottom: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  
  // Stacked Layout Styles
  stackedItem: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  label: { fontSize: 13, color: "#666", fontWeight: '500' },
  valueStacked: { fontSize: 16, color: "#222", fontWeight: "700", marginTop: 2, marginLeft: 22 },
  
  // Box Styles (For Addons, Fabrics, Instructions)
  addOnBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginLeft: 22,
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addOnText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Payment Rows (Classic Layout)
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 12 },
  price: { fontSize: 14, color: "#222", fontWeight: "600" },
  
  // Totals
  dividerLine: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  totalRow: { flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#222" },
  totalValue: { fontSize: 20, fontWeight: "bold", color: "#27ae60" },

  // Image Proof
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#f0f0f0'
  },

  // NEW Status Tag for PriceRow
  statusTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      fontSize: 12,
      fontWeight: '600',
      marginRight: 10,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  payButton: {
    backgroundColor: "#004aad",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});