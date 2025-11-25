import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    ScrollView 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// 🔑 Import updateDeliveryWorkflow for simultaneous status update
import { updateProcessStatus, updateOrderStatus, updateDeliveryWorkflow, fetchOrderDetails } from "@/lib/orders"; 
import Header from "@/components/Header";

// 🔑 DEFINITIVE Configuration Map based on new database inserts (IDs 1-5)
const SERVICE_STEPS_MAP: { [key: string]: string[] } = {
    // 1: Wash & Dry
    "1": ["Washing", "Drying"], 
    
    // 2: Wash, Dry, & Fold
    "2": ["Washing", "Drying", "Folding"],
    
    // 3: Wash, Dry, & Pressing
    "3": ["Washing", "Drying", "Pressing"], 
    
    // 4: Press only
    "4": ["Pressing"], 
    
    // 5: Full Service (W, D, P, F)
    "5": ["Washing", "Drying", "Pressing", "Folding"], 
};

export default function UpdateProcess() {
    const { orderId, customer, currentStatus } = useLocalSearchParams<{
        orderId: string;
        customer: string;
        currentStatus?: string;
    }>();

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dynamicOptions, setDynamicOptions] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // --- 1. Define Logic ---
    const determineSteps = (serviceId: string, deliveryType: string) => {
        let steps = SERVICE_STEPS_MAP[serviceId] || SERVICE_STEPS_MAP["1"]; 

        // 🔑 FIXED LOGIC: Final step depends only on delivery status
        if (deliveryType.includes("Delivery")) {
            // Outward delivery is required: final status is Ready for Delivery
            steps = [...steps, "Ready for Delivery"];
        } else {
            // Drop-off or Pick-up Only: final status is immediately Completed
            steps = [...steps, "Completed"];
        } 
        
        return steps;
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const userStr = await AsyncStorage.getItem('user_session');
            if (userStr) setCurrentUser(JSON.parse(userStr));

            const details = await fetchOrderDetails(orderId);
            if (details) {
                const sId = String(details.serviceId); 
                const dType = details.deliveryType;
                
                const steps = determineSteps(sId, dType);
                setDynamicOptions(steps);
            }
            setLoading(false);
        };
        loadData();
    }, [orderId]);

    const handleSave = async () => {
        if (!selectedStatus) return Alert.alert("Selection Required", "Please select the next status.");
        
        const currentIndex = dynamicOptions.indexOf(currentStatus || "Washing"); 
        const targetIndex = dynamicOptions.indexOf(selectedStatus);

        // --- Basic Validation ---
        if (targetIndex <= currentIndex && currentIndex !== -1) {
            return Alert.alert("Step Already Completed", `The order is already past "${selectedStatus}".`);
        }
        
        if (targetIndex > currentIndex + 1 && targetIndex !== dynamicOptions.length - 1) {
            const requiredPrev = dynamicOptions[targetIndex - 1];
            return Alert.alert("Invalid Workflow", `Please complete "${requiredPrev}" first.`);
        }

        // --- API Execution ---

        setIsSaving(true);
        let success = false;
        const userId = currentUser?.UserID || 'Staff';
        const userRole = currentUser?.UserRole || 'Staff';

        const isFinalStatus = selectedStatus === "Ready for Delivery" || selectedStatus === "Completed";
        const isReadyForDelivery = selectedStatus === "Ready for Delivery";

        if (isFinalStatus) {
            // 🔑 UPDATED LOGIC: Handle final status updates
            
            if (isReadyForDelivery) {
                // Scenario: Laundry Processing Complete, Handover to Logistics.
                // Action: Update BOTH Order Status and Delivery Status
                success = await updateDeliveryWorkflow(
                    orderId, 
                    "For Delivery", // Sets Delivery_Status
                    selectedStatus, // Sets Order_Status to "Ready for Delivery"
                    userId, 
                    userRole
                );
            } else {
                // Scenario: Completed (Drop-off/Pickup Only). Only update Order Status.
                success = await updateOrderStatus(orderId, selectedStatus, userId, userRole);
            }

        } else {
            // 🔑 Action: Set the intermediate processing status (Washing, Drying, Pressing, Folding)
            success = await updateProcessStatus(orderId, selectedStatus, userId, userRole);
        }

        setIsSaving(false);
        if (success) {
            Alert.alert("Success", "Status updated successfully!", [{ text: "OK", onPress: () => router.back() }]);
        } else {
            Alert.alert("Error", "Failed to update status.");
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#004aad" /></View>;

    const currentStatusIndex = dynamicOptions.indexOf(currentStatus || "");

    return (
        <View style={styles.container}>
            <Header title="Update Process" showBack={true} />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Order #{orderId}</Text>
                        <Text style={styles.value}>{customer}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statusRow}>
                        <Text style={styles.label}>Current Stage</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{currentStatus || "Not Started"}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionHeader}>Select Next Step</Text>

                <View style={styles.optionsContainer}>
                    {dynamicOptions.map((status, index) => {
                        const isSelected = selectedStatus === status;
                        const isCurrent = currentStatus === status;
                        const isCompleted = index <= currentStatusIndex;
                        const isFinalStatus = status === "Ready for Delivery" || status === "Completed";

                        const isDisabled = isCompleted && !isCurrent;
                        
                        return (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.optionItem, 
                                    isSelected && styles.optionSelected,
                                    isCurrent && styles.optionCurrent,
                                    isDisabled && styles.optionDisabled,
                                    isFinalStatus && !isDisabled && { borderColor: '#004aad', borderWidth: 1 }
                                ]}
                                onPress={() => !isDisabled && !isCurrent && setSelectedStatus(status)}
                                activeOpacity={isDisabled || isCurrent ? 1 : 0.7}
                                disabled={isDisabled || isCurrent || isSaving}
                            >
                                <View style={styles.optionContent}>
                                    <View style={[
                                        styles.iconContainer, 
                                        isSelected && styles.iconSelected,
                                        isDisabled && styles.iconDisabled,
                                        isFinalStatus && !isDisabled && { backgroundColor: '#e3f2fd' }
                                    ]}>
                                        {isCurrent ? <Ionicons name="time" size={18} color="#e67e22" /> :
                                        isDisabled ? <Ionicons name="checkmark-done" size={18} color="#2ecc71" /> :
                                        isSelected ? <Ionicons name="checkmark" size={18} color="#fff" /> :
                                        <Ionicons name={isFinalStatus ? "flag" : "radio-button-off"} size={18} color={isFinalStatus ? "#004aad" : "#ccc"} />
                                        }
                                    </View>
                                    <Text style={[
                                        styles.optionText, 
                                        isFinalStatus && !isDisabled && { color: '#004aad' },
                                        isCurrent && styles.optionTextCurrent,
                                        isDisabled && styles.optionTextDisabled,
                                        isSelected && styles.optionTextSelected, 
                                    ]}>
                                        {status}
                                    </Text>
                                </View>
                                {isCurrent && <Text style={styles.currentTag}>Current</Text>}
                                {isDisabled && <Text style={styles.completedTag}>Done</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.saveButton, !selectedStatus && styles.saveButtonDisabled]} 
                    onPress={handleSave}
                    disabled={!selectedStatus || isSaving}
                >
                    {isSaving ? (
                        <View style={{flexDirection: 'row', alignItems:'center'}}>
                            <ActivityIndicator color="#fff" />
                            <Text style={[styles.saveText, {marginLeft: 8}]}>Updating...</Text>
                        </View>
                    ) : (
                        <Text style={styles.saveText}>Update Status</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f7fa" },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 100 },

    infoCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', marginBottom: 5 },
    label: { fontSize: 12, color: "#888", textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 16, fontWeight: "700", color: "#2c3e50" },
    divider: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { backgroundColor: '#eaf5ff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    statusText: { color: '#004aad', fontWeight: '700', fontSize: 14 },

    sectionHeader: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 10, marginLeft: 5 },

    optionsContainer: { gap: 10 },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: "#fff", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#eee', shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
    optionSelected: { backgroundColor: "#004aad", borderColor: "#004aad", transform: [{scale: 1.02}] },
    optionCurrent: { borderColor: "#e67e22", borderWidth: 1.5, backgroundColor: "#fffbf0" },
    optionDisabled: { backgroundColor: "#f9f9f9", borderColor: "#eee", opacity: 0.7 },

    optionContent: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
    iconDisabled: { backgroundColor: '#eaffef' },
    
    optionText: { fontSize: 16, fontWeight: '600', color: '#444' },
    optionTextSelected: { color: '#fff' },
    optionTextCurrent: { color: '#d35400' },
    optionTextDisabled: { color: '#aaa', textDecorationLine: 'line-through' },
    
    currentTag: { fontSize: 10, fontWeight: 'bold', color: '#e67e22', textTransform: 'uppercase' },
    completedTag: { fontSize: 10, fontWeight: 'bold', color: '#2ecc71', textTransform: 'uppercase' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
    saveButton: { backgroundColor: "#2ecc71", paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: "#2ecc71", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    saveButtonDisabled: { backgroundColor: "#ccc", shadowOpacity: 0 },
    saveText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});