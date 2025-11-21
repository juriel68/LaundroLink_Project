// app/home/updateProcess.tsx

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
import { updateProcessStatus, updateOrderStatus, fetchOrderDetails } from "@/lib/orders";
import Header from "@/components/Header";

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
    let steps: string[] = [];

    switch (serviceId) {
        case 'SV01': steps = ["Washing", "Drying", "Folding"]; break;
        case 'SV02': steps = ["Washing", "Drying", "Pressing"]; break;
        case 'SV03': steps = ["Pressing"]; break;
        case 'SV04': steps = ["Washing", "Drying", "Folding"]; break;
        case 'SV05': steps = ["Washing", "Drying", "Pressing", "Folding"]; break;
        default: steps = ["Washing", "Drying", "Folding"];
    }

    if (deliveryType === "Pick-up & Delivery" || deliveryType === "Delivery") {
        steps.push("Out for Delivery");
    } else {
        steps.push("Completed");
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
            const sId = (details as any).serviceId || 'SV01'; 
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
    
    if (selectedStatus === currentStatus) return Alert.alert("No Change", `Order is already "${currentStatus}".`);

    // Validation
    const currentIndex = dynamicOptions.indexOf(currentStatus || "");
    const targetIndex = dynamicOptions.indexOf(selectedStatus);

    if (targetIndex <= currentIndex && currentIndex !== -1) {
        return Alert.alert("Step Already Completed", `The order is already past "${selectedStatus}".`);
    }
    if (targetIndex > currentIndex + 1) {
        const requiredPrev = dynamicOptions[targetIndex - 1];
        return Alert.alert("Invalid Workflow", `Please complete "${requiredPrev}" first.`);
    }

    setIsSaving(true);
    let success = false;

    if (selectedStatus === "Out for Delivery" || selectedStatus === "Completed") {
        if (!currentUser) {
            Alert.alert("Error", "Session lost.");
            setIsSaving(false);
            return;
        }
        success = await updateOrderStatus(orderId, selectedStatus, currentUser.UserID, currentUser.UserRole);
    } else {
        success = await updateProcessStatus(orderId, selectedStatus);
    }

    setIsSaving(false);
    if (success) router.back();
    else Alert.alert("Error", "Failed to update status.");
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
                <Text style={styles.label}>Current Status</Text>
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
                const isMajorStatus = status === "Out for Delivery" || status === "Completed";

                return (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.optionItem, 
                            isSelected && styles.optionSelected,
                            isCurrent && styles.optionCurrent,
                            isCompleted && !isCurrent && styles.optionDisabled,
                            isMajorStatus && !isCompleted && !isSelected && { borderColor: '#004aad', borderWidth: 1 }
                        ]}
                        onPress={() => setSelectedStatus(status)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionContent}>
                            <View style={[
                                styles.iconContainer, 
                                isSelected && styles.iconSelected,
                                isCompleted && !isCurrent && styles.iconDisabled,
                                isMajorStatus && !isSelected && { backgroundColor: '#e3f2fd' }
                            ]}>
                                {isCurrent ? <Ionicons name="time" size={18} color="#e67e22" /> :
                                 isCompleted ? <Ionicons name="checkmark-done" size={18} color="#2ecc71" /> :
                                 isSelected ? <Ionicons name="checkmark" size={18} color="#fff" /> :
                                 <Ionicons name={isMajorStatus ? "flag" : "radio-button-off"} size={18} color={isMajorStatus ? "#004aad" : "#ccc"} />
                                }
                            </View>
                            <Text style={[
                                styles.optionText, 
                                // 🔑 FIX: Style priority was wrong. Selected white text must come last.
                                isMajorStatus && !isSelected && { color: '#004aad' },
                                isCurrent && styles.optionTextCurrent,
                                isCompleted && !isCurrent && styles.optionTextDisabled,
                                isSelected && styles.optionTextSelected, 
                            ]}>
                                {status}
                            </Text>
                        </View>
                        {isCurrent && <Text style={styles.currentTag}>Current</Text>}
                        {isCompleted && !isCurrent && <Text style={styles.completedTag}>Done</Text>}
                    </TouchableOpacity>
                );
            })}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
            // 🔑 FIX: Don't grey out the button while saving, keep it green
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