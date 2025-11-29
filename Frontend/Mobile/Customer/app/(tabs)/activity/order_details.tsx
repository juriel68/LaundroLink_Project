import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Image } from "react-native";
import { fetchOrderDetails, CustomerOrderDetails, AddOnDetail } from "@/lib/orders";

// Helper to safely parse and format currency
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

    // --- Helper Components defined INSIDE to access styles ---
    const DetailRow = ({ icon, label, value, valueStyle, multiline = false }: { icon: React.ReactNode, label: string, value: string, valueStyle?: object, multiline?: boolean }) => (
        <View style={[styles.rowBetween, styles.detailRowContainer, multiline && { alignItems: 'flex-start' }]}>
            <View style={styles.row}>
                <View style={{ width: 30 }}>{icon}</View>
                <Text style={styles.label}>{label}</Text>
            </View>
            <Text 
                style={[styles.value, valueStyle, multiline && styles.multilineValue]} 
                numberOfLines={multiline ? undefined : 1}
            >
                {value}
            </Text>
        </View>
    );

    const PriceDisplayRow = ({ label, amount }: { label: string, amount: number }) => (
        <View style={[styles.rowBetween, { marginVertical: 4 }]}>
            <Text style={[styles.detailText, styles.priceRowText]}>{label}</Text>
            <Text style={[styles.value, styles.priceRowText]}>{safeParseAndFormat(amount)}</Text>
        </View>
    );


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

    // --- Dynamic Calculations ---
    const servicePricePerKg = parseFloat(String(order.servicePrice) || '0');
    const totalWeight = parseFloat(String(order.weight) || '0');
    const calculatedServiceFee = servicePricePerKg * totalWeight;
    const totalAddons = order.addons.reduce((sum, addon) => sum + parseFloat(String(addon.price) || '0'), 0);
    const deliveryFee = parseFloat(String(order.deliveryFee) || '0');


    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                        <DetailRow 
                            icon={<MaterialIcons name="local-laundry-service" size={18} color="#666" />} 
                            label="Service Type:" 
                            value={order.serviceName} 
                        />
                        
                        {/* Weight */}
                        <DetailRow 
                            icon={<Ionicons name="scale-outline" size={18} color="#666" />} 
                            label="Final Weight:" 
                            value={`${totalWeight.toFixed(1)} kg`} 
                            valueStyle={{ fontWeight: '700' }}
                        />
                        
                        {/* Weight Proof Image (If available) */}
                        {order.weightProofImage && (
                            <View style={{ marginBottom: 15 }}>
                                <Text style={[styles.detailText, styles.proofLabel]}>Weight Proof:</Text>
                                <Image source={{ uri: order.weightProofImage }} style={styles.proofImage} resizeMode="cover" />
                            </View>
                        )}
                        
                        {/* Base Price (Initial Estimate) */}
                        <DetailRow 
                            icon={<Ionicons name="pricetag-outline" size={18} color="#666" />} 
                            label={`Rate (${order.serviceName}):`} 
                            value={`${safeParseAndFormat(order.servicePrice)} / kg`} 
                        />
                        
                        {/* Add-on Summary */}
                        {order.addons.length > 0 && (
                            <View style={{ marginTop: 10 }}>
                                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 8 }]}>Add-ons ({order.addons.length})</Text>
                                {order.addons.map((addon, index) => (
                                    <View key={index} style={[styles.rowBetween, { marginVertical: 2, paddingLeft: 20 }]}>
                                        <Text style={styles.detailText}>• {addon.name}</Text>
                                        <Text style={styles.value}>{safeParseAndFormat(addon.price)}</Text>
                                    </View>
                                ))}
                                <View style={[styles.rowBetween, { marginTop: 8, paddingLeft: 20 }]}>
                                    <Text style={[styles.detailText, { fontWeight: "600" }]}>Total Add-ons:</Text>
                                    <Text style={[styles.value, { fontWeight: "600" }]}>{safeParseAndFormat(totalAddons)}</Text>
                                </View>
                            </View>
                        )}
                        
                    </View>

                    <View style={styles.divider} />

                    {/* FINAL TOTALS */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Status</Text>

                        <PriceDisplayRow label="Calculated Service Fee" amount={calculatedServiceFee} />
                        <PriceDisplayRow label="Add-Ons Fee" amount={totalAddons} />
                        <PriceDisplayRow label="Delivery Fee" amount={deliveryFee} />
                        
                        <View style={styles.paymentStatusRow}>
                            <Text style={[styles.detailText, { fontWeight: '600' }]}>Payment Status:</Text>
                            <Text style={[styles.value, styles.statusTag]}>
                                {order.invoiceStatus || 'PENDING INVOICE'}
                            </Text>
                        </View>
                        
                        <View style={styles.paymentStatusRow}>
                            <Text style={[styles.detailText, { fontWeight: '600' }]}>Delivery Status:</Text>
                            <Text style={[styles.value, styles.statusTag]}>
                                {order.deliveryStatus || 'PENDING'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Delivery Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Information</Text>
                        <DetailRow 
                            icon={<Ionicons name="cube-outline" size={18} color="#666" />} 
                            label="Mode:" 
                            value={order.deliveryType} 
                        />
                        <DetailRow 
                            icon={<Ionicons name="location-outline" size={18} color="#666" />} 
                            label="Address:" 
                            value={order.customerAddress} 
                            multiline
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Done Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.back()} // Changed to router.back() for standard navigation return
                >
                    <Text style={styles.buttonText}>Back to Activity</Text>
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
    scrollContent: {
        paddingBottom: 80, // Space for footer
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
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1, // Allow row to shrink if content is too long
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
        gap: 6,
    },
    detailRowContainer: {
        marginVertical: 6,
        // Removed paddingHorizontal: 5
    },
    label: {
        fontSize: 14,
        color: "#666",
        // Removed flex: 1, now it will only take content width
        marginLeft: 10,
        flexShrink: 1, // Allow label to shrink if needed
    },
    value: {
        fontSize: 14,
        fontWeight: "500",
        color: "#111",
        flex: 1, // Allow value to take up remaining space
        textAlign: 'right',
        flexShrink: 1, // Allow value to shrink
    },
    multilineValue: {
        textAlign: 'right',
        // Max width adjusted for better wrapping
        maxWidth: '75%', // Increased from 70%
    },
    paymentStatusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statusTag: {
        backgroundColor: '#e6f3ff',
        color: '#004aad',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        fontWeight: '700',
        fontSize: 12,
    },
    proofLabel: {
        marginBottom: 8,
        marginTop: 10,
        fontWeight: '600',
        color: '#888'
    },
    proofImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#f0f0f0'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderColor: "#e0e0e0",
        backgroundColor: "#fff",
        borderTopWidth: 1,
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
    priceRowText: {
        fontSize: 14, 
        color: '#333'
    },
    totalLabel: { 
        fontSize: 16,
        fontWeight: "700",
        color: "#222",
        flex: 1, // Allow total label to take space
    },
    totalValue: { 
        fontSize: 16,
        fontWeight: "700",
        color: "#004aad",
        flexShrink: 1, // Allow total value to shrink
        textAlign: 'right',
    }
});