import { router, useNavigation, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useCallback } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCustomerOrders, CustomerOrderPreview } from "@/lib/orders";
import { UserDetails } from "@/lib/auth"; 

// Helper to format date/time
const formatDateTime = (timestamp: string): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// --- MOCK DATA MAP (FOR LOGO/IMAGE) ---
const SHOP_LOGOS: { [key: string]: any } = {
    'Wash n’ Dry - Lahug': require("@/assets/images/washndry.png"),
    'Sparklean - Apas': require("@/assets/images/sparklean.jpg"),
    // Fallback to generic logo
    'default': require("@/assets/images/laundry.avif"),
};

// --- NEW HELPER FUNCTION FOR DYNAMIC STATUS STYLING ---
const getStatusStyles = (status: string | undefined) => {
    switch (status) {
        case 'Processing':
        case 'For Delivery':
        case 'Pending':
            return {
                badge: styles.statusBadgeProcessing,
                text: styles.statusTextProcessing,
            };
        case 'Completed':
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
    
    // Only keeping the necessary state variables
    const [recentOrderPreview, setRecentOrderPreview] = useState<CustomerOrderPreview | null>(null);
    const [orderHistory, setOrderHistory] = useState<CustomerOrderPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const loadActivity = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            // Step 1: Fetch all preview data (Efficient way to load history)
            const fetchedOrders = await fetchCustomerOrders(userId);

            const historyStatuses = ['Completed', 'Cancelled', 'Rejected'];
            
            // 1. Filter out inactive orders to find the single most "Recent/Active" one
            const activeOrders = fetchedOrders.filter(order => 
                !historyStatuses.includes(order.status)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // 2. Filter for history (Completed/Cancelled/Rejected)
            const history = fetchedOrders.filter(order => 
                historyStatuses.includes(order.status)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            // Set preview state
            const mostRecentActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null;
            setRecentOrderPreview(mostRecentActiveOrder);
            setOrderHistory(history);
            
        } catch (error) {
            console.error("Error loading customer activities:", error);
            Alert.alert("Error", "Failed to load order data.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect 1: Get User ID and trigger loadActivity
    useFocusEffect(
        useCallback(() => {
            const fetchUserId = async () => {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    const userDetails: UserDetails = JSON.parse(storedUser);
                    const userId = userDetails.UserID;
                    setCurrentUserId(userId);
                    loadActivity(userId);
                } else {
                    router.replace("/"); // Redirect if not logged in
                }
            };
            fetchUserId();
        }, [loadActivity])
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
                    <Text
                        style={{
                            color: "#2d2d2dff",
                            marginLeft: 5,
                            fontSize: 20,
                            fontWeight: "600",
                        }}
                    >
                        Activity
                    </Text>
                </View>
            ),
        });
    }, [navigation]);


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
    
    // Status and ID now depend only on recentOrderPreview
    const currentStatus = recentOrderPreview?.status;
    const currentOrderId = recentOrderPreview?.id;
    const recentStatusStyles = getStatusStyles(currentStatus);


    // 🔑 NEW NAVIGATION HANDLER
    const handleRecentOrderPress = () => {
        if (!recentOrderPreview || !currentStatus || !currentOrderId) return;

        const isTracking = currentStatus !== 'Pending' && currentStatus !== 'Cancelled' && currentStatus !== 'Rejected';
        
        const pathname = isTracking 
            ? "/(tabs)/activity/track_order" // Track My Order (Processing, For Delivery)
            : "/(tabs)/activity/receipt";    // View Details / History (Pending, Cancelled, Rejected)

        router.push({ 
            pathname: pathname,
            params: { 
                orderId: currentOrderId, 
                status: currentStatus,
                isHistory: 'false'
            } 
        });
    };


    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            
            {/* --- Recent Order Section --- */}
            <Text style={styles.sectionTitle}>Recent Order</Text>
            {recentOrderPreview ? (
                <View style={styles.card}>
                    <Image source={SHOP_LOGOS[recentOrderPreview.shopName] || SHOP_LOGOS['default']} style={styles.logo} />
                    <View style={styles.details}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.orderId}>#{currentOrderId}</Text>
                            {/* Apply dynamic status styles */}
                            <View style={[styles.statusBadgeProgress, recentStatusStyles.badge]}>
                                <Text style={[styles.statusText, recentStatusStyles.text]}>{currentStatus?.toUpperCase()}</Text>
                            </View>
                        </View>
                        
                        <Text style={styles.orderText}>Shop: {recentOrderPreview.shopName}</Text>
                        <Text style={styles.orderText}>Date: {formatDateTime(recentOrderPreview.createdAt)}</Text>
                        
                        {/* FIX APPLIED HERE: Use parseFloat on the totalAmount and fallback */}
                        <Text style={styles.orderTotal}>
                            Total: ₱ {
                                recentOrderPreview.totalAmount !== null && recentOrderPreview.totalAmount !== undefined 
                                    ? parseFloat(recentOrderPreview.totalAmount.toString()).toFixed(2)
                                    : '0.00'
                            }
                        </Text>
                        
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRecentOrderPress} // 🔑 Use the new handler
                        >
                            <Text style={styles.buttonText}>
                                {currentStatus === 'Pending' ? 'View Details' : 'Track My Order'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={styles.noDataText}>No active orders currently.</Text>
            )}

            {/* --- Order History Section --- */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Order History</Text>
            {orderHistory.length > 0 ? (
                orderHistory.map((item, index) => {
                    const historyStatusStyles = getStatusStyles(item.status);
                    
                    return (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            onPress={() => router.push({ 
                                // History always goes to Receipt/Summary View
                                pathname: "/(tabs)/activity/receipt", 
                                params: { 
                                    orderId: item.id, 
                                    status: item.status,
                                    isHistory: 'true' 
                                } 
                            })}
                        >
                            <View style={styles.historyCard}>
                                <Image source={SHOP_LOGOS[item.shopName] || SHOP_LOGOS['default']} style={styles.historyLogo} />
                                <View style={styles.historyDetails}>
                                    <Text style={styles.historyId}>#{item.id}</Text>
                                    <Text style={styles.historyDate}>Date: {formatDateTime(item.createdAt)}</Text>
                                </View>
                                {/* Apply dynamic status styles */}
                                <View style={[styles.deliveredBadge, historyStatusStyles.badge]}>
                                    <Text style={[styles.deliveredText, historyStatusStyles.text]}>
                                        {item.status.toUpperCase()}
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
    backgroundColor: "#E6FCD9", // Base for Pending/Processing
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#3EBE2A",
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
    backgroundColor: "#D9F1FF", // Base for Delivered
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#0D47A1",
  },
  deliveredText: {
    color: "#004aad",
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