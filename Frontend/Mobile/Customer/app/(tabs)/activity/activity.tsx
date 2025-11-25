import { router, useNavigation, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useCallback } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchCustomerOrders, CustomerOrderPreview } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth"; // 🔑 Import global session getter

// Helper to format date/time
const formatDateTime = (timestamp: string): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Helper to safely parse amounts
const parseAmount = (value: string | number | undefined): number => {
    const numericValue = parseFloat(String(value));
    return !isNaN(numericValue) ? numericValue : 0;
};

// --- MOCK DATA MAP (FOR LOGO/IMAGE) ---
// NOTE: These mock requires() will need actual image files in your assets folder.
const SHOP_LOGOS: { [key: string]: any } = {
    // You must define your images here, e.g.:
    'Wash n’ Dry - Lahug': require("@/assets/images/washndry.png"),
    'Sparklean - Apas': require("@/assets/images/sparklean.jpg"),
    // Fallback to generic logo
    'default': require("@/assets/images/laundry.avif"),
};

// --- NEW HELPER FUNCTION FOR DYNAMIC STATUS STYLING ---
const getStatusStyles = (status: string | undefined) => {
    switch (status) {
        case 'To Weigh':
        case 'Payment Pending':
        case 'Processing':
        case 'For Delivery':
        case 'Pending':
        case 'To Pick-up':
        case 'Rider Booked':
            return {
                badge: styles.statusBadgeProcessing,
                text: styles.statusTextProcessing,
            };
        case 'Completed':
        case 'Delivered To Customer': // Final Delivery status (if tracked separately)
            return {
                badge: styles.statusBadgeCompleted,
                text: styles.statusTextCompleted,
            };
        case 'Cancelled':
        case 'Rejected':
            return {
                badge: styles.statusBadgeTerminated,
                text: styles.statusTextTerminated,
            };
        default:
            return { badge: styles.statusBadgeDefault, text: styles.statusTextDefault };
    }
};


export default function Activity() {
    const navigation = useNavigation();
    
    const [activeOrders, setActiveOrders] = useState<CustomerOrderPreview[]>([]);
    const [orderHistory, setOrderHistory] = useState<CustomerOrderPreview[]>([]);
    const [loading, setLoading] = useState(true);

    const user = getCurrentUser(); // 🔑 Get user from global session

    const loadActivity = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const fetchedOrders = await fetchCustomerOrders(userId);

            // 🔑 ACTIVE STATUS FILTERING LOGIC
            const active = fetchedOrders
                .filter(order => {
                    const orderStatus = order.status;
                    const deliveryStatus = order.deliveryStatus;

                    // Requested Active Filter: OrderStatus = 'To Weigh' or 'Processing' OR DeliveryStatus = 'To Pick-up' or 'For Delivery'
                    const isOrderActive = orderStatus === 'To Weigh' || orderStatus === 'Processing' || orderStatus === 'Payment Pending' || orderStatus === 'Pending';
                    const isDeliveryActive = deliveryStatus === 'To Pick-up' || deliveryStatus === 'For Delivery';
                    // We also need to keep the "Rider Booked" intermediate step visible if it was the last delivery status update
                    const isRiderBooked = deliveryStatus === 'Rider Booked'; 
                    
                    return isOrderActive || isDeliveryActive || isRiderBooked;
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // 2. Filter for history (Completed and Cancelled)
            const historyStatuses = ['Completed', 'Cancelled', 'Delivered To Customer'];
            const history = fetchedOrders
                .filter(order => historyStatuses.includes(order.status || '') || historyStatuses.includes(order.deliveryStatus || ''))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setActiveOrders(active); // 🔑 Set the array of active orders
            setOrderHistory(history);
            
        } catch (error) {
            console.error("Error loading customer activities:", error);
            Alert.alert("Error", "Failed to load order data.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect 1: Check user session and trigger loadActivity
    useFocusEffect(
        useCallback(() => {
            if (user?.UserID) {
                loadActivity(user.UserID);
            } else {
                console.warn("User not logged in. Redirecting to login...");
                // router.replace("/"); 
                setLoading(false);
            }
        }, [user?.UserID, loadActivity])
    );

    // Layout Effect for Header (Unchanged)
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
                    <Text style={{ color: "#2d2d2dff", marginLeft: 5, fontSize: 20, fontWeight: "600" }}>
                        Activity
                    </Text>
                </View>
            ),
        });
    }, [navigation]);


    // --- NAVIGATION HANDLER ---
    // 🔑 All orders (Active and History) go to the tracking screen
    const handleOrderPress = (order: CustomerOrderPreview) => {
        router.push({ 
            pathname: "/activity/track_order", 
            params: { 
                orderId: order.id, 
                status: order.status,
            } 
        });
    };

    // --- Loader State ---
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
    
    // Function to determine the single most relevant status for display
    const getDisplayStatus = (order: CustomerOrderPreview): string => {
        const orderStatus = order.status;
        const deliveryStatus = order.deliveryStatus;
        
        // Prioritize specific delivery movement
        if (deliveryStatus) {
             if (deliveryStatus === 'To Pick-up') return 'To Pick-up';
             if (deliveryStatus === 'For Delivery') return 'For Delivery';
             if (deliveryStatus === 'Rider Booked') return 'Rider Booked';
        }
        
        // Prioritize Order Status for processing/payment
        if (orderStatus === 'Payment Pending') return 'Payment Due';
        
        return orderStatus || 'Pending';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            
            {/* 🔑 --- ACTIVE ORDERS SECTION (Mapped List) --- */}
            <Text style={styles.sectionTitle}>Active Orders ({activeOrders.length})</Text>
            {activeOrders.length > 0 ? (
                activeOrders.map((order) => {
                    const displayStatus = getDisplayStatus(order);
                    const statusStyles = getStatusStyles(displayStatus);
                    const orderId = order.id;

                    return (
                        <View key={orderId} style={styles.card}>
                            <Image 
                                source={SHOP_LOGOS[order.shopName] || SHOP_LOGOS['default']} 
                                style={styles.logo} 
                            />
                            <View style={styles.details}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.orderId}>#{orderId}</Text>
                                    <View style={[styles.statusBadgeProgress, statusStyles.badge]}>
                                        <Text style={[styles.statusText, statusStyles.text]}>{displayStatus.toUpperCase()}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.orderText}>Shop: {order.shopName}</Text>
                                <Text style={styles.orderText}>Date: {formatDateTime(order.createdAt)}</Text>
                                
                                <Text style={styles.orderTotal}>
                                    Total: ₱ {parseAmount(order.totalAmount).toFixed(2)}
                                </Text>
                                
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => handleOrderPress(order)} 
                                >
                                    <Text style={styles.buttonText}>
                                        {/* 🔑 SIMPLIFIED TEXT */}
                                        Track My Order
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })
            ) : (
                <Text style={styles.noDataText}>No active orders currently.</Text>
            )}

            {/* --- Order History Section --- */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Order History ({orderHistory.length})</Text>
            {orderHistory.length > 0 ? (
                orderHistory.map((item, index) => {
                    const historyStatusStyles = getStatusStyles(item.status);
                    
                    return (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            onPress={() => handleOrderPress(item)}
                        >
                            <View style={styles.historyCard}>
                                <Image source={SHOP_LOGOS[item.shopName] || SHOP_LOGOS['default']} style={styles.historyLogo} />
                                <View style={styles.historyDetails}>
                                    <Text style={styles.historyId}>#{item.id}</Text>
                                    <Text style={styles.historyDate}>Date: {formatDateTime(item.createdAt)}</Text>
                                    <Text style={styles.orderTotal}>Total: ₱ {parseAmount(item.totalAmount).toFixed(2)}</Text>
                                </View>
                                {/* Apply dynamic status styles */}
                                <View style={[styles.deliveredBadge, historyStatusStyles.badge]}>
                                    <Text style={[styles.deliveredText, historyStatusStyles.text]}>
                                        {item.status?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <Text style={styles.noDataText}>No past orders found.</Text>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f6faff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
        marginBottom: 12,
    },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 20,
    },
    logo: {
        width: 85,
        height: 85,
        borderRadius: 10,
        marginRight: 14,
    },
    details: {
        flex: 1,
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    orderId: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000",
    },
    statusBadgeProgress: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1.5,
    },
    statusText: {
        fontWeight: "700",
        fontSize: 12,
        color: "#2d2d2dff",
    },
    orderText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 3,
    },
    orderTotal: {
        fontSize: 15,
        fontWeight: "600",
        marginTop: 4,
        color: "#004aad",
    },
    button: {
        backgroundColor: "#004aad",
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
        letterSpacing: 0.5,
    },
    historyCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 2,
    },
    historyLogo: {
        width: 65,
        height: 65,
        borderRadius: 10,
        marginRight: 14,
    },
    historyDetails: {
        flex: 1,
    },
    historyId: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111",
    },
    historyDate: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    deliveredBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1.5,
    },
    deliveredText: {
        fontWeight: "700",
        fontSize: 12,
    },
    noDataText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 10,
        fontSize: 15,
    },
// --- NEW DYNAMIC STATUS STYLES ---
    // Processing/Pending/For Delivery (Orange/Yellowish)
    statusBadgeProcessing: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
    },
    statusTextProcessing: {
        color: '#FF9800',
    },
    // Completed (Green)
    statusBadgeCompleted: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    statusTextCompleted: {
        color: '#4CAF50',
    },
    // Cancelled/Rejected (Red)
    statusBadgeTerminated: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
    },
    statusTextTerminated: {
        color: '#F44336',
    },
    // Default (Blue/Grey - Kept original styles for default status)
    statusBadgeDefault: {
        backgroundColor: "#D9F1FF",
        borderColor: "#0D47A1",
    },
    statusTextDefault: {
        color: "#004aad",
    }
});