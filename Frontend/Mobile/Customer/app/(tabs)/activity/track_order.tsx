import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { fetchOrderDetails, CustomerOrderDetails, fetchRawStatuses, RawStatuses } from "@/lib/orders"; 

// --- STATIC CORE DEFINITIONS ---
const ALL_PROCESS_STEPS = [
    // ----------------------------------------------------
    // INCOMING LOGISTICS (Pickup from Customer) - Group 1
    // ----------------------------------------------------
    { status: "To Pick-up", title: "Awaiting Rider Pickup", icon: "car-outline", key: "DELIVERY_IN_START" },
    { status: "Rider Booked", title: "Rider Booked / En Route", icon: "clipboard-outline", key: "DELIVERY_IN_BOOKED" },
    { status: "Arrived at Customer", title: "Rider at Customer Location", icon: "person-circle-outline", key: "DELIVERY_IN_OWN_ARRIVED" },
    { status: "Delivered In Shop", title: "Laundry Arrived at Shop", icon: "storefront-outline", key: "DELIVERY_IN_END" },

    // ----------------------------------------------------
    // INITIAL ORDER & WEIGHING - Group 2 (REQUIRED)
    // ----------------------------------------------------
    { status: "To Weigh", title: "Awaiting Weigh-in", icon: "scale-outline", key: "ORDER_WEIGH" },
    
    // ----------------------------------------------------
    // LAUNDRY PROCESSING - Group 3
    // ----------------------------------------------------
    { status: "Processing", title: "In Laundry Queue", icon: "time-outline", key: "PROCESS_START" }, // Order Status
    { status: "Washing", title: "Washing In Progress", icon: "water-outline", key: "PROCESS_WASH" },
    { status: "Drying", title: "Drying In Progress", icon: "sunny-outline", key: "PROCESS_DRY" },
    { status: "Steam Pressing", title: "Steam Pressing", icon: "shirt-outline", key: "PROCESS_PRESS" },
    { status: "Folding", title: "Folding", icon: "layers-outline", key: "PROCESS_FOLD" },

    // ----------------------------------------------------
    // OUTGOING LOGISTICS (Delivery to Customer) - Group 4
    // ----------------------------------------------------
    { status: "For Delivery", title: "Ready for Delivery", icon: "archive-outline", key: "DELIVERY_OUT_START" },
    { status: "Out for Delivery", title: "Out for Delivery", icon: "bicycle-outline", key: "DELIVERY_OUT_ENROUTE" },
    
    // ----------------------------------------------------
    // FINAL - Group 5
    // ----------------------------------------------------
    { status: "Completed", title: "Order Complete", icon: "checkmark-done-outline", key: "FINAL_COMPLETE" },
    { status: "Cancelled", title: "Order Cancelled", icon: "close-circle-outline", key: "FINAL_CANCELLED" },
];

// Helper to check for conditional service steps
const getServiceFlags = (serviceName: string) => {
    serviceName = serviceName.toLowerCase();
    return {
        isPress: serviceName.includes('press'),
        isFold: serviceName.includes('fold'),
    };
};

// Helper to check for delivery types
const getDeliveryFlags = (deliveryType: string) => {
    deliveryType = deliveryType.toLowerCase();
    return {
        isDropOff: deliveryType.includes('drop-off'),
        isPickup: deliveryType.includes('pick-up'),
        isDelivery: deliveryType.includes('delivery'),
        isOwnService: deliveryType.includes('own service'), // Assuming this is part of your order details payload
        isThirdParty: !deliveryType.includes('own service'), // Default assumption
    };
};

// --- CORE TIMELINE BUILDER ---
interface TimelineStep {
    status: string;
    title: string;
    icon: string;
    time?: string;
    isCompleted: boolean;
    isActive: boolean;
}

// Helper to map DB status to PROCESS_SEQUENCE index
const getStepIndex = (status: string) => {
    const step = ALL_PROCESS_STEPS.find(s => s.status === status);
    return step ? ALL_PROCESS_STEPS.indexOf(step) : -1;
};

// Helper to format times for display
const formatTime = (time: string | undefined): string => {
    if (!time) return '';
    try {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'N/A';
    }
}

const buildTimeline = (details: CustomerOrderDetails, rawStatuses: RawStatuses): TimelineStep[] => {
    const service = getServiceFlags(details.serviceName || '');
    const delivery = getDeliveryFlags(details.deliveryType || '');
    
    // Merge process history (Washing, Drying) with core status history
    const allStatuses = {
        ...rawStatuses.orderStatus,
        ...rawStatuses.deliveryStatus,
        ...rawStatuses.orderProcessing
    };

    const finalTimelineSteps: string[] = [];

    // Group 1: INCOMING LOGISTICS (Pick-up only)
    if (delivery.isPickup) {
        if (delivery.isOwnService) {
            finalTimelineSteps.push("To Pick-up", "Arrived at Customer");
        } else { // 3rd Party
            finalTimelineSteps.push("To Pick-up", "Rider Booked", "Delivered In Shop");
        }
    } else { // Drop-off / For Delivery (Start with Placed)
        finalTimelineSteps.push("Pending");
    }

    // Group 2: INITIAL ORDER & WEIGHING
    finalTimelineSteps.push("To Weigh");
    
    // Group 3: LAUNDRY PROCESSING
    finalTimelineSteps.push("Processing", "Washing", "Drying");
    if (service.isPress) finalTimelineSteps.push("Steam Pressing");
    if (service.isFold) finalTimelineSteps.push("Folding");

    // Group 4: OUTGOING LOGISTICS (Delivery only)
    if (delivery.isDelivery) {
        finalTimelineSteps.push("For Delivery", "Out for Delivery");
    }

    // Group 5: FINAL
    finalTimelineSteps.push("Completed", "Cancelled");

    // Filter and map the unique steps to the final structure
    const uniqueSteps = Array.from(new Set(finalTimelineSteps)).map(status => {
        return ALL_PROCESS_STEPS.find(step => step.status === status)!;
    }).filter(Boolean);


    // Determine Completion Index and Map Final Timeline
    let maxCompletedIndex = -1;
    const mappedTimeline = uniqueSteps.map((step, index) => {
        const historyTime = allStatuses[step.status]?.time;
        const isCompleted = !!historyTime;

        if (isCompleted) {
            maxCompletedIndex = index;
        }

        return {
            status: step.status,
            title: step.title,
            icon: step.icon,
            time: historyTime ? formatTime(historyTime) : undefined,
            isCompleted: isCompleted,
            isActive: false, // Will be set after loop
        };
    });

    // Mark the last completed step as Active
    if (maxCompletedIndex !== -1 && mappedTimeline[maxCompletedIndex]) {
        mappedTimeline[maxCompletedIndex].isActive = true;
    }

    return mappedTimeline;
};
// --- END CORE TIMELINE BUILDER ---


export default function TrackOrder() {
    const router = useRouter();
    const navigation = useNavigation();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();

    const [rawStatuses, setRawStatuses] = useState<RawStatuses | null>(null);
    const [orderDetails, setOrderDetails] = useState<CustomerOrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // --- CORE FETCHING LOGIC ---
    useEffect(() => {
        if (!orderId) return;

        const loadTimeline = async () => {
            setLoading(true);
            try {
                // Fetch consolidated status history
                const statuses = await fetchRawStatuses(orderId); 
                // Fetch order details (to get service and delivery type)
                const details = await fetchOrderDetails(orderId); 

                if (details && statuses) {
                    setOrderDetails(details);
                    setRawStatuses(statuses);
                } else {
                    Alert.alert("Error", `Order ${orderId} details not found.`);
                }
            } catch (error) {
                console.error("Error loading tracking information:", error);
                Alert.alert("Error", "Failed to load tracking information.");
            } finally {
                setLoading(false);
            }
        };
        loadTimeline();
    }, [orderId]);


    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: {
                backgroundColor: "#89CFF0",
                borderBottomWidth: 1,
                borderBottomColor: "#5EC1EF",
            },
            headerTintColor: "#000000ff",
            headerShadowVisible: false,
            headerTitle: () => (
                <Text style={styles.headerTitle}>Track Order #{orderId}</Text>
            ),
        });
    }, [navigation, orderId]);

    if (loading || !orderDetails || !rawStatuses) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#004aad" />
                <Text style={{ marginTop: 10, color: '#555' }}>Loading tracking data...</Text>
            </SafeAreaView>
        );
    }
    
    // BUILD THE FINAL TIMELINE based on retrieved data
    const finalTimeline = buildTimeline(orderDetails, rawStatuses);
    const currentStatusStep = finalTimeline.find(step => step.isActive);


    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Status Card */}
          <View style={styles.pickupCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#004aad" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickupTime}>Current Status</Text>
              <Text style={styles.pickupNote}>
                {currentStatusStep?.title || orderDetails.orderStatus}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {finalTimeline.map((step, index) => {
                const isCompleted = step.isCompleted;
                const isActive = step.isActive;
                
                return (
                    <View key={index} style={styles.step}>
                      {/* Connector line */}
                      {index !== finalTimeline.length - 1 && (
                        <View
                          style={[
                            styles.connector,
                            isCompleted ? styles.connectorActive : {},
                          ]}
                        />
                      )}

                      {/* Step Icon */}
                      <View
                        style={[
                          styles.stepIconWrapper,
                          isActive ? styles.activeStep : isCompleted ? styles.completedStep : {},
                        ]}
                      >
                        <Ionicons
                          name={step.icon as any} 
                          size={22}
                          color={isActive || isCompleted ? "#fff" : "#888"}
                        />
                      </View>

                      {/* Step Content */}
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>
                            {step.title}
                        </Text>
                        <Text style={styles.stepTime}>{step.time || 'Awaiting...'}</Text>
                      </View>
                    </View>
                );
            })}
          </View>
        </ScrollView>

        {/* Fixed Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push({ pathname: "/activity/order_details", params: { orderId: orderDetails.orderId } })} // Navigate to order_details
          >
            <Text style={styles.buttonText}>View Order Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6faff" },
  scrollContent: { paddingBottom: 100 }, // Added padding to clear footer

  // Header
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000ff",
  },

  // Pickup Card
  pickupCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  pickupTime: { fontSize: 16, fontWeight: "bold", color: "#004aad" },
  pickupNote: { fontSize: 13, color: "#555", marginTop: 4 },

  // Timeline
  timeline: { marginVertical: 20, marginLeft: 30, paddingRight: 20 },
  step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 35, position: "relative" },

  connector: {
    position: "absolute",
    left: 15,
    top: 28,
    width: 2,
    height: "100%",
    backgroundColor: "#ccc",
  },
  connectorActive: {
    backgroundColor: "#004aad",
  },

  stepIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    zIndex: 10,
  },
  activeStep: { backgroundColor: "#004aad" },
  completedStep: { backgroundColor: "#5EC1EF" },

  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "500", color: "#444" },
  stepTitleActive: { color: "#004aad", fontWeight: "700" },
  stepTime: { fontSize: 12, color: "#777", marginTop: 3 },

  // Footer Button
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
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});