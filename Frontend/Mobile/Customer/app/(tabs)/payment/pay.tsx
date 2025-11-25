// app/(tabs)/payment/pay.tsx

import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    FlatList
} from "react-native";
import { submitPayment, submitDeliveryPayment, fetchOrderDetails } from "@/lib/orders"; 
import { fetchShopDetails, PaymentMethod } from "@/lib/shops"; 

// 🔑 UPDATED PARAMETERS
export default function Payment() {
    const router = useRouter();
    const navigation = useNavigation();
    
    // 🔑 UPDATED: Expecting 'amount' (the focused amount) and 'isDelivery' (the new flag)
    const { orderId, amount, shopName, isDelivery } = useLocalSearchParams<{ 
        orderId: string, 
        amount: string, // This is the calculated amount due (service OR delivery)
        shopName: string,
        isDelivery: string // 'true' or 'false'
    }>();
    
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // 🔑 NEW LOGIC: isDeliveryPay uses the new 'isDelivery' flag
    const isDeliveryPay = isDelivery === 'true';
    const amountValue = parseFloat(amount || "0"); // Use the passed 'amount' directly

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: { backgroundColor: "#87CEFA" },
            headerTintColor: "#000",
            // 🔑 UPDATED Title
            headerTitle: isDeliveryPay ? "Pay Delivery Fee" : "Select Payment",
        });
    }, [navigation, isDeliveryPay]);

    // Fetch Shop Payment Methods on Load
    useEffect(() => {
        const loadPaymentMethods = async () => {
             // 🔑 FIX: We need to load order details to get the ShopID, as it's not passed via params in the new flow
            try {
                const orderData = await fetchOrderDetails(orderId);
                
                if (orderData) {
                    // Use the shopId from the fetched order details
                    const shopId = orderData.shopId; 

                    if (shopId) {
                        const shopData = await fetchShopDetails(shopId);
                        if (shopData && shopData.paymentMethods) {
                            setPaymentMethods(shopData.paymentMethods);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load payment methods", error);
                Alert.alert("Error", "Could not load payment options.");
            } finally {
                setInitializing(false);
            }
        };
        if (orderId) {
            loadPaymentMethods();
        } else {
            setInitializing(false);
        }
    }, [orderId]);

    const handlePaymentSelection = async (methodName: string, methodId: string) => {
        setLoading(true);
        try {
            let success = false;
            const methodIdNum = parseInt(methodId, 10);

            if (isDeliveryPay) {
                // Call the function for Delivery Fee
                success = await submitDeliveryPayment(String(orderId), methodIdNum, amountValue);
            } else {
                // Call original function for Service Payment
                success = await submitPayment(String(orderId), methodIdNum, amountValue);
            }

            if (success) {
                // If payment is confirmed, navigate to receipt
                router.push({
                    pathname: "/payment/receipt",
                    params: { 
                        orderId: orderId, 
                        amount: amountValue.toFixed(2), 
                        method: methodName,
                        // 🔑 Passing the flag used to determine which receipt to show
                        isDelivery: isDeliveryPay ? 'true' : 'false', 
                    }
                });
            } else {
                Alert.alert("Error", "Payment submission failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const getPaymentIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('cash')) return <Ionicons name="cash-outline" size={28} color="#2ecc71" style={styles.icon} />;
        if (lowerName.includes('paypal')) return <Image source={{ uri: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" }} style={styles.logo} />;
        if (lowerName.includes('gcash')) return <Image source={{ uri: "https://seeklogo.com/images/G/gcash-logo-E9313395F1-seeklogo.com.png" }} style={styles.logo} />; 
        return <Ionicons name="card-outline" size={28} color="#004aad" style={styles.icon} />;
    };

    if (initializing) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#004aad" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.amountTitle}>{isDeliveryPay ? "Delivery Fee Due" : "Total Service Due"}</Text>
                <Text style={styles.amount}>₱{amountValue.toFixed(2)}</Text>

                <Text style={styles.subtitle}>Choose your payment method:</Text>

                {paymentMethods.length > 0 ? (
                    <FlatList 
                        data={paymentMethods}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.optionCard, loading && { opacity: 0.5 }]}
                                onPress={() => handlePaymentSelection(item.name, item.id.toString())}
                                disabled={loading}
                            >
                                {getPaymentIcon(item.name)}
                                <Text style={styles.optionText}>{item.name}</Text>
                                {loading && <ActivityIndicator style={{ marginLeft: 'auto' }} color="#004aad" />}
                            </TouchableOpacity>
                        )}
                    />
                ) : (
                    <Text style={styles.emptyText}>No payment methods available for this shop.</Text>
                )}
            
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f9f9" },
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, flex: 1 },
    amountTitle: { fontSize: 16, color: "#555", marginBottom: 5, textAlign: 'center' },
    amount: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#004aad",
        marginBottom: 30,
        textAlign: 'center',
    },
    subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 15, color: '#333' },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee'
    },
    optionText: { fontSize: 18, fontWeight: "600", marginLeft: 15, color: "#333" },
    logo: { width: 40, height: 40, resizeMode: "contain" },
    icon: { marginRight: 5 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 20 }
});