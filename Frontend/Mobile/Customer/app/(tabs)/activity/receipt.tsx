// receipt.tsx (Consolidated Detail/History View)
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { fetchOrderDetails, CustomerOrderDetails, AddOnDetail } from "@/lib/orders"; 

// Helper function to format prices
const formatCurrency = (value: number) => `₱${value.toFixed(2)}`;

export default function Receipt() {
  const router = useRouter();
  const navigation = useNavigation();
  const { orderId, status, isHistory } = useLocalSearchParams<{ orderId: string, status: string, isHistory: string }>();

  const [order, setOrder] = useState<CustomerOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const isOrderActive = !isHistory || status === 'Processing'; // Active if not history OR status is Processing

  // --- Data Fetching ---
  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        setLoading(true);
        const foundOrder = await fetchOrderDetails(orderId);
        setOrder(foundOrder);
        setLoading(false);
        
        if (!foundOrder) {
            Alert.alert("Error", `Could not load order #${orderId} details.`);
        }
      }
    };
    loadOrder();
  }, [orderId]);

  // --- Layout Effect (Header Title) ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#89CFF0", borderBottomWidth: 1.5, borderBottomColor: "#5EC1EF" },
      headerTintColor: "#000",
      headerShadowVisible: false,
      headerTitle: () => (<Text style={styles.headerTitle}>Order Summary</Text>),
    });
  }, [navigation]);

  // --- Calculation Logic ---
  const calculatedSummary = order ? (() => {
    const servicePrice = parseFloat(order.servicePrice.toString()) || 0.00;
    const deliveryFee = parseFloat(order.deliveryFee.toString()) || 0.00;

    const addOnsTotal = order.addons.reduce((sum, addon) => sum + (parseFloat(addon.price.toString()) || 0.00), 0.00);

    const subtotal = servicePrice + addOnsTotal;
    const total = subtotal + deliveryFee;

    return { subtotal, deliveryFee, total, servicePrice };
  })() : null;

  // --- Handlers ---
  const handleButtonPress = () => {
    if (status === 'Processing' || status === 'For Delivery') {
      // If active, go to the tracking screen
      router.push({ pathname: "/activity/track_order", params: { orderId } });
    } else {
      // If completed, cancelled, or rejected, go back
      navigation.goBack();
    }
  };

  // --- Loading and Error Display ---
  if (loading || !order) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#004aad" />
        {orderId && <Text style={{ marginTop: 10, color: '#555' }}>Loading Order #{orderId}...</Text>}
      </View>
    );
  }

  const buttonText = isOrderActive ? "Track My Order" : "Done";
  const iconName = status === 'Cancelled' || status === 'Rejected' ? "close-circle" : "checkmark-done-circle";
  const iconColor = status === 'Cancelled' || status === 'Rejected' ? "#A10D0D" : "#004aad";
  const headerText = status === 'Cancelled' ? 'Order Cancelled' : (status === 'Rejected' ? 'Order Rejected' : 'Payment Successful');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        {/* Status Icon and Text */}
        <View style={styles.header}>
          <Ionicons name={iconName as any} size={95} color={iconColor} />
          <Text style={[styles.successText, { color: iconColor }]}>{headerText}</Text>
        </View>

        {/* Receipt Info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Order #</Text>
            <Text style={styles.value}>#{order.orderId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date Placed</Text>
            <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.subHeader}>Payment Summary</Text>

          {/* Service Cost */}
          <View style={styles.row}>
            <Text style={styles.item}>Service Fee ({order.serviceName})</Text>
            <Text style={styles.price}>{formatCurrency(calculatedSummary!.servicePrice)}</Text>
          </View>
            
          {/* Add-ons List */}
          {calculatedSummary!.subtotal > calculatedSummary!.servicePrice && (
              <>
                  {order.addons.map((addon) => (
                      <View key={addon.name} style={styles.row}>
                          <Text style={styles.item}>{addon.name}</Text>
                          <Text style={styles.price}>+ {formatCurrency(parseFloat(addon.price.toString()))}</Text>
                      </View>
                  ))}
              </>
          )}

          <View style={styles.row}>
            <Text style={styles.item}>Delivery Fee</Text>
            <Text style={styles.price}>{formatCurrency(calculatedSummary!.deliveryFee)}</Text>
          </View>

          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalText}>Total Paid</Text>
            <Text style={styles.totalText}>{formatCurrency(calculatedSummary!.total)}</Text>
          </View>
        </View>

        {/* Thank You/Note */}
        <View style={styles.card}>
          <Text style={styles.thankYou}>Thank you for using LaundroLink!</Text>
          <Text style={styles.note}>
            We appreciate your trust and look forward to serving you again.
          </Text>
        </View>

        {/* Contact */}
        <View style={[styles.card, styles.contactCard]}>
          <Text style={styles.contactText}>
            📞 Need help? Call <Text style={styles.highlight}>(123) 456-7890</Text>{" "}
            or send us a direct message.
          </Text>
        </View>

      </ScrollView>
        
      {/* Fixed Dynamic Button */}
      <TouchableOpacity style={styles.buttonFooter} onPress={handleButtonPress}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f8fe" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#2d2d2d" },

  header: { alignItems: "center", marginVertical: 25 },
  successText: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 18,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { fontSize: 14, color: "#555" },
  value: { fontSize: 14, fontWeight: "600", color: "#000" },

  subHeader: {
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 12,
    color: "#004aad",
    textAlign: "center",
  },

  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  item: { fontSize: 14, color: "#444" },
  price: { fontSize: 14, fontWeight: "500", color: "#111" },

  totalRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 10,
  },
  totalText: { fontWeight: "700", fontSize: 15, color: "#004aad" },

  thankYou: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
    color: "#004aad",
  },
  note: { fontSize: 13, textAlign: "center", color: "#666", lineHeight: 18 },

  contactCard: { backgroundColor: "#f8fbff", borderColor: "#cde7ff", borderWidth: 1 },

  contactText: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
    lineHeight: 18,
  },
  highlight: { fontWeight: "bold", color: "#004aad" },

  buttonFooter: { // Renamed from 'button' to avoid conflict
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#004aad",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16, letterSpacing: 0.3 },
});