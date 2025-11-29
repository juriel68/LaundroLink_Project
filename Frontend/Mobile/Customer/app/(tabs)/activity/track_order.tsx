import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { fetchOrderDetails, CustomerOrderDetails, fetchRawStatuses, RawStatuses } from "@/lib/orders"; 

// --- STATIC CORE DEFINITIONS ---
const ALL_PROCESS_STEPS = [
    // --- INCOMING ---
    { status: "To Pick-up", title: "Awaiting Rider Pickup", icon: "car-outline", key: "DELIVERY_IN_START" },
    { status: "Rider Booked To Pick-up", title: "Rider Booked (Pickup)", icon: "clipboard-outline", key: "DELIVERY_IN_BOOKED" }, 
    { status: "Arrived at Customer", title: "Rider at Customer Location", icon: "person-circle-outline", key: "DELIVERY_IN_OWN_ARRIVED" },
    { status: "Delivered In Shop", title: "Laundry Arrived at Shop", icon: "storefront-outline", key: "DELIVERY_IN_END" },

    // --- PRE-PROCESS ---
    { status: "To Weigh", title: "Awaiting Weigh-in", icon: "scale-outline", key: "ORDER_WEIGH" },
    
    // --- PROCESSING (Dynamic Section) ---
    { status: "Processing", title: "In Laundry Queue", icon: "time-outline", key: "PROCESS_START" }, 
    { status: "Washing", title: "Washing In Progress", icon: "water-outline", key: "PROCESS_WASH" },
    { status: "Drying", title: "Drying In Progress", icon: "sunny-outline", key: "PROCESS_DRY" },
    { status: "Pressing", title: "Steam Pressing", icon: "shirt-outline", key: "PROCESS_PRESS" },
    { status: "Folding", title: "Folding", icon: "layers-outline", key: "PROCESS_FOLD" },

    // --- OUTGOING ---
    { status: "For Delivery", title: "Ready for Delivery", icon: "archive-outline", key: "DELIVERY_OUT_START" },
    { status: "Rider Booked For Delivery", title: "Rider Booked (Delivery)", icon: "clipboard-outline", key: "DELIVERY_OUT_BOOKED" },
    { status: "Delivered To Customer", title: "Delivered To Customer", icon: "bicycle-outline", key: "DELIVERY_OUT_ENROUTE" },
    
    // --- FINAL ---
    { status: "Completed", title: "Order Complete", icon: "checkmark-done-outline", key: "FINAL_COMPLETE" },
    { status: "Cancelled", title: "Order Cancelled", icon: "close-circle-outline", key: "FINAL_CANCELLED" },
];

// 🟢 UPDATED: Service Flag Logic
const getServiceFlags = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    
    // Check for Full Service (Has everything)
    const isFullService = name.includes('full service');
    
    return {
        // Pressing is needed if name has "press" OR it is "full service"
        hasPressing: isFullService || name.includes('press'),
        
        // Folding is needed if name has "fold" OR it is "full service"
        hasFolding: isFullService || name.includes('fold')
    };
};

// Helper to detect Delivery Mode
const getDeliveryFlags = (deliveryType: string) => {
    const type = deliveryType.toLowerCase();
    return {
        isDropOff: type.includes('drop-off'),
        isPickup: type.includes('pick-up'),
        isDelivery: type.includes('delivery'),
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
    
    const allStatuses = {
        ...rawStatuses.orderStatus,
        ...rawStatuses.deliveryStatus,
        ...rawStatuses.orderProcessing
    };

    const finalTimelineSteps: string[] = [];

    // 1. INCOMING LOGISTICS
    if (delivery.isPickup) {
        finalTimelineSteps.push("To Pick-up");
        if (details.isOwnService) {
            finalTimelineSteps.push("Arrived at Customer"); 
        } else { 
            finalTimelineSteps.push("Rider Booked To Pick-up"); 
        }
        finalTimelineSteps.push("Delivered In Shop");
    } else { 
        finalTimelineSteps.push("Pending"); 
    }

    // 2. WEIGHING
    finalTimelineSteps.push("To Weigh");
    
    // 🟢 3. LAUNDRY PROCESSING (Dynamic based on Service Name)
    // Universal Steps (Since 'Press Only' was removed)
    finalTimelineSteps.push("Processing"); // Queue Status
    finalTimelineSteps.push("Washing");
    finalTimelineSteps.push("Drying");

    // Conditional Steps
    if (service.hasPressing) {
        finalTimelineSteps.push("Pressing");
    }
    
    if (service.hasFolding) {
        finalTimelineSteps.push("Folding");
    }

    // 4. OUTGOING LOGISTICS
    if (delivery.isDelivery) {
        finalTimelineSteps.push("For Delivery");
        if (!details.isOwnService) {
             finalTimelineSteps.push("Rider Booked For Delivery");
        }
        finalTimelineSteps.push("Delivered To Customer");
    }

    // 5. FINAL
    finalTimelineSteps.push("Completed");
    if (allStatuses["Cancelled"]) {
        finalTimelineSteps.push("Cancelled");
    }

    // Filter & Map
    const uniqueSteps = Array.from(new Set(finalTimelineSteps)).map(status => {
        return ALL_PROCESS_STEPS.find(step => step.status === status)!;
    }).filter(Boolean);


    // Completion & Active Logic
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
            isActive: false, 
        };
    });

    if (maxCompletedIndex !== -1) {
        if (mappedTimeline[maxCompletedIndex].status === 'Completed' || mappedTimeline[maxCompletedIndex].status === 'Cancelled') {
            mappedTimeline[maxCompletedIndex].isActive = true;
        } else if (maxCompletedIndex + 1 < mappedTimeline.length) {
            mappedTimeline[maxCompletedIndex].isActive = true;
        } else {
            mappedTimeline[maxCompletedIndex].isActive = true;
        }
    } else {
        if (mappedTimeline.length > 0) mappedTimeline[0].isActive = true;
    }

    return mappedTimeline;
};

export default function TrackOrder() {
    const router = useRouter();
    const navigation = useNavigation();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();

    const [rawStatuses, setRawStatuses] = useState<RawStatuses | null>(null);
    const [orderDetails, setOrderDetails] = useState<CustomerOrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;

        const loadTimeline = async () => {
            setLoading(true);
            try {
                const statuses = await fetchRawStatuses(orderId); 
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
    
    const finalTimeline = buildTimeline(orderDetails, rawStatuses);
    const currentStatusStep = finalTimeline.find(step => step.isActive) || finalTimeline[finalTimeline.length - 1];
    const providerIcon = orderDetails.isOwnService ? "bicycle" : "cube";

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.pickupCard}>
            <Ionicons name="alert-circle-outline" size={26} color="#004aad" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickupTime}>Current Status</Text>
              <Text style={styles.pickupNote}>
                {currentStatusStep?.title || orderDetails.orderStatus}
              </Text>

              {/* 🟢 NEW: Display Delivery Provider */}
              <View style={styles.providerContainer}>
                  <Ionicons name={providerIcon} size={14} color="#666" />
                  <Text style={styles.providerText}>
                      Via: <Text style={{fontWeight:'700', color:'#004aad'}}>{orderDetails.deliveryProvider}</Text>
                  </Text>
              </View>

            </View>
          </View>

          <View style={styles.timeline}>
            {finalTimeline.map((step, index) => {
                const isCompleted = step.isCompleted;
                const isActive = step.isActive;
                
                return (
                    <View key={index} style={styles.step}>
                      {index !== finalTimeline.length - 1 && (
                        <View style={[styles.connector, isCompleted ? styles.connectorActive : {}]} />
                      )}
                      <View style={[styles.stepIconWrapper, isActive ? styles.activeStep : isCompleted ? styles.completedStep : {}]}>
                        <Ionicons name={step.icon as any} size={22} color={isActive || isCompleted ? "#fff" : "#888"} />
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
                        <Text style={styles.stepTime}>{step.time || 'Awaiting...'}</Text>
                      </View>
                    </View>
                );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push({ pathname: "/activity/order_details", params: { orderId: orderDetails.orderId } })} 
          >
            <Text style={styles.buttonText}>View Order Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6faff" },
  scrollContent: { paddingBottom: 100 }, 
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000000ff" },
  pickupCard: { flexDirection: "row", backgroundColor: "#fff", margin: 15, padding: 15, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2 },
  pickupTime: { fontSize: 16, fontWeight: "bold", color: "#004aad" },
  pickupNote: { fontSize: 13, color: "#555", marginTop: 4 },
  providerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      backgroundColor: '#f0f4f8',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      alignSelf: 'flex-start'
  },
  providerText: {
      fontSize: 12,
      color: '#555',
      marginLeft: 6
  },
  timeline: { marginVertical: 20, marginLeft: 30, paddingRight: 20 },
  step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 35, position: "relative" },
  connector: { position: "absolute", left: 15, top: 28, width: 2, height: "100%", backgroundColor: "#ccc" },
  connectorActive: { backgroundColor: "#004aad" },
  stepIconWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#eee", justifyContent: "center", alignItems: "center", marginRight: 15, zIndex: 10 },
  activeStep: { backgroundColor: "#004aad" },
  completedStep: { backgroundColor: "#5EC1EF" },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "500", color: "#444" },
  stepTitleActive: { color: "#004aad", fontWeight: "700" },
  stepTime: { fontSize: 12, color: "#777", marginTop: 3 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderColor: "#e0e0e0", backgroundColor: "#fff", borderTopWidth: 1 },
  button: { margin: 20, backgroundColor: "#004aad", paddingVertical: 16, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});