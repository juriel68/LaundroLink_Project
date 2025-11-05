//track_order.tsx (Dynamic Timeline based on Service and Delivery)
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { fetchProcessHistory, OrderProcessStep, fetchOrderDetails, CustomerOrderDetails } from "@/lib/orders"; // Import fetchers

// --- STATIC BASE DEFINITIONS ---

// Define the core process steps available in the Order_Processing table
const CORE_PROCESS_STEPS = [
    { status: "Pending", title: "Order Placed", icon: "bag-check-outline", category: "REQUIRED", requiredBy: "ALL" },
    { status: "Washing", title: "Washing", icon: "water-outline", category: "REQUIRED", requiredBy: "ALL" },
    { status: "Drying", title: "Drying", icon: "sunny-outline", category: "REQUIRED", requiredBy: "ALL" },
    
    // Conditional Steps
    { status: "Steam Pressing", title: "Steam Pressing", icon: "shirt-outline", category: "CONDITIONAL", requiredBy: "PRESS" },
    { status: "Folding", title: "Folding", icon: "layers-outline", category: "CONDITIONAL", requiredBy: "FOLD" },

    // Delivery/Completion Steps
    { status: "Out for Delivery", title: "Out for Delivery", icon: "car-outline", category: "DELIVERY_CONDITIONAL", requiredBy: "DELIVERY" },
    { status: "Completed", title: "Completed", icon: "checkmark-done-outline", category: "REQUIRED", requiredBy: "ALL" },
];

// Helper to determine service type based on name
const getRequiredProcessType = (serviceName: string): string => {
    serviceName = serviceName.toLowerCase();
    if (serviceName.includes('press')) return "PRESS";
    if (serviceName.includes('fold')) return "FOLD";
    // Default to WASH if not press/fold service is specified (Wash & Dry only)
    return "WASH"; 
};

// Helper to determine delivery requirement based on name
const requiresDeliveryStep = (deliveryType: string): boolean => {
    deliveryType = deliveryType.toLowerCase();
    return deliveryType.includes('pick-up & delivery');
};

// Helper to map DB status to PROCESS_SEQUENCE index for current active step
const getStepIndex = (status: string) => {
    const statusMap: { [key: string]: number } = {
        'Pending': 0,
        'Washing': 1,
        'Drying': 2,
        'Steam Pressing': 3,
        'Folding': 4,
        'Ready for Pickup/Delivery': 5, 
        'For Delivery': 5, 
        'Out for Delivery': 5,
        'Completed': 6,
    };
    // Use the maximum index found, defaulting to 0 for unknown statuses
    return statusMap[status] ?? 0;
};


export default function TrackOrder() {
    const router = useRouter();
    const navigation = useNavigation();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();

    const [processHistory, setProcessHistory] = useState<OrderProcessStep[]>([]);
    const [orderDetails, setOrderDetails] = useState<CustomerOrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTimelineIndex, setActiveTimelineIndex] = useState(0); 

    // --- CORE FETCHING LOGIC ---
    useEffect(() => {
        if (!orderId) return;

        const loadTimeline = async () => {
          setLoading(true);
          try {
                // Fetch process history (timestamps of steps completed)
                const history = await fetchProcessHistory(orderId);
                // Fetch order details (to get service and delivery type)
                const details = await fetchOrderDetails(orderId); 

                if (details) {
                    setOrderDetails(details);
                    setProcessHistory(history);

                    // 1. Determine the highest completed step index
                    let maxCompletedIndex = 0;
                    history.forEach((h) => {
                        const index = getStepIndex(h.status);
                        // We track the highest index found in the history
                        if (index > maxCompletedIndex) {
                            maxCompletedIndex = index;
                        }
                    });

                    // 2. Set the index to be the LAST COMPLETED STEP (or 0 if history is empty)
                    setActiveTimelineIndex(maxCompletedIndex);
                } else {
                    Alert.alert("Error", `Order ${orderId} details not found.`);
                }
          } catch (error) {
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
            <Text style={styles.headerTitle}>Track My Order</Text>
          ),
      });
    }, [navigation]);

    if (loading || !orderDetails) {
        return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#004aad" />
            <Text style={{ marginTop: 10, color: '#555' }}>Loading tracking data...</Text>
          </View>
      );
    }
    
    // FINAL TIMELINE GENERATION based on Service/Delivery
    const processType = getRequiredProcessType(orderDetails.serviceName);
    const requiresDelivery = requiresDeliveryStep(orderDetails.deliveryType);
    
    const finalTimeline = CORE_PROCESS_STEPS.filter(step => {
        // Required steps (Order Placed, Washing, Drying, Completed) are always included.
        if (step.category === 'REQUIRED') return true; 

        // Conditional Service Steps (Pressing, Folding)
        if (step.category === 'CONDITIONAL' && step.requiredBy === processType) return true;
        
        // Conditional Delivery Steps
        if (step.category === 'DELIVERY_CONDITIONAL' && step.requiredBy === 'DELIVERY' && requiresDelivery) return true;

        return false;
    });


    return (
      <View style={styles.container}>
        {/* Scrollable content */}
        <ScrollView style={styles.scrollContent}>
          {/* Pickup Info Card (Now dynamic) */}
          <View style={styles.pickupCard}>
            <Ionicons name="time-outline" size={26} color="#004aad" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickupTime}>Order #{orderId}</Text>
              <Text style={styles.pickupNote}>Current Status: {orderDetails.status}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {finalTimeline.map((step, index) => { // Use the dynamic finalTimeline
              // Determine active state based on index
              const stepIndexInHistory = getStepIndex(step.status);
              const isActive = stepIndexInHistory === activeTimelineIndex;
              const isCompleted = stepIndexInHistory < activeTimelineIndex;
                
              // Find the actual time from the history (Order_Processing or Order_Status)
              const actualHistoryStep = processHistory.find(h => h.status === step.status);
              const displayTime = actualHistoryStep 
                  ? new Date(actualHistoryStep.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : 'N/A';

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
                    <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}
                    </Text>
                    <Text style={styles.stepTime}>{displayTime}</Text>
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
            onPress={() => router.push({ pathname: "/(tabs)/activity/order_details", params: { orderId } })} // 🔑 FIX: Navigate to order_details.tsx
          >
            <Text style={styles.buttonText}>View Order Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6faff" },
  scrollContent: { flex: 1 },

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
    left: -15,
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
  },
  activeStep: { backgroundColor: "#004aad" },
  completedStep: { backgroundColor: "#5EC1EF" },

  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "500", color: "#444" },
  stepTitleActive: { color: "#004aad", fontWeight: "700" },
  stepTime: { fontSize: 12, color: "#777", marginTop: 3 },

  // Footer Button
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
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});