import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { fetchOrderDetails, CustomerOrderDetails, AddOnDetail } from "@/lib/orders";

// Helper to safely parse and format currency (FIXED: Function now defined)
const safeParseAndFormat = (value: any): string => {
    // Ensure value is present, then convert to string and parse as float.
    const numericValue = parseFloat(String(value) || '0');
    return `₱ ${numericValue.toFixed(2)}`;
};

// Helper to format date strings
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US');

export default function OrderDetails() {
    const navigation = useNavigation();
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();

    const [order, setOrder] = useState<CustomerOrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Data Fetching ---
    useEffect(() => {
        if (!orderId) return;

        const loadDetails = async () => {
            setLoading(true);
            try {
                const fetchedOrder = await fetchOrderDetails(orderId);
                setOrder(fetchedOrder);
            } catch (error) {
                console.error("Failed to load order details:", error);
                Alert.alert("Error", "Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [orderId]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: {
                backgroundColor: "#89CFF0",
                borderBottomWidth: 1.5,
                borderBottomColor: "#5EC1EF",
            },
            headerTintColor: "#000",
            headerShadowVisible: false,
            headerTitle: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                        style={{
                            color: "#2d2d2d",
                            marginLeft: 5,
                            fontSize: 20,
                            fontWeight: "600",
                        }}
                    >
                        Order Details
                    </Text>
                </View>
            ),
        });
    }, [navigation]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#004aad" />
                <Text style={{ marginTop: 10, color: '#555' }}>Loading order details...</Text>
            </View>
        );
    }
    
    if (!order) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#dc3545' }}>Order not found or loading failed.</Text>
            </View>
        );
    }

    // --- Dynamic Calculation (FIXED: Using parseFloat defensively) ---
    // Safely calculate total add-ons cost
    const totalAddons = order.addons.reduce((sum, addon) => sum + parseFloat(String(addon.price) || '0'), 0);

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.card}>
                    
                    {/* Customer Info */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <Ionicons name="person-circle-outline" size={28} color="#004aad" />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.customerName}>{order.customerName}</Text>
                                <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Order Info */}
                    <View style={styles.section}>
                        <View style={styles.rowBetween}>
                            <View>
                                <Text style={styles.sectionTitle}>Order Information</Text>
                                <Text style={[styles.detailText, { fontWeight: "600" }]}>
                                    Order ID: <Text style={{ color: "#004aad" }}>#{order.orderId}</Text>
                                </Text>
                            </View>
                            <Text style={styles.detailText}>{formatDate(order.createdAt)}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Service Details (Includes Line Items & Total) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Service Details</Text>

                        {/* Service Type */}
                        <View style={styles.rowBetween}>
                            <MaterialIcons name="local-laundry-service" size={18} color="#666" />
                            <Text style={styles.label}>Service Type:</Text>
                            <Text style={styles.value}>{order.serviceName}</Text>
                        </View>

                        {/* Weight */}
                         <View style={styles.rowBetween}>
                            <Ionicons name="scale-outline" size={18} color="#666" />
                            <Text style={styles.label}>Weight:</Text>
                            {/* FIX: Use toString() for safety before displaying */}
                            <Text style={styles.value}>{order.initialWeight?.toString() || 'N/A'} kg</Text>
                        </View>
                        
                        {/* Base Price (Initial Estimate) */}
                        <View style={styles.rowBetween}>
                            <Ionicons name="pricetag-outline" size={18} color="#666" />
                            <Text style={styles.label}>Base Price ({order.serviceName}):</Text>
                            {/* FIX: Use safeParseAndFormat helper */}
                            <Text style={styles.value}>{safeParseAndFormat(order.servicePrice)}</Text>
                        </View>

                        {/* Add-on Summary */}
                        {order.addons.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 10 }]}>Add-ons ({order.addons.length})</Text>
                                {order.addons.map((addon) => (
                                    <View key={addon.name} style={[styles.rowBetween, { marginVertical: 2 }]}>
                                        <Text style={[styles.detailText, { marginLeft: 10 }]}>• {addon.name}</Text>
                                        {/* FIX: Use safeParseAndFormat helper */}
                                        <Text style={styles.value}>+ {safeParseAndFormat(addon.price)}</Text>
                                    </View>
                                ))}
                                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                                    <Text style={[styles.detailText, { fontWeight: "600" }]}>Total Add-ons:</Text>
                                    <Text style={[styles.value, { fontWeight: "600" }]}>{safeParseAndFormat(totalAddons)}</Text>
                                </View>
                            </View>
                        )}
                        

                        {/* Total Amount */}
                        <View style={[styles.rowBetween, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 10 }]}>
                            <FontAwesome5 name="money-bill-wave" size={16} color="#004aad" />
                            <Text style={styles.label}>TOTAL AMOUNT:</Text>
                            <Text style={[styles.value, { color: "#004aad", fontWeight: "700", fontSize: 15 }]}>
                                {/* FIX: Use safeParseAndFormat helper for final total */}
                                {safeParseAndFormat(order.totalAmount)}
                            </Text>
                        </View>

                        {/* Payment Method - NOW DYNAMIC */}
                        <View style={styles.rowBetween}>
                            <Ionicons name="card-outline" size={18} color="#666" />
                            <Text style={styles.label}>Payment Method:</Text>
                            {/* FIX: Use the dynamically fetched method name */}
                            <Text style={[styles.value, { fontWeight: "600" }]}>
                                {order.paymentMethodName || 'Not Paid/Method Unknown'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Delivery Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Information</Text>
                        <View style={styles.rowBetween}>
                            <Ionicons name="cube-outline" size={18} color="#666" />
                            <Text style={styles.label}>Type:</Text>
                            <Text style={styles.value}>{order.deliveryType}</Text>
                        </View>
                        <View style={styles.rowBetween}>
                            <Ionicons name="location-outline" size={18} color="#666" />
                            <Text style={styles.label}>Address:</Text>
                            <Text style={[styles.value, { flex: 1, textAlign: "right" }]}>
                                {order.customerAddress}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Done Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.dismiss()} 
                >
                    <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  customerPhone: {
    fontSize: 14,
    color: "#555",
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#004aad",
  },
  detailText: {
    fontSize: 14,
    color: "#333",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  footer: {
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },

  button: {
    margin: 20,
    backgroundColor: "#004aad",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});