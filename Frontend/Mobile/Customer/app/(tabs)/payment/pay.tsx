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
    FlatList,
    Modal
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from 'expo-image-picker'; 

// Custom Library Imports
import { submitPayment, submitDeliveryPayment, fetchOrderDetails } from "@/lib/orders"; 
import { fetchShopDetails, PaymentMethod } from "@/lib/shops"; 
import { initiatePayPalPayment } from "@/lib/auth"; 

export default function Payment() {
    const router = useRouter();
    const navigation = useNavigation();
    
    // 1. Get Params
    const { orderId, amount, shopName, isDelivery } = useLocalSearchParams<{ 
        orderId: string, 
        amount: string, 
        shopName: string,
        isDelivery: string 
    }>();
    
    // 2. State Management
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    
    // Modal & Proof State
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [pendingMethodId, setPendingMethodId] = useState<number | null>(null);
    const [pendingMethodName, setPendingMethodName] = useState<string>("");

    const isDeliveryPay = isDelivery === 'true';
    const amountValue = parseFloat(amount || "0"); 

    // 3. Header Setup
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: { backgroundColor: "#87CEFA" },
            headerTintColor: "#000",
            headerTitle: isDeliveryPay ? "Pay Delivery Fee" : "Select Payment",
        });
    }, [navigation, isDeliveryPay]);

    // 4. Load Shop Payment Methods
    useEffect(() => {
        const loadPaymentMethods = async () => {
            try {
                const orderData = await fetchOrderDetails(orderId);
                if (orderData && orderData.shopId) {
                    const shopData = await fetchShopDetails(orderData.shopId);
                    if (shopData && shopData.paymentMethods) {
                        setPaymentMethods(shopData.paymentMethods);
                    }
                }
            } catch (error) {
                console.error("Failed to load payment methods", error);
                Alert.alert("Error", "Could not load payment options.");
            } finally {
                setInitializing(false);
            }
        };
        if (orderId) loadPaymentMethods();
        else setInitializing(false);
    }, [orderId]);

    // 5. Helper: Pick Image from Gallery
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setProofImage(result.assets[0].uri);
        }
    };

    // 6. Helper: Finalize Payment to Backend (With or Without Image)
    const finalizePayment = async (methodName: string, methodIdNum: number) => {
        setLoading(true);
        try {
            let confirmSuccess = false;
            
            // Pass the proofImage URI (or null) to the backend functions
            if (isDeliveryPay) {
                confirmSuccess = await submitDeliveryPayment(
                    String(orderId), 
                    methodIdNum, 
                    amountValue, 
                    proofImage // Pass image here
                );
            } else {
                confirmSuccess = await submitPayment(
                    String(orderId), 
                    methodIdNum, 
                    amountValue, 
                    proofImage // Pass image here
                );
            }

            if (confirmSuccess) {
                setShowProofModal(false); 
                router.push({
                    pathname: "/payment/receipt",
                    params: { 
                        orderId: orderId, 
                        amount: amountValue.toFixed(2), 
                        method: methodName,
                        isDelivery: isDeliveryPay ? 'true' : 'false', 
                    }
                });
            } else {
                Alert.alert("Error", "Payment submission failed. Please try again.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Network error during confirmation.");
        } finally {
            setLoading(false);
        }
    };

    // 7. Handle Payment Method Click
    const handlePaymentSelection = async (methodName: string, methodId: string) => {
        const methodIdNum = parseInt(methodId, 10);
        const isPayPal = methodName.toLowerCase().includes('paypal');

        if (isPayPal) {
            // --- PAYPAL FLOW ---
            setLoading(true);
            try {
                // A. Request Link
                const result = await initiatePayPalPayment(amountValue, orderId, isDeliveryPay);
                
                if (result.success && result.approvalUrl) {
                    // B. Open Browser
                    await WebBrowser.openBrowserAsync(result.approvalUrl);
                    
                    // C. On Return: Open Proof Modal
                    // We assume user completed it if they closed the browser.
                    setPendingMethodId(methodIdNum);
                    setPendingMethodName(methodName);
                    setProofImage(null); // Reset previous image
                    setShowProofModal(true); 
                } else {
                    Alert.alert("Error", "Could not initiate PayPal payment.");
                }
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Network error occurred.");
            } finally {
                setLoading(false);
            }
        } else {
            // --- CASH / DIRECT FLOW ---
            // Submit immediately without proof
            finalizePayment(methodName, methodIdNum);
        }
    };

    const getPaymentIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('cash')) return <Ionicons name="cash-outline" size={28} color="#2ecc71" style={styles.icon} />;
        if (lowerName.includes('paypal')) return <Image source={{ uri: "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" }} style={styles.logo} />;
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

            {/* 🟢 PROOF UPLOAD MODAL */}
            <Modal
                visible={showProofModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProofModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Payment Proof Required</Text>
                        <Text style={styles.modalDesc}>
                            Please attach a screenshot of your PayPal transaction to verify your payment.
                        </Text>

                        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                            {proofImage ? (
                                <Image source={{ uri: proofImage }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="cloud-upload-outline" size={40} color="#aaa" />
                                    <Text style={styles.uploadText}>Tap to Upload Image</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => setShowProofModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.confirmBtn, !proofImage && { backgroundColor: '#ccc' }]} 
                                disabled={!proofImage || loading}
                                onPress={() => {
                                    if (pendingMethodName && pendingMethodId) {
                                        finalizePayment(pendingMethodName, pendingMethodId);
                                    }
                                }}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Submit Proof</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f9f9" },
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, flex: 1 },
    amountTitle: { fontSize: 16, color: "#555", marginBottom: 5, textAlign: 'center' },
    amount: { fontSize: 36, fontWeight: "bold", color: "#004aad", marginBottom: 30, textAlign: 'center' },
    subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 15, color: '#333' },
    optionCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#eee' },
    optionText: { fontSize: 18, fontWeight: "600", marginLeft: 15, color: "#333" },
    logo: { width: 40, height: 40, resizeMode: "contain" },
    icon: { marginRight: 5 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366', marginBottom: 10 },
    modalDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
    uploadBox: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 10, color: '#888' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    modalButtons: { flexDirection: 'row', gap: 15, width: '100%' },
    cancelBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
    confirmBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: '#004aad' },
    cancelText: { fontWeight: '600', color: '#555' },
    confirmText: { fontWeight: '600', color: '#fff' }
});