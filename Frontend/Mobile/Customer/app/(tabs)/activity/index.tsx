import { router, useNavigation } from "expo-router";
import React, { useLayoutEffect, useState, useCallback } from "react";
import { 
    Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, 
    ActivityIndicator, Alert, SafeAreaView, Modal, TextInput 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { fetchCustomerOrders, CustomerOrderPreview, submitOrderRating } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth"; 

const formatDateTime = (timestamp: string): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const parseAmount = (value: string | number | undefined): number => {
    const numericValue = parseFloat(String(value));
    return !isNaN(numericValue) ? numericValue : 0;
};

// 🟢 REMOVED: SHOP_LOGOS constant (No longer needed)

const getStatusStyles = (status: string | undefined) => {
    switch (status) {
        case 'To Weigh':
        case 'Payment Pending':
        case 'Processing':
        case 'For Delivery':
        case 'Pending':
        case 'To Pick-up':
        case 'Rider Booked To Pick-up':
        case 'Rider Booked For Delivery':
            return { badge: styles.statusBadgeProcessing, text: styles.statusTextProcessing };
        case 'Completed':
        case 'Delivered To Customer':
            return { badge: styles.statusBadgeCompleted, text: styles.statusTextCompleted };
        case 'Cancelled':
        case 'Rejected':
            return { badge: styles.statusBadgeTerminated, text: styles.statusTextTerminated };
        default:
            return { badge: styles.statusBadgeDefault, text: styles.statusTextDefault };
    }
};

export default function Activity() {
    const navigation = useNavigation();
    
    const [activeOrders, setActiveOrders] = useState<CustomerOrderPreview[]>([]);
    const [orderHistory, setOrderHistory] = useState<CustomerOrderPreview[]>([]);
    const [loading, setLoading] = useState(true);

    // Rating Modal State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
    const [starCount, setStarCount] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);

    const user = getCurrentUser();

    const loadActivity = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const fetchedOrders = await fetchCustomerOrders(userId);

            const active = fetchedOrders
                .filter(order => {
                    const orderStatus = order.status;
                    const deliveryStatus = order.deliveryStatus;
                    const isOrderActive = orderStatus === 'To Weigh' || orderStatus === 'Processing' || orderStatus === 'Pending';
                    const isDeliveryActive = deliveryStatus === 'To Pick-up' || deliveryStatus === 'For Delivery';
                    const isRiderBooked = deliveryStatus === 'Rider Booked To Pick-up' || deliveryStatus === 'Rider Booked For Delivery'; 
                    return isOrderActive || isDeliveryActive || isRiderBooked;
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const historyStatuses = ['Completed', 'Cancelled', 'Delivered To Customer', 'Rejected'];
            const history = fetchedOrders
                .filter(order => historyStatuses.includes(order.status || '') || historyStatuses.includes(order.deliveryStatus || ''))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setActiveOrders(active);
            setOrderHistory(history);
            
        } catch (error) {
            console.error("Error loading customer activities:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (user?.UserID) {
                loadActivity(user.UserID);
            } else {
                setLoading(false);
            }
        }, [user?.UserID, loadActivity])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: { backgroundColor: "#89CFF0", borderBottomWidth: 1.5, borderBottomColor: "#5EC1EF" },
            headerTintColor: "#5EC1EF",
            headerShadowVisible: false,
            headerTitle: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: "#2d2d2dff", marginLeft: 5, fontSize: 20, fontWeight: "600" }}>Activity</Text>
                </View>
            ),
        });
    }, [navigation]);

    const handleOrderPress = (order: CustomerOrderPreview) => {
        router.push({ 
            pathname: "/activity/track_order", 
            params: { orderId: order.id, status: order.status } 
        });
    };

    const openRateModal = (orderId: string) => {
        setRatingOrderId(orderId);
        setStarCount(0);
        setRatingComment("");
        setShowRatingModal(true);
    };

    const handleSubmitRating = async () => {
        if (starCount === 0) {
            Alert.alert("Rate", "Please select at least 1 star.");
            return;
        }
        if (!ratingOrderId) return;

        setSubmittingRating(true);
        try {
            const success = await submitOrderRating(ratingOrderId, starCount, ratingComment);
            if (success) {
                Alert.alert("Thank You!", "Your feedback helps us improve.");
                setShowRatingModal(false);
                if (user?.UserID) loadActivity(user.UserID);
            } else {
                Alert.alert("Error", "Failed to submit rating. Try again later.");
            }
        } catch (e) {
            Alert.alert("Error", "Network error.");
        } finally {
            setSubmittingRating(false);
        }
    };

    const getDisplayStatus = (order: CustomerOrderPreview): string => {
        const orderStatus = order.status;
        const deliveryStatus = order.deliveryStatus;
        if (deliveryStatus) {
             if (deliveryStatus === 'To Pick-up') return 'To Pick-up';
             if (deliveryStatus === 'For Delivery') return 'For Delivery';
             if (deliveryStatus === 'Rider Booked') return 'Rider Booked';
        }
        if (orderStatus === 'Payment Pending') return 'Payment Due';
        return orderStatus || 'Pending';
    };

    // 🟢 NEW HELPER: Render Shop Image
    const renderShopImage = (url?: string) => {
        return (
            <Image 
                source={url ? { uri: url } : require("@/assets/images/laundry.avif")} 
                style={styles.logo} 
            />
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                 <View style={[styles.container, styles.loadingContainer]}>
                    <ActivityIndicator size="large" color="#004aad" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Loading order history...</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={{flex:1, backgroundColor: "#f6faff"}}>
            <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                
                <Text style={styles.sectionTitle}>Active Orders ({activeOrders.length})</Text>
                {activeOrders.length > 0 ? (
                    activeOrders.map((order) => {
                        const displayStatus = getDisplayStatus(order);
                        const statusStyles = getStatusStyles(displayStatus);
                        return (
                            <View key={order.id} style={styles.card}>
                                {/* 🟢 USE DYNAMIC IMAGE */}
                                {renderShopImage(order.shopImage)}

                                <View style={styles.details}>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.orderId}>#{order.id}</Text>
                                        <View style={[styles.statusBadgeProgress, statusStyles.badge]}>
                                            <Text style={[styles.statusText, statusStyles.text]}>{displayStatus.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.orderText}>Shop: {order.shopName}</Text>
                                    <Text style={styles.orderText}>Date: {formatDateTime(order.createdAt)}</Text>
                                    <Text style={styles.orderTotal}>Total: ₱ {parseAmount(order.totalAmount).toFixed(2)}</Text>
                                    <TouchableOpacity style={styles.button} onPress={() => handleOrderPress(order)}>
                                        <Text style={styles.buttonText}>Track My Order</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noDataText}>No active orders currently.</Text>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Order History ({orderHistory.length})</Text>
                {orderHistory.length > 0 ? (
                    orderHistory.map((item) => {
                        const historyStatusStyles = getStatusStyles(item.status);
                        const isCompleted = item.status === 'Completed' || item.status === 'Delivered To Customer';
                        const showRateButton = isCompleted && !item.isRated;

                        return (
                            <View key={item.id} style={styles.historyCardWrapper}>
                                <TouchableOpacity activeOpacity={0.8} onPress={() => handleOrderPress(item)} style={styles.historyCard}>
                                    
                                    {/* 🟢 USE DYNAMIC IMAGE */}
                                    {renderShopImage(item.shopImage)}

                                    <View style={styles.historyDetails}>
                                        <Text style={styles.historyId}>#{item.id}</Text>
                                        <Text style={styles.historyDate}>Date: {formatDateTime(item.createdAt)}</Text>
                                        <Text style={styles.orderTotal}>Total: ₱ {parseAmount(item.totalAmount).toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.deliveredBadge, historyStatusStyles.badge]}>
                                        <Text style={[styles.deliveredText, historyStatusStyles.text]}>{item.status?.toUpperCase()}</Text>
                                    </View>
                                </TouchableOpacity>
                                
                                {showRateButton && (
                                    <TouchableOpacity style={styles.rateButton} onPress={() => openRateModal(item.id)}>
                                        <Ionicons name="star" size={16} color="#fff" style={{marginRight:5}} />
                                        <Text style={styles.rateButtonText}>Rate Shop</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noDataText}>No past orders found.</Text>
                )}
            </ScrollView>

            {/* Rating Modal */}
            <Modal visible={showRatingModal} transparent animationType="slide" onRequestClose={() => setShowRatingModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rate your Experience</Text>
                        <Text style={styles.modalSubtitle}>How was the service?</Text>
                        
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setStarCount(star)}>
                                    <Ionicons 
                                        name={star <= starCount ? "star" : "star-outline"} 
                                        size={36} 
                                        color="#FFD700" 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment (optional)..."
                            placeholderTextColor="#aaa"
                            multiline
                            numberOfLines={3}
                            value={ratingComment}
                            onChangeText={setRatingComment}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRatingModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitRating} disabled={submittingRating}>
                                {submittingRating ? <ActivityIndicator color="#fff"/> : <Text style={styles.modalSubmitText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f6faff" },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 12 },
    card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 4, marginBottom: 20 },
    logo: { width: 85, height: 85, borderRadius: 10, marginRight: 14 },
    details: { flex: 1 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    orderId: { fontSize: 18, fontWeight: "700", color: "#000" },
    statusBadgeProgress: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1.5 },
    statusText: { fontWeight: "700", fontSize: 12, color: "#2d2d2dff" },
    orderText: { fontSize: 14, color: "#444", marginBottom: 3 },
    orderTotal: { fontSize: 15, fontWeight: "600", marginTop: 4, color: "#004aad" },
    button: { backgroundColor: "#004aad", marginTop: 10, paddingVertical: 8, borderRadius: 8, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 }, shadowRadius: 4, elevation: 3 },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 14, letterSpacing: 0.5 },
    historyCardWrapper: { marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, overflow:'hidden', elevation: 2 },
    historyCard: { flexDirection: "row", alignItems: "center", padding: 12 },
    historyLogo: { width: 65, height: 65, borderRadius: 10, marginRight: 14 },
    historyDetails: { flex: 1 },
    historyId: { fontSize: 16, fontWeight: "600", color: "#111" },
    historyDate: { fontSize: 14, color: "#666", marginTop: 2 },
    deliveredBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1.5 },
    deliveredText: { fontWeight: "700", fontSize: 12 },
    noDataText: { textAlign: 'center', color: '#888', marginTop: 10, fontSize: 15 },
    rateButton: { backgroundColor: "#FF9800", paddingVertical: 8, alignItems: "center", justifyContent: "center", flexDirection: 'row' },
    rateButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 25, width: "85%", alignItems: "center", elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#004aad", marginBottom: 5 },
    modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
    starContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
    commentInput: { width: "100%", backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, height: 80, textAlignVertical: "top", marginBottom: 20 },
    modalButtons: { flexDirection: "row", gap: 15, width: "100%" },
    modalCancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
    modalSubmitBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#004aad", alignItems: "center" },
    modalCancelText: { fontWeight: "600", color: "#555" },
    modalSubmitText: { fontWeight: "600", color: "#fff" },
    statusBadgeProcessing: { backgroundColor: '#FFF3E0', borderColor: '#FF9800' },
    statusTextProcessing: { color: '#FF9800' },
    statusBadgeCompleted: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
    statusTextCompleted: { color: '#4CAF50' },
    statusBadgeTerminated: { backgroundColor: '#FFEBEE', borderColor: '#F44336' },
    statusTextTerminated: { color: '#F44336' },
    statusBadgeDefault: { backgroundColor: "#D9F1FF", borderColor: "#0D47A1" },
    statusTextDefault: { color: "#004aad" }
});